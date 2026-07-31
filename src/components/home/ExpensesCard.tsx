type ExpensesCardProps = {
  expenseCount: number
  totalSpent: number
  formatCurrency: (amount: number) => string
  onOpenExpenses: () => void
}

export default function ExpensesCard({
  expenseCount,
  totalSpent,
  formatCurrency,
  onOpenExpenses,
}: ExpensesCardProps) {
  return (
    <button
      type="button"
      onClick={onOpenExpenses}
      className="mt-5 w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-2xl">
            🧾
          </span>

          <div>
            <p className="font-semibold">
              Spese del viaggio
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {expenseCount === 0
                ? 'Nessuna spesa registrata'
                : expenseCount === 1
                  ? '1 spesa registrata'
                  : `${expenseCount} spese registrate`}
            </p>
          </div>
        </div>

        <span className="shrink-0 text-emerald-600">
          →
        </span>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Totale speso
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {formatCurrency(totalSpent)}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {expenseCount === 0
            ? 'Nessuna spesa registrata'
            : expenseCount === 1
              ? '1 spesa registrata'
              : `${expenseCount} spese registrate`}
        </p>
      </div>
    </button>
  )
}