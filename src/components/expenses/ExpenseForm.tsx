import { useEffect, useState } from 'react'

import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  type Expense,
  type ExpenseSplitKind,
} from '../../types/expense'

type ExpenseFormValues = {
  title: string
  merchant: string
  amount: string
  category: Expense['category']
  date: string
  paidBy: string
  paymentMethod: Expense['paymentMethod']
  splitKind: ExpenseSplitKind
  splitWith: string
  notes: string
}

type ExpenseFormProps = {
  initialExpense?: Expense | null
  onSubmit: (values: {
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
  }) => void
  onCancel: () => void
}

function today() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ExpenseForm({
  initialExpense,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [values, setValues] =
    useState<ExpenseFormValues>({
      title: '',
      merchant: '',
      amount: '',
      category: 'restaurant',
      date: today(),
      paidBy: '',
      paymentMethod: 'card',
      splitKind: 'none',
      splitWith: '',
      notes: '',
    })

  useEffect(() => {
    if (!initialExpense) {
      return
    }

    setValues({
      title: initialExpense.title,
      merchant: initialExpense.merchant,
      amount: String(initialExpense.amount),
      category: initialExpense.category,
      date: initialExpense.date,
      paidBy: initialExpense.paidBy,
      paymentMethod:
        initialExpense.paymentMethod,
      splitKind: initialExpense.splitKind,
      splitWith: initialExpense.splitWith.join(', '),
      notes: initialExpense.notes,
    })
  }, [initialExpense])

  function updateField<
    K extends keyof ExpenseFormValues,
  >(field: K, value: ExpenseFormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    const amount = Number(values.amount)

    if (
      !values.title.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return
    }

    const splitWith = values.splitKind === 'none'
      ? []
      : values.splitWith
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)

    onSubmit({
      title: values.title.trim(),
      merchant: values.merchant.trim(),
      amount,
      category: values.category,
      date: values.date,
      paidBy: values.paidBy.trim(),
      paymentMethod:
        values.paymentMethod,
      splitKind: values.splitKind,
      splitWith,
      notes: values.notes.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">
          Descrizione
        </label>

        <input
          value={values.title}
          onChange={(e) =>
            updateField(
              'title',
              e.target.value,
            )
          }
          className="w-full rounded-xl border border-slate-300 p-3"
          placeholder="Es. Cena di pesce"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Dove hai speso
        </label>

        <input
          value={values.merchant}
          onChange={(e) =>
            updateField(
              'merchant',
              e.target.value,
            )
          }
          className="w-full rounded-xl border border-slate-300 p-3"
          placeholder="Es. Restaurante O Pescador, Lisbona"
        />

        <p className="mt-1 text-xs text-slate-500">
          Serve per il riepilogo finale dei luoghi dove sono stati spesi i soldi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Importo
          </label>

          <input
            type="number"
            step="0.01"
            value={values.amount}
            onChange={(e) =>
              updateField(
                'amount',
                e.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-300 p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Data
          </label>

          <input
            type="date"
            value={values.date}
            onChange={(e) =>
              updateField(
                'date',
                e.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-300 p-3"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Categoria
        </label>

        <select
          value={values.category}
          onChange={(e) =>
            updateField(
              'category',
              e.target.value as Expense['category'],
            )
          }
          className="w-full rounded-xl border border-slate-300 p-3"
        >
          {EXPENSE_CATEGORY_OPTIONS.map(
            (category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.icon}{' '}
                {category.label}
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Pagato da
        </label>

        <input
          value={values.paidBy}
          onChange={(e) =>
            updateField(
              'paidBy',
              e.target.value,
            )
          }
          className="w-full rounded-xl border border-slate-300 p-3"
          placeholder="Es. Stefano / Famiglia Rossi"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Divisione
          </label>

          <select
            value={values.splitKind}
            onChange={(e) =>
              updateField(
                'splitKind',
                e.target.value as ExpenseSplitKind,
              )
            }
            className="w-full rounded-xl border border-slate-300 p-3"
          >
            <option value="none">Non dividere</option>
            <option value="participants">Per partecipanti</option>
            <option value="families">Per famiglie</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Metodo
          </label>

          <select
            value={values.paymentMethod}
            onChange={(e) =>
              updateField(
                'paymentMethod',
                e.target.value as Expense['paymentMethod'],
              )
            }
            className="w-full rounded-xl border border-slate-300 p-3"
          >
            {EXPENSE_PAYMENT_METHOD_OPTIONS.map(
              (method) => (
                <option
                  key={method.value}
                  value={method.value}
                >
                  {method.label}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {values.splitKind !== 'none' && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Dividi tra
          </label>

          <input
            value={values.splitWith}
            onChange={(e) =>
              updateField(
                'splitWith',
                e.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-300 p-3"
            placeholder={
              values.splitKind === 'families'
                ? 'Famiglia Rossi, Famiglia Bianchi'
                : 'Stefano, Alessandro, Anna, Sara'
            }
          />

          <p className="mt-1 text-xs text-slate-500">
            Separa i nomi con una virgola. Per ora la quota viene divisa in parti uguali.
          </p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">
          Note
        </label>

        <textarea
          rows={3}
          value={values.notes}
          onChange={(e) =>
            updateField(
              'notes',
              e.target.value,
            )
          }
          className="w-full rounded-xl border border-slate-300 p-3"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-300 px-5 py-2"
        >
          Annulla
        </button>

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white"
        >
          {initialExpense
            ? 'Salva modifiche'
            : 'Aggiungi spesa'}
        </button>
      </div>
    </form>
  )
}