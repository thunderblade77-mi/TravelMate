import { useMemo, useState } from 'react'

import { useExpenses } from '../../hooks/useExpenses'

import type {
  Expense,
  ExpenseCategory,
  ExpenseSplitKind,
} from '../../types/expense'
import type { Trip } from '../../types/travel'
import AppIcon from '../ui/AppIcon'

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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

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
  } = useExpenses(activeTrip?.id, activeTrip?.budget ?? 0)

  const filteredExpenses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return expenses.filter((expense) => {
      const matchesCategory =
        selectedCategory === 'all' || expense.category === selectedCategory

      const matchesSearch =
        normalizedSearch.length === 0 ||
        expense.title.toLowerCase().includes(normalizedSearch) ||
        expense.merchant.toLowerCase().includes(normalizedSearch) ||
        expense.notes.toLowerCase().includes(normalizedSearch) ||
        expense.paidBy.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [expenses, search, selectedCategory])

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

  function handleSubmit(values: ExpenseFormValues) {
    if (!activeTrip) return

    if (editingExpense) {
      updateExpense(editingExpense.id, values)
    } else {
      addExpense({ ...values, tripId: activeTrip.id })
    }

    closeForm()
  }

  function handleDeleteRequest(expense: Expense) {
    setExpenseToDelete(expense)
  }

  function handleDeleteConfirm() {
    if (!expenseToDelete) return
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
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Spese di viaggio</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Budget e spese</h1>
        </div>

        <article className="rounded-[2rem] border border-dashed border-emerald-200 bg-white/75 p-8 text-center shadow-lg shadow-slate-200/45 backdrop-blur-xl">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <AppIcon name="wallet" className="h-8 w-8" />
          </span>
          <h2 className="mt-5 text-xl font-bold">Nessun viaggio attivo</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Seleziona o crea un viaggio per iniziare a registrare le spese.
          </p>
        </article>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            {activeTrip.destination}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Spese</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Budget, categorie, luoghi e divisione tra partecipanti o famiglie.
          </p>
        </div>

        <button type="button" onClick={openCreateForm} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 transition active:scale-95" aria-label="Aggiungi una spesa">
          <AppIcon name="plus" className="h-6 w-6" />
        </button>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/70 p-1 shadow-xl shadow-slate-200/45 backdrop-blur-xl">
        <ExpenseSummary budget={activeTrip.budget} totalSpent={totalSpent} remainingBudget={remainingBudget} budgetUsedPercentage={budgetUsedPercentage} expenseCount={expenseCount} formatCurrency={formatCurrency} />
      </div>

      {categoryTotals.length > 0 && (
        <div className="mt-5 rounded-[1.75rem] border border-white/70 bg-white/75 p-1 shadow-lg shadow-slate-200/45 backdrop-blur-xl">
          <ExpenseCategoryChart categories={categoryTotals} formatCurrency={formatCurrency} />
        </div>
      )}

      {(merchantTotals.length > 0 || settlementTotals.length > 0) && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {merchantTotals.length > 0 && (
            <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-200/45 backdrop-blur-xl">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><AppIcon name="pin" className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">Dove sono stati spesi</p><h2 className="mt-0.5 text-lg font-bold">Luoghi ed esercenti</h2></div></div>
              <div className="mt-4 space-y-2.5">{merchantTotals.slice(0, 8).map((item) => <div key={item.merchant} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 px-3 py-2.5"><span className="min-w-0 truncate text-sm text-slate-700">{item.merchant}</span><strong className="shrink-0 text-sm text-slate-900">{formatCurrency(item.total)}</strong></div>)}</div>
            </article>
          )}
          {settlementTotals.length > 0 && (
            <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-lg shadow-slate-200/45 backdrop-blur-xl">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><AppIcon name="users" className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Divisione spese</p><h2 className="mt-0.5 text-lg font-bold">Saldo del gruppo</h2></div></div>
              <p className="mt-2 text-xs text-slate-500">Positivo = deve ricevere. Negativo = deve versare.</p>
              <div className="mt-4 space-y-2.5">{settlementTotals.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 px-3 py-2.5"><span className="min-w-0 truncate text-sm text-slate-700">{item.name}</span><strong className={`shrink-0 text-sm ${item.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{item.balance >= 0 ? '+' : ''}{formatCurrency(item.balance)}</strong></div>)}</div>
            </article>
          )}
        </div>
      )}

      <div className="mt-7">
        <div className="mb-4 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Cronologia</p><h2 className="mt-1 text-xl font-bold">Movimenti</h2><p className="mt-1 text-sm text-slate-500">{expenseCount === 0 ? 'Nessuna spesa registrata' : expenseCount === 1 ? '1 spesa registrata' : `${expenseCount} spese registrate`}</p></div><button type="button" onClick={openCreateForm} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition active:scale-[0.98]"><AppIcon name="plus" className="h-4 w-4" />Nuova</button></div>
        {expenseCount > 0 && <div className="rounded-[1.5rem] border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur-xl"><ExpenseFilters search={search} selectedCategory={selectedCategory} onSearchChange={setSearch} onCategoryChange={setSelectedCategory} /></div>}
        {expenseCount === 0 ? (
          <article className="mt-5 rounded-[2rem] border border-dashed border-emerald-200 bg-white/75 p-8 text-center shadow-lg shadow-slate-200/40 backdrop-blur-xl"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600"><AppIcon name="wallet" className="h-8 w-8" /></span><h3 className="mt-5 text-xl font-bold">Ancora nessuna spesa</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Registra ristoranti, spesa, taxi, hotel, attività e tutte le altre spese del viaggio.</p><button type="button" onClick={openCreateForm} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 font-semibold text-white shadow-md shadow-emerald-200 transition active:scale-[0.98]"><AppIcon name="plus" className="h-5 w-5" />Aggiungi la prima spesa</button></article>
        ) : filteredExpenses.length === 0 ? (
          <article className="mt-5 rounded-[2rem] border border-dashed border-slate-300 bg-white/75 p-8 text-center shadow-sm backdrop-blur-xl"><h3 className="text-lg font-bold">Nessun risultato</h3><p className="mt-2 text-sm text-slate-500">Prova a modificare la ricerca o la categoria.</p><button type="button" onClick={clearFilters} className="mt-5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition active:scale-[0.98]">Azzera filtri</button></article>
        ) : <div className="mt-5 space-y-3">{filteredExpenses.map((expense) => <ExpenseCard key={expense.id} expense={expense} formatCurrency={formatCurrency} onEdit={openEditForm} onDelete={handleDeleteRequest} />)}</div>}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-white/70 bg-white/95 p-5 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:p-6"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">{activeTrip.destination}</p><h2 className="mt-1 text-2xl font-bold">{editingExpense ? 'Modifica spesa' : 'Nuova spesa'}</h2></div><button type="button" onClick={closeForm} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition active:scale-95" aria-label="Chiudi">×</button></div><ExpenseForm tripId={activeTrip.id} initialExpense={editingExpense} onSubmit={handleSubmit} onCancel={closeForm} /></div></div>
      )}

      <DeleteExpenseDialog expense={expenseToDelete} open={expenseToDelete !== null} onConfirm={handleDeleteConfirm} onCancel={() => setExpenseToDelete(null)} />
    </section>
  )
}
