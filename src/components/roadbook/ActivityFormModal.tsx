import { type FormEvent } from 'react'

import type {
  ActivityCategory,
  RoadbookDay,
} from '../../types/roadbook'

type ActivityFormModalProps = {
  isOpen: boolean
  isEditing: boolean
  selectedDay: RoadbookDay | null

  time: string
  title: string
  location: string
  notes: string
  category: ActivityCategory

  onTimeChange: (value: string) => void
  onTitleChange: (value: string) => void
  onLocationChange: (value: string) => void
  onNotesChange: (value: string) => void
  onCategoryChange: (
    value: ActivityCategory,
  ) => void

  onClose: () => void
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void
}

const categoryOptions: {
  value: ActivityCategory
  label: string
  icon: string
}[] = [
  {
    value: 'visita',
    label: 'Visita',
    icon: '📍',
  },
  {
    value: 'ristorante',
    label: 'Ristorante',
    icon: '🍽️',
  },
  {
    value: 'hotel',
    label: 'Hotel',
    icon: '🛏️',
  },
  {
    value: 'trasporto',
    label: 'Trasporto',
    icon: '🚗',
  },
  {
    value: 'altro',
    label: 'Altro',
    icon: '✨',
  },
]

export default function ActivityFormModal({
  isOpen,
  isEditing,
  selectedDay,
  time,
  title,
  location,
  notes,
  category,
  onTimeChange,
  onTitleChange,
  onLocationChange,
  onNotesChange,
  onCategoryChange,
  onClose,
  onSubmit,
}: ActivityFormModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 sm:items-center sm:p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Chiudi finestra"
      />

      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-slate-50 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" />

        <div className="mt-5 flex items-start justify-between gap-4 sm:mt-0">
          <div>
            <p className="text-sm font-medium text-blue-600">
              {selectedDay?.label}
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {isEditing
                ? 'Modifica attività'
                : 'Nuova attività'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? 'Aggiorna i dettagli dell’attività.'
                : 'Aggiungi una nuova tappa alla giornata.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition active:scale-95"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-6 max-h-[65vh] space-y-4 overflow-y-auto pr-1"
        >
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Ora
              </span>

              <input
                type="time"
                value={time}
                onChange={(event) =>
                  onTimeChange(event.target.value)
                }
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-sm font-semibold">
                Categoria
              </span>

              <select
                value={category}
                onChange={(event) =>
                  onCategoryChange(
                    event.target
                      .value as ActivityCategory,
                  )
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {categoryOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.icon}{' '}
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Titolo
            </span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                onTitleChange(event.target.value)
              }
              placeholder="Es. Visita al Colosseo"
              required
              autoFocus
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Luogo
            </span>

            <input
              type="text"
              value={location}
              onChange={(event) =>
                onLocationChange(
                  event.target.value,
                )
              }
              placeholder="Es. Piazza del Colosseo, Roma"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Note
            </span>

            <textarea
              value={notes}
              onChange={(event) =>
                onNotesChange(event.target.value)
              }
              placeholder="Biglietti, informazioni, promemoria..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 transition active:scale-[0.99]"
          >
            {isEditing
              ? 'Salva modifiche'
              : 'Salva attività'}
          </button>
        </form>
      </div>
    </div>
  )
}