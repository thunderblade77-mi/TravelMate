import { useEffect, useState } from 'react'

import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  type Expense,
} from '../../types/expense'

type ExpenseFormValues = {
  title: string
  amount: string
  category: Expense['category']
  date: string
  paidBy: string
  paymentMethod: Expense['paymentMethod']
  notes: string
}

type ExpenseFormProps = {
  initialExpense?: Expense | null
  onSubmit: (values: {
    title: string
    amount: number
    category: Expense['category']
    date: string
    paidBy: string
    paymentMethod: Expense['paymentMethod']
    notes: string
  }) => void
  onCancel: () => void
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function ExpenseForm({
  initialExpense,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [values, setValues] =
    useState<ExpenseFormValues>({
      title: '',
      amount: '',
      category: 'food',
      date: today(),
      paidBy: '',
      paymentMethod: 'card',
      notes: '',
    })

  useEffect(() => {
    if (!initialExpense) {
      return
    }

    setValues({
      title: initialExpense.title,
      amount: String(initialExpense.amount),
      category: initialExpense.category,
      date: initialExpense.date,
      paidBy: initialExpense.paidBy,
      paymentMethod:
        initialExpense.paymentMethod,
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

    onSubmit({
      title: values.title.trim(),
      amount,
      category: values.category,
      date: values.date,
      paidBy: values.paidBy.trim(),
      paymentMethod:
        values.paymentMethod,
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
          placeholder="Es. Cena al ristorante"
        />
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
          placeholder="Mario"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Metodo di pagamento
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