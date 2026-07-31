import type { Expense } from '../../types/expense'

type DeleteExpenseDialogProps = {
  expense: Expense | null
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteExpenseDialog({
  expense,
  open,
  onConfirm,
  onCancel,
}: DeleteExpenseDialogProps) {
  if (!open || !expense) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-3xl">
          🗑️
        </div>

        <h2 className="mt-5 text-xl font-bold">
          Eliminare questa spesa?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          La spesa
          <span className="font-semibold">
            {' '}
            "{expense.title}"
          </span>
          {' '}verrà eliminata definitivamente.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white"
          >
            Elimina
          </button>
        </div>
      </div>
    </div>
  )
}