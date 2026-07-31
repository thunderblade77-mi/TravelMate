type ExpenseSummaryProps = {
  budget: number
  totalSpent: number
  remainingBudget: number
  budgetUsedPercentage: number
  expenseCount: number
  formatCurrency: (amount: number) => string
}

function getBudgetStatus(
  remainingBudget: number,
  budgetUsedPercentage: number,
) {
  if (remainingBudget < 0) {
    return {
      label: 'Budget superato',
      description: `Hai superato il budget del ${Math.max(
        0,
        budgetUsedPercentage - 100,
      )}%`,
      icon: '⚠️',
      badgeClasses:
        'bg-red-100 text-red-700',
      progressClasses: 'bg-red-500',
    }
  }

  if (budgetUsedPercentage >= 80) {
    return {
      label: 'Budget quasi esaurito',
      description: 'Tieni sotto controllo le prossime spese',
      icon: '⏳',
      badgeClasses:
        'bg-amber-100 text-amber-700',
      progressClasses: 'bg-amber-500',
    }
  }

  if (budgetUsedPercentage >= 50) {
    return {
      label: 'Budget sotto controllo',
      description: 'Hai utilizzato più della metà del budget',
      icon: '📊',
      badgeClasses:
        'bg-blue-100 text-blue-700',
      progressClasses: 'bg-blue-600',
    }
  }

  return {
    label: 'Budget disponibile',
    description: 'Le spese sono ancora sotto controllo',
    icon: '💰',
    badgeClasses:
      'bg-emerald-100 text-emerald-700',
    progressClasses: 'bg-emerald-500',
  }
}

export default function ExpenseSummary({
  budget,
  totalSpent,
  remainingBudget,
  budgetUsedPercentage,
  expenseCount,
  formatCurrency,
}: ExpenseSummaryProps) {
  const budgetStatus = getBudgetStatus(
    remainingBudget,
    budgetUsedPercentage,
  )

  const displayedPercentage = Math.min(
    100,
    Math.max(0, budgetUsedPercentage),
  )

  const hasBudget = budget > 0

  return (
    <section>
      <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-200">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-100">
                Budget del viaggio
              </p>

              <p className="mt-2 text-3xl font-bold">
                {formatCurrency(budget)}
              </p>
            </div>

            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
              💳
            </span>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-emerald-100">
                Totale speso
              </p>

              <p className="mt-2 text-xl font-bold">
                {formatCurrency(totalSpent)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-wide text-emerald-100">
                Rimanente
              </p>

              <p
                className={`mt-2 text-xl font-bold ${
                  remainingBudget < 0
                    ? 'text-red-200'
                    : ''
                }`}
              >
                {formatCurrency(remainingBudget)}
              </p>
            </div>
          </div>

          {hasBudget ? (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-emerald-50">
                  Budget utilizzato
                </p>

                <p className="text-sm font-bold">
                  {budgetUsedPercentage}%
                </p>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remainingBudget < 0
                      ? 'bg-red-300'
                      : 'bg-white'
                  }`}
                  style={{
                    width: `${displayedPercentage}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-semibold">
                Budget non impostato
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-100">
                Puoi aggiungere un budget modificando i dati
                del viaggio.
              </p>
            </div>
          )}
        </div>
      </article>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🧾</span>

            <span className="text-xs font-semibold text-slate-400">
              Totale
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold">
            {expenseCount}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {expenseCount === 1
              ? 'spesa registrata'
              : 'spese registrate'}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-2xl">
              {budgetStatus.icon}
            </span>

            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${budgetStatus.badgeClasses}`}
            >
              Stato
            </span>
          </div>

          <p className="mt-4 font-bold">
            {hasBudget
              ? budgetStatus.label
              : 'Da impostare'}
          </p>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            {hasBudget
              ? budgetStatus.description
              : 'Inserisci un budget per monitorare le spese'}
          </p>
        </article>
      </div>

      {hasBudget && (
        <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold">
                Avanzamento budget
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {remainingBudget < 0
                  ? `Superato di ${formatCurrency(
                      Math.abs(remainingBudget),
                    )}`
                  : `Restano ${formatCurrency(
                      remainingBudget,
                    )}`}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${budgetStatus.badgeClasses}`}
            >
              {budgetUsedPercentage}%
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${budgetStatus.progressClasses}`}
              style={{
                width: `${displayedPercentage}%`,
              }}
            />
          </div>
        </article>
      )}
    </section>
  )
}