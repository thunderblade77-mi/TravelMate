type ChecklistSummaryCardProps = {
  progress: number
  totalCount: number
  completedCount: number
  onOpenChecklist: () => void
}

export default function ChecklistSummaryCard({
  progress,
  totalCount,
  completedCount,
  onOpenChecklist,
}: ChecklistSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onOpenChecklist}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">
          {progress === 100 && totalCount > 0 ? '🏆' : '✅'}
        </span>

        <span className="text-xs font-semibold text-blue-600">
          Checklist
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold">
        {totalCount === 0 ? '0%' : `${progress}%`}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {totalCount === 0
          ? 'Nessun elemento'
          : `${completedCount} di ${totalCount} completati`}
      </p>
    </button>
  )
}