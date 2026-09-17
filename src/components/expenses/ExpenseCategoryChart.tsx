import {
  EXPENSE_CATEGORY_OPTIONS,
  type ExpenseCategory,
} from '../../types/expense'

type CategoryTotal = {
  category: ExpenseCategory
  total: number
  percentage: number
}

type ExpenseCategoryChartProps = {
  categories: CategoryTotal[]
  formatCurrency: (amount: number) => string
}

const CATEGORY_COLORS: Record<
  ExpenseCategory,
  string
> = {
  restaurant: '#f97316',
  bar: '#fb7185',
  groceries: '#84cc16',
  taxi: '#facc15',
  fuel: '#ef4444',
  tolls: '#a855f7',
  parking: '#6366f1',
  accommodation: '#8b5cf6',
  activities: '#ec4899',
  shopping: '#eab308',
  transport: '#3b82f6',
  health: '#14b8a6',
  other: '#64748b',
  food: '#f97316',
}

const CHART_RADIUS = 46
const CHART_CIRCUMFERENCE =
  2 * Math.PI * CHART_RADIUS

export default function ExpenseCategoryChart({
  categories,
  formatCurrency,
}: ExpenseCategoryChartProps) {
  const totalSpent = categories.reduce(
    (total, category) =>
      total + category.total,
    0,
  )

  if (
    categories.length === 0 ||
    totalSpent <= 0
  ) {
    return null
  }

  let accumulatedLength = 0

  const chartSegments = categories.map(
    (item) => {
      const exactPercentage =
        (item.total / totalSpent) * 100

      const segmentLength =
        (exactPercentage / 100) *
        CHART_CIRCUMFERENCE

      const segment = {
        ...item,
        segmentLength,
        dashOffset: -accumulatedLength,
      }

      accumulatedLength += segmentLength

      return segment
    },
  )

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-600">
          Analisi
        </p>

        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Spese per categoria
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Scopri come è distribuito il budget del
          viaggio.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
        <div className="flex justify-center">
          <div className="relative h-52 w-52">
            <svg
              viewBox="0 0 120 120"
              className="h-full w-full -rotate-90"
              role="img"
              aria-label="Grafico delle spese per categoria"
            >
              <circle
                cx="60"
                cy="60"
                r={CHART_RADIUS}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="14"
              />

              {chartSegments.map(
                (segment) => (
                  <circle
                    key={segment.category}
                    cx="60"
                    cy="60"
                    r={CHART_RADIUS}
                    fill="none"
                    stroke={
                      CATEGORY_COLORS[
                        segment.category
                      ]
                    }
                    strokeWidth="14"
                    strokeDasharray={`${segment.segmentLength} ${
                      CHART_CIRCUMFERENCE -
                      segment.segmentLength
                    }`}
                    strokeDashoffset={
                      segment.dashOffset
                    }
                    strokeLinecap="butt"
                    className="transition-all duration-500"
                  />
                ),
              )}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl">
                💰
              </span>

              <strong className="mt-1 max-w-32 truncate text-xl font-bold text-slate-900">
                {formatCurrency(totalSpent)}
              </strong>

              <span className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                Spesi
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          {categories.map((item) => {
            const option =
              EXPENSE_CATEGORY_OPTIONS.find(
                (category) =>
                  category.value ===
                  item.category,
              )

            return (
              <div key={item.category}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[
                            item.category
                          ],
                      }}
                    />

                    <span className="text-xl">
                      {option?.icon ?? '📦'}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {option?.label ??
                          item.category}
                      </p>

                      <p className="text-sm text-slate-500">
                        {formatCurrency(
                          item.total,
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {item.percentage}%
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        item.percentage,
                        100,
                      )}%`,
                      backgroundColor:
                        CATEGORY_COLORS[
                          item.category
                        ],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}