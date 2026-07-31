import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import type {
  ActivityCategory,
  RoadbookDay,
} from '../../types/roadbook'

import type {
  MapPoint,
  MapPointType,
} from '../../types/map'

export type ImportMapActivityInput = {
  dayId: string
  time: string
  title: string
  location: string
  notes: string
  category: ActivityCategory
  mapPointId: string
}

type ImportMapModalProps = {
  isOpen: boolean
  mapPoints: MapPoint[]
  days: RoadbookDay[]
  defaultDayId: string | null
  importedMapPointIds?: string[]
  onClose: () => void
  onImport: (input: ImportMapActivityInput) => void
}

function getPointIcon(type: MapPointType): string {
  switch (type) {
    case 'hotel':
      return '🏨'

    case 'restaurant':
      return '🍽️'

    case 'attraction':
      return '📸'

    case 'transport':
      return '🚆'
  }
}

function getPointTypeLabel(
  type: MapPointType,
): string {
  switch (type) {
    case 'hotel':
      return 'Hotel'

    case 'restaurant':
      return 'Ristorante'

    case 'attraction':
      return 'Attrazione'

    case 'transport':
      return 'Trasporto'
  }
}

function convertPointTypeToCategory(
  type: MapPointType,
): ActivityCategory {
  switch (type) {
    case 'hotel':
      return 'hotel'

    case 'restaurant':
      return 'ristorante'

    case 'attraction':
      return 'visita'

    case 'transport':
      return 'trasporto'
  }
}

function formatDayLabel(day: RoadbookDay): string {
  const formattedDate = new Intl.DateTimeFormat(
    'it-IT',
    {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    },
  ).format(new Date(`${day.date}T12:00:00`))

  return `${day.label} · ${formattedDate}`
}

export function ImportMapModal({
  isOpen,
  mapPoints,
  days,
  defaultDayId,
  importedMapPointIds = [],
  onClose,
  onImport,
}: ImportMapModalProps) {
  const availableMapPoints = useMemo(
    () =>
      mapPoints.filter(
        (point) =>
          !importedMapPointIds.includes(point.id),
      ),
    [importedMapPointIds, mapPoints],
  )

  const [selectedPointId, setSelectedPointId] =
    useState('')

  const [selectedDayId, setSelectedDayId] =
    useState('')

  const [time, setTime] = useState('09:00')

  const selectedPoint =
    availableMapPoints.find(
      (point) => point.id === selectedPointId,
    ) ?? null

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setSelectedPointId(
      availableMapPoints[0]?.id ?? '',
    )

    const validDefaultDay = days.some(
      (day) => day.id === defaultDayId,
    )

    setSelectedDayId(
      validDefaultDay
        ? defaultDayId ?? ''
        : days[0]?.id ?? '',
    )

    setTime('09:00')
  }, [
    availableMapPoints,
    days,
    defaultDayId,
    isOpen,
  ])

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !selectedPoint ||
      !selectedDayId ||
      !time
    ) {
      return
    }

    onImport({
      dayId: selectedDayId,
      time,
      title: selectedPoint.name,
      location: selectedPoint.location ?? '',
      notes: '',
      category: convertPointTypeToCategory(
        selectedPoint.type,
      ),
      mapPointId: selectedPoint.id,
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Chiudi importazione"
      />

      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-slate-50 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300" />

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Roadbook
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Importa dalla mappa
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Scegli un punto e assegnalo a un giorno
              del viaggio.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>

        {availableMapPoints.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-7 text-center">
            <span className="text-4xl">🗺️</span>

            <h3 className="mt-4 text-lg font-bold">
              Nessun punto da importare
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Tutti i punti sono già stati importati
              oppure la mappa è ancora vuota.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Chiudi
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <p className="mb-3 text-sm font-semibold">
                Punto della mappa
              </p>

              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {availableMapPoints.map((point) => {
                  const isSelected =
                    point.id === selectedPointId

                  return (
                    <button
                      type="button"
                      key={point.id}
                      onClick={() =>
                        setSelectedPointId(point.id)
                      }
                      className={`w-full rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-100'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl">
                          {getPointIcon(point.type)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <strong className="block">
                              {point.name}
                            </strong>

                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-xs text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </span>
                          </div>

                          <p className="mt-1 text-xs font-medium text-blue-600">
                            {getPointTypeLabel(
                              point.type,
                            )}
                          </p>

                          {point.location && (
                            <p className="mt-2 text-sm leading-5 text-slate-500">
                              📍 {point.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  Giorno
                </span>

                <select
                  value={selectedDayId}
                  onChange={(event) =>
                    setSelectedDayId(
                      event.target.value,
                    )
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {days.map((day) => (
                    <option
                      key={day.id}
                      value={day.id}
                    >
                      {formatDayLabel(day)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">
                  Ora
                </span>

                <input
                  type="time"
                  value={time}
                  onChange={(event) =>
                    setTime(event.target.value)
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
            </div>

            {selectedPoint && (
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Anteprima attività
                </p>

                <p className="mt-2 font-bold">
                  {getPointIcon(selectedPoint.type)}{' '}
                  {selectedPoint.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {time} ·{' '}
                  {getPointTypeLabel(
                    selectedPoint.type,
                  )}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                !selectedPoint ||
                !selectedDayId ||
                !time
              }
              className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              Importa nel Roadbook
            </button>
          </form>
        )}
      </div>
    </div>
  )
}