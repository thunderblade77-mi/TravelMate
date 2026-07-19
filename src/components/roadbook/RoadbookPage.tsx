import { useMemo, useState, type FormEvent } from 'react'

import { useRoadbook } from '../../hooks/useRoadbook'

import type {
  ActivityCategory,
  RoadbookDay,
} from '../../types/roadbook'

import type { Trip } from '../../types/travel'

type RoadbookPageProps = {
  activeTrip: Trip | null
  onBack: () => void
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

function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`))
}

function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`))
}

function createTripDays(
  startDate: string,
  endDate: string,
): RoadbookDay[] {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return []
  }

  const days: RoadbookDay[] = []
  const currentDate = new Date(start)
  let dayNumber = 1

  while (currentDate <= end) {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const date = `${year}-${month}-${day}`

    days.push({
      id: date,
      date,
      label: `Giorno ${dayNumber}`,
    })

    currentDate.setDate(currentDate.getDate() + 1)
    dayNumber += 1
  }

  return days
}

function getCategoryDetails(category: ActivityCategory) {
  return (
    categoryOptions.find(
      (option) => option.value === category,
    ) ?? categoryOptions[4]
  )
}

export default function RoadbookPage({
  activeTrip,
  onBack,
}: RoadbookPageProps) {
  const {
    activities,
    createActivity,
    toggleCompleted,
    removeActivity,
  } = useRoadbook(activeTrip?.id ?? null)

  const days = useMemo(() => {
    if (!activeTrip) {
      return []
    }

    return createTripDays(
      activeTrip.startDate,
      activeTrip.endDate,
    )
  }, [activeTrip])

  const [selectedDayId, setSelectedDayId] = useState<
    string | null
  >(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [time, setTime] = useState('09:00')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const [category, setCategory] =
    useState<ActivityCategory>('visita')

  const currentDayId =
    days.some((day) => day.id === selectedDayId)
      ? selectedDayId
      : days[0]?.id ?? null

  const selectedDay =
    days.find((day) => day.id === currentDayId) ?? null

  const selectedDayActivities = activities
    .filter((activity) => activity.dayId === currentDayId)
    .sort((firstActivity, secondActivity) =>
      firstActivity.time.localeCompare(secondActivity.time),
    )

  function resetForm() {
    setTime('09:00')
    setTitle('')
    setLocation('')
    setNotes('')
    setCategory('visita')
  }

  function openActivityForm() {
    resetForm()
    setIsFormOpen(true)
  }

  function closeActivityForm() {
    resetForm()
    setIsFormOpen(false)
  }

  function handleCreateActivity(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!currentDayId || !title.trim()) {
      return
    }

    createActivity({
      dayId: currentDayId,
      time,
      title: title.trim(),
      location: location.trim(),
      notes: notes.trim(),
      category,
    })

    closeActivityForm()
  }

  if (!activeTrip) {
    return (
      <section>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-blue-600"
        >
          ← Torna alla Home
        </button>

        <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="text-5xl">📖</span>

          <h1 className="mt-5 text-2xl font-bold">
            Nessun viaggio attivo
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Crea o seleziona un viaggio per iniziare a costruire
            il Roadbook.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-blue-600"
        >
          ← Home
        </button>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {days.length}{' '}
          {days.length === 1 ? 'giorno' : 'giorni'}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-blue-600">
          Roadbook
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {activeTrip.destination}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Organizza ogni giornata del tuo viaggio.
        </p>
      </div>

      <div className="-mx-5 mt-7 overflow-x-auto px-5 pb-2">
        <div className="flex min-w-max gap-3">
          {days.map((day) => {
            const isSelected = day.id === currentDayId

            const activityCount = activities.filter(
              (activity) => activity.dayId === day.id,
            ).length

            return (
              <button
                type="button"
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={`min-w-28 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <span
                  className={`block text-xs font-semibold ${
                    isSelected
                      ? 'text-blue-100'
                      : 'text-slate-500'
                  }`}
                >
                  {day.label}
                </span>

                <strong className="mt-1 block capitalize">
                  {formatShortDate(day.date)}
                </strong>

                <span
                  className={`mt-2 block text-xs ${
                    isSelected
                      ? 'text-blue-100'
                      : 'text-slate-400'
                  }`}
                >
                  {activityCount}{' '}
                  {activityCount === 1
                    ? 'attività'
                    : 'attività'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {selectedDay.label}
            </p>

            <h2 className="mt-1 text-xl font-bold capitalize">
              {formatLongDate(selectedDay.date)}
            </h2>
          </div>

          <button
            type="button"
            onClick={openActivityForm}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm active:scale-95"
          >
            + Attività
          </button>
        </div>
      )}

      {selectedDayActivities.length === 0 ? (
        <button
          type="button"
          onClick={openActivityForm}
          className="mt-6 w-full rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center active:scale-[0.99]"
        >
          <span className="text-4xl">🗓️</span>

          <h3 className="mt-4 text-lg font-bold">
            Giornata ancora libera
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Aggiungi visite, ristoranti, hotel oppure
            spostamenti.
          </p>

          <span className="mt-5 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Aggiungi la prima attività
          </span>
        </button>
      ) : (
        <div className="relative mt-7">
          <div className="absolute bottom-5 left-[2.15rem] top-5 w-px bg-slate-200" />

          <div className="space-y-4">
            {selectedDayActivities.map((activity) => {
              const categoryDetails = getCategoryDetails(
                activity.category,
              )

              return (
                <article
                  key={activity.id}
                  className={`relative flex gap-4 rounded-3xl border bg-white p-4 shadow-sm transition ${
                    activity.completed
                      ? 'border-green-200 opacity-70'
                      : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleCompleted(activity.id)
                    }
                    className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-4 border-white text-lg shadow-sm ${
                      activity.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-100'
                    }`}
                    aria-label={
                      activity.completed
                        ? 'Segna attività come non completata'
                        : 'Segna attività come completata'
                    }
                  >
                    {activity.completed
                      ? '✓'
                      : categoryDetails.icon}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-blue-600">
                          {activity.time}
                        </p>

                        <h3
                          className={`mt-1 font-bold ${
                            activity.completed
                              ? 'line-through'
                              : ''
                          }`}
                        >
                          {activity.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeActivity(activity.id)
                        }
                        className="rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Elimina attività"
                      >
                        ✕
                      </button>
                    </div>

                    {activity.location && (
                      <p className="mt-2 text-sm text-slate-500">
                        📍 {activity.location}
                      </p>
                    )}

                    {activity.notes && (
                      <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                        {activity.notes}
                      </p>
                    )}

                    <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {categoryDetails.icon}{' '}
                      {categoryDetails.label}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40">
          <button
            type="button"
            onClick={closeActivityForm}
            className="absolute inset-0"
            aria-label="Chiudi finestra"
          />

          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-slate-50 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-300" />

            <div className="mt-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  {selectedDay?.label}
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Nuova attività
                </h2>
              </div>

              <button
                type="button"
                onClick={closeActivityForm}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600"
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateActivity}
              className="mt-6 max-h-[65vh] space-y-4 overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-[7rem_1fr] gap-3">
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

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">
                    Categoria
                  </span>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target
                          .value as ActivityCategory,
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {categoryOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.icon} {option.label}
                      </option>
                    ))}
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
                    setTitle(event.target.value)
                  }
                  placeholder="Es. Visita al Colosseo"
                  required
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
                    setLocation(event.target.value)
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
                    setNotes(event.target.value)
                  }
                  placeholder="Biglietti, informazioni, promemoria..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 active:scale-[0.99]"
              >
                Salva attività
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}