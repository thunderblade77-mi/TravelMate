import {
  EXPENSE_CATEGORY_OPTIONS,
  type ExpenseCategory,
} from '../../types/expense'

type ExpenseFiltersProps = {
  search: string
  selectedCategory: ExpenseCategory | 'all'
  onSearchChange: (value: string) => void
  onCategoryChange: (
    value: ExpenseCategory | 'all',
  ) => void
}

export default function ExpenseFilters({
  search,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
}: ExpenseFiltersProps) {
  return (
    <section className="space-y-3">
      <input
        type="search"
        value={search}
        onChange={(e) =>
          onSearchChange(e.target.value)
        }
        placeholder="🔍 Cerca una spesa..."
        className="w-full rounded-2xl border border-slate-300 p-3"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100'
          }`}
        >
          Tutte
        </button>

        {EXPENSE_CATEGORY_OPTIONS.map(
          (category) => (
            <button
              key={category.value}
              type="button"
              onClick={() =>
                onCategoryChange(category.value)
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === category.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100'
              }`}
            >
              {category.icon} {category.label}
            </button>
          ),
        )}
      </div>
    </section>
  )
}