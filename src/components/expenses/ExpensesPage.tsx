import { useMemo, useState } from 'react'

import { useExpenses } from '../../hooks/useExpenses'

import type {
  Expense,
  ExpenseCategory,
  ExpenseSplitKind,
} from '../../types/expense'
import type { Trip } from '../../types/travel'

import DeleteExpenseDialog from './DeleteExpenseDialog'
import ExpenseCard from './ExpenseCard'
import ExpenseCategoryChart from './ExpenseCategoryChart'
import ExpenseFilters from './ExpenseFilters'
import ExpenseForm from './ExpenseForm'
import ExpenseSummary from './ExpenseSummary'

type ExpensesPageProps = {
  activeTrip: Trip | null
  formatCurrency: (amount: number) => string
}

type ExpenseFormValues = {
  title: string
  merchant: string
  amount: number
  category: Expense['category']
  date: string
  paidBy: string
  paymentMethod: Expense['paymentMethod']
  splitKind: ExpenseSplitKind
  splitWith: string[]
  notes: string
}

export default function ExpensesPage({
  activeTrip,
  formatCurrency,
}: ExpensesPageProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory | 'all'>('all')

  const [isFormOpen, setIsFormOpen] =
    useState(false)

  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null)

  const [expenseToDelete, setExpenseToDelete] =
    useState<Expense | null>(null)

  const {
    expenses,
    expenseCount,
    totalSpent,
    remainingBudget,
    budgetUsedPercentage,
    categoryTotals,
    merchantTotals,
    settlementTotals,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useExpenses(
    activeTrip?.id,
    activeTrip?.budget ?? 0,
  )

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return expenses.filter((expense) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        expense.category === selectedCategory

      const matchesSearch =
        normalizedSearch.length === 0 ||
        expense.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        expense.merchant
          .toLowerCase()
          .includes(normalizedSearch) ||
        expense.notes
          .toLowerCase()
          .includes(normalizedSearch) ||
        expense.paidBy
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [
    expenses,
    search,
    selectedCategory,
  ])

  function openCreateForm() {
    setEditingExpense(null)
    setIsFormOpen(true)
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingExpense(null)
  }

  function handleSubmit(
    values: ExpenseFormValues,
  ) {
    if (!activeTrip) {
      return
    }

    if (editingExpense) {
      updateExpense(editingExpense.id, values)
    } else {
      addExpense({
        ...values,
        tripId: activeTrip.id,
      })
    }

    closeForm()
  }

  function handleDeleteRequest(
    expense: Expense,
  ) {
    setExpenseToDelete(expense)
  }

  function handleDeleteConfirm() {
    if (!expenseToDelete) {
      return
    }

    deleteExpense(expenseToDelete.id)
    setExpenseToDelete(null)
  }

  function clearFilters() {
    setSearch('')
    setSelectedCategory('all')
  }

  if (!activeTrip) {
    return (
      <section>
        <div className="mb-7">
          <p className="text-sm font-medium text-emerald-600">
            Spese di viaggio
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Budget e spese
          </h1>
        </div>

        <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="text-5xl">💰</span>

          <h2 className="mt-5 text-xl font-bold">
            Nessun viaggio attivo
          </h2>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Seleziona o crea un viaggio per iniziare a
            registrare le spese.
          </p>
        </article>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-600">
            {activeTrip.destination}
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Spese
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Budget, categorie, luoghi e divisione tra partecipanti o famiglie.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-semibold text-white shadow-lg shadow-emerald-200 transition active:scale-95"
          aria-label="Aggiungi una spesa"
        >
          +
        </button>
      </div>

      <ExpenseSummary
        budget={activeTrip.budget}
        totalSpent={totalSpent}
        remainingBudget={remainingBudget}
        budgetUsedPercentage={
          budgetUsedPercentage
        }
        expenseCount={expenseCount}
        formatCurrency={formatCurrency}
      />

      {categoryTotals.length > 0 && (
        <div className="mt-6">
          <ExpenseCategoryChart
            categories={categoryTotals}
            formatCurrency={formatCurrency}
          />
        </div>
      )}

      {(merchantTotals.length > 0 || settlementTotals.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {merchantTotals.length > 0 && (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-emerald-600">
                Dove sono stati spesi
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Luoghi ed esercenti
              </h2>
              <div className="mt-4 space-y-3">
                {merchantTotals.slice(0, 8).map((item) => (
                  <div
                    key={item.merchant}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0 truncate text-sm text-slate-700">
                      📍 {item.merchant}
                    </span>
                    <strong className="shrink-0 text-sm">
                      {formatCurrency(item.total)}
                    </strong>
                  </div>
                ))}
              </div>
            </article>
          )}

          {settlementTotals.length > 0 && (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-600">
                Divisione spese
              </p>
              <h2 className="mt-1 text-xl font-bold">
                Saldo partecipanti / famiglie
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Positivo = deve ricevere. Negativo = deve versare.
              </p>
              <div className="mt-4 space-y-3">
                {settlementTotals.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0 truncate text-sm text-slate-700">
                      👤 {item.name}
                    </span>
                    <strong
                      className={`shrink-0 text-sm ${
                        item.balance >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {item.balance >= 0 ? '+' : ''}
                      {formatCurrency(item.balance)}
                    </strong>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      )}

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">
              Movimenti
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {expenseCount === 0
                ? 'Nessuna spesa registrata'
                : expenseCount === 1
                  ? '1 spesa registrata'
                  : `${expenseCount} spese registrate`}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
          >
            + Nuova
          </button>
        </div>

        {expenseCount > 0 && (
          <ExpenseFilters
            search={search}
            selectedCategory={selectedCategory}
            onSearchChange={setSearch}
            onCategoryChange={
              setSelectedCategory
            }
          />
        )}

        {expenseCount === 0 ? (
          <article className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <span className="text-5xl">🧾</span>

            <h3 className="mt-5 text-xl font-bold">
              Ancora nessuna spesa
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Registra ristoranti, spesa, taxi, hotel, attività e tutte le altre spese del viaggio.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-6 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition active:scale-[0.98]"
            >
              Aggiungi la prima spesa
            </button>
          </article>
        ) : filteredExpenses.length === 0 ? (
          <article className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <span className="text-4xl">🔍</span>

            <h3 className="mt-4 text-lg font-bold">
              Nessun risultato
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Prova a modificare la ricerca o la categoria.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition active:scale-[0.98]"
            >
              Azzera filtri
            </button>
          </article>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                formatCurrency={formatCurrency}
                onEdit={openEditForm}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-3xl sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-600">
                  {activeTrip.destination}
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {editingExpense
                    ? 'Modifica spesa'
                    : 'Nuova spesa'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition active:scale-95"
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>

            <ExpenseForm
              initialExpense={editingExpense}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      <DeleteExpenseDialog
        expense={expenseToDelete}
        open={expenseToDelete !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() =>
          setExpenseToDelete(null)
        }
      />
    </section>
  )
}