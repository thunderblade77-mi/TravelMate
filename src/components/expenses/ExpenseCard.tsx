import {
  EXPENSE_CATEGORY_OPTIONS,
  type Expense,
} from '../../types/expense'

type ExpenseCardProps = {
  expense: Expense
  formatCurrency: (amount: number) => string
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export default function ExpenseCard({
  expense,
  formatCurrency,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const category =
    EXPENSE_CATEGORY_OPTIONS.find(
      (option) =>
        option.value === expense.category,
    )

  const splitLabel =
    expense.splitKind === 'families'
      ? 'Famiglie'
      : expense.splitKind === 'participants'
        ? 'Partecipanti'
        : null

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            {category?.icon ?? '💰'}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold">
              {expense.title}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {category?.label ?? 'Altro'}
            </p>

            {expense.merchant && (
              <p className="mt-1 truncate text-sm font-medium text-slate-700">
                📍 {expense.merchant}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>
                📅 {expense.date}
              </span>

              {expense.paidBy && (
                <span>
                  👤 {expense.paidBy}
                </span>
              )}
            </div>

            {splitLabel && expense.splitWith.length > 0 && (
              <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <strong>{splitLabel}:</strong>{' '}
                {expense.splitWith.join(', ')}
              </div>
            )}

            {expense.notes && (
              <p className="mt-2 text-sm text-slate-600">
                {expense.notes}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-emerald-600">
            {formatCurrency(expense.amount)}
          </p>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onEdit(expense)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm transition hover:bg-slate-50"
            >
              ✏️
            </button>

            <button
              type="button"
              onClick={() =>
                onDelete(expense)
              }
              className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 transition hover:bg-red-50"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}