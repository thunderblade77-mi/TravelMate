import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import ActivityFormModal from './ActivityFormModal'
import { ImportMapModal } from './ImportMapModal'

import { useMapPoints } from '../../hooks/useMapPoints'
import { useRoadbook } from '../../hooks/useRoadbook'

import { geocodeDestination } from '../../services/geocoding'

import type { MapPointType } from '../../types/map'

import type {
  ActivityCategory,
  RoadbookActivity,
  RoadbookDay,
  TransportType,
} from '../../types/roadbook'

import type { Trip } from '../../types/travel'

type RoadbookPageProps = {
  activeTrip: Trip | null
  onBack: () => void
  onOpenMapPoint: (mapPointId: string) => void
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

function getLocalDateId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

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

    const month = String(
      currentDate.getMonth() + 1,
    ).padStart(2, '0')

    const day = String(
      currentDate.getDate(),
    ).padStart(2, '0')

    const date = `${year}-${month}-${day}`

    days.push({
      id: date,
      date,
      label: `Giorno ${dayNumber}`,
    })

    currentDate.setDate(
      currentDate.getDate() + 1,
    )

    dayNumber += 1
  }

  return days
}

function getCategoryDetails(
  category: ActivityCategory,
) {
  return (
    categoryOptions.find(
      (option) => option.value === category,
    ) ?? categoryOptions[4]
  )
}

function createGoogleMapsUrl(
  location: string,
): string {
  const safeLocation = Array.from(location)
    .filter((character) => {
      const codePoint = character.codePointAt(0)

      return (
        codePoint !== undefined &&
        (codePoint < 0xd800 ||
          codePoint > 0xdfff)
      )
    })
    .join('')
    .trim()

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    safeLocation,
  )}`
}

function getMapPointType(
  category: ActivityCategory,
): MapPointType {
  switch (category) {
    case 'hotel':
      return 'hotel'

    case 'ristorante':
      return 'restaurant'

    case 'trasporto':
      return 'transport'

    case 'visita':
    case 'altro':
    default:
      return 'attraction'
  }
}

function getTransportIcon(
  transportType?: TransportType,
): string {
  switch (transportType) {
    case 'plane':
      return '✈️'

    case 'train':
      return '🚆'

    case 'bus':
      return '🚌'

    case 'ferry':
      return '⛴️'

    case 'taxi':
      return '🚕'

    case 'bike':
      return '🚲'

    case 'walk':
      return '🚶'

    case 'car':
    default:
      return '🚗'
  }
}

export default function RoadbookPage({
  activeTrip,
  onBack,
  onOpenMapPoint,
}: RoadbookPageProps) {
  const {
    activities,
    createActivity,
    editActivity,
    duplicateActivity,
    toggleCompleted,
    moveActivity,
    removeActivity,
  } = useRoadbook(activeTrip?.id ?? null)

  const {
    addMapPoint,
    getTripMapPoints,
  } = useMapPoints()

  const days = useMemo(() => {
    if (!activeTrip) {
      return []
    }

    return createTripDays(
      activeTrip.startDate,
      activeTrip.endDate,
    )
  }, [activeTrip])

  const tripMapPoints = activeTrip
    ? getTripMapPoints(activeTrip.id)
    : []

  const importedMapPointIds = useMemo(
    () =>
      activities
        .map(
          (activity) =>
            activity.mapPointId,
        )
        .filter(
          (
            mapPointId,
          ): mapPointId is string =>
            Boolean(mapPointId),
        ),
    [activities],
  )

  const availableMapPointCount =
    tripMapPoints.filter(
      (point) =>
        !importedMapPointIds.includes(
          point.id,
        ),
    ).length

  const [
    selectedDayId,
    setSelectedDayId,
  ] = useState<string | null>(() =>
    getLocalDateId(),
  )

  const [
    formDayId,
    setFormDayId,
  ] = useState<string | null>(null)

  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false)

  const [
    editingActivityId,
    setEditingActivityId,
  ] = useState<string | null>(null)

  const [
    isImportModalOpen,
    setIsImportModalOpen,
  ] = useState(false)

  const [
    locatingActivityId,
    setLocatingActivityId,
  ] = useState<string | null>(null)

  const [time, setTime] = useState('09:00')
  const [title, setTitle] = useState('')
  const [location, setLocation] =
    useState('')
  const [notes, setNotes] = useState('')

  const [category, setCategory] =
    useState<ActivityCategory>('visita')

  const [
    transportType,
    setTransportType,
  ] = useState<TransportType>('car')

  const todayId = getLocalDateId()

  const defaultDayId =
    days.find((day) => day.id === todayId)?.id ??
    days.find((day) => day.id > todayId)?.id ??
    days[days.length - 1]?.id ??
    null

  const currentDayId =
    days.some(
      (day) =>
        day.id === selectedDayId,
    )
      ? selectedDayId
      : defaultDayId

  const selectedDay =
    days.find(
      (day) => day.id === currentDayId,
    ) ?? null

  const formSelectedDay =
    days.find(
      (day) => day.id === formDayId,
    ) ?? selectedDay

  const selectedDayActivities = useMemo(
    () =>
      activities
        .filter(
          (activity) =>
            activity.dayId ===
            currentDayId,
        )
        .sort(
          (
            firstActivity,
            secondActivity,
          ) => {
            if (
              firstActivity.order !==
              secondActivity.order
            ) {
              return (
                firstActivity.order -
                secondActivity.order
              )
            }

            return firstActivity.createdAt.localeCompare(
              secondActivity.createdAt,
            )
          },
        ),
    [activities, currentDayId],
  )

  const completedActivityCount =
    useMemo(
      () =>
        activities.filter(
          (activity) =>
            activity.completed,
        ).length,
      [activities],
    )

  const overallProgress =
    activities.length > 0
      ? Math.round(
          (completedActivityCount /
            activities.length) *
            100,
        )
      : 0

  const plannedDayCount = useMemo(
    () =>
      days.filter((day) =>
        activities.some(
          (activity) =>
            activity.dayId === day.id,
        ),
      ).length,
    [activities, days],
  )

  const selectedDayCompletedCount =
    useMemo(
      () =>
        selectedDayActivities.filter(
          (activity) =>
            activity.completed,
        ).length,
      [selectedDayActivities],
    )

  const selectedDayProgress =
    selectedDayActivities.length > 0
      ? Math.round(
          (selectedDayCompletedCount /
            selectedDayActivities.length) *
            100,
        )
      : 0

  const isEditing =
    editingActivityId !== null

  function resetForm() {
    setTime('09:00')
    setTitle('')
    setLocation('')
    setNotes('')
    setCategory('visita')
    setTransportType('car')
  }

  function openActivityForm() {
    resetForm()
    setEditingActivityId(null)
    setFormDayId(currentDayId)
    setIsFormOpen(true)
  }

  function openEditActivityForm(
    activity: RoadbookActivity,
  ) {
    setSelectedDayId(activity.dayId)
    setFormDayId(activity.dayId)
    setEditingActivityId(activity.id)
    setTime(activity.time)
    setTitle(activity.title)
    setLocation(
      activity.location ?? '',
    )
    setNotes(activity.notes ?? '')
    setCategory(activity.category)

    setTransportType(
      activity.transportType ?? 'car',
    )

    setIsFormOpen(true)
  }

  function closeActivityForm() {
    resetForm()
    setFormDayId(null)
    setEditingActivityId(null)
    setIsFormOpen(false)
  }

  function handleSubmitActivity(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const targetDayId =
      formDayId ?? currentDayId

    if (
      !targetDayId ||
      !title.trim()
    ) {
      return
    }

    const activityInput = {
      dayId: targetDayId,
      time,
      title: title.trim(),
      location: location.trim(),
      notes: notes.trim(),
      category,
      transportType:
        category === 'trasporto'
          ? transportType
          : undefined,
    }

    if (editingActivityId) {
      editActivity(
        editingActivityId,
        activityInput,
      )
    } else {
      createActivity(activityInput)
    }

    setSelectedDayId(targetDayId)
    closeActivityForm()
  }

  async function handleAddActivityToMap(
    activity: RoadbookActivity,
  ) {
    if (
      !activeTrip ||
      locatingActivityId
    ) {
      return
    }

    const searchText =
      activity.location.trim() ||
      activity.title.trim()

    if (!searchText) {
      window.alert(
        'Inserisci prima un luogo o un indirizzo nell’attività.',
      )

      return
    }

    const existingPoint =
      tripMapPoints.find(
        (point) =>
          point.name
            .trim()
            .toLowerCase() ===
            activity.title
              .trim()
              .toLowerCase() ||
          point.location
            .trim()
            .toLowerCase() ===
            searchText.toLowerCase(),
      )

    if (existingPoint) {
      const confirmed =
        window.confirm(
          `Esiste già un punto chiamato "${existingPoint.name}". Collegarlo a questa attività?`,
        )

      if (!confirmed) {
        return
      }

      editActivity(activity.id, {
        dayId: activity.dayId,
        time: activity.time,
        title: activity.title,
        location: activity.location,
        notes: activity.notes,
        category: activity.category,
        transportType:
          activity.transportType,
        order: activity.order,
        mapPointId: existingPoint.id,
      })

      return
    }

    setLocatingActivityId(
      activity.id,
    )

    try {
      const query =
        `${searchText}, ${activeTrip.destination}`

      const coordinates =
        await geocodeDestination(query)

      if (!coordinates) {
        window.alert(
          `Non ho trovato "${searchText}" sulla mappa. Prova ad aggiungere città o indirizzo modificando l’attività.`,
        )

        return
      }

      const confirmed =
        window.confirm(
          `Ho trovato "${searchText}". Vuoi aggiungerlo alla mappa del viaggio?`,
        )

      if (!confirmed) {
        return
      }

      const mapPoint = addMapPoint({
        tripId: activeTrip.id,
        name: activity.title,
        location: searchText,
        latitude:
          coordinates.latitude,
        longitude:
          coordinates.longitude,
        type: getMapPointType(
          activity.category,
        ),
      })

      editActivity(activity.id, {
        dayId: activity.dayId,
        time: activity.time,
        title: activity.title,
        location: activity.location,
        notes: activity.notes,
        category: activity.category,
        transportType:
          activity.transportType,
        order: activity.order,
        mapPointId: mapPoint.id,
      })
    } catch {
      window.alert(
        'Non è stato possibile cercare il luogo. Controlla la connessione e riprova.',
      )
    } finally {
      setLocatingActivityId(null)
    }
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
          <span className="text-5xl">
            📖
          </span>

          <h1 className="mt-5 text-2xl font-bold">
            Nessun viaggio attivo
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Crea o seleziona un viaggio per iniziare a
            costruire il Roadbook.
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
          {days.length === 1
            ? 'giorno'
            : 'giorni'}
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

      <article className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-100">
              Avanzamento Roadbook
            </p>

            <p className="mt-2 text-3xl font-bold">
              {overallProgress}%
            </p>

            <p className="mt-1 text-sm text-blue-100">
              {completedActivityCount} di{' '}
              {activities.length}{' '}
              {activities.length === 1
                ? 'attività completata'
                : 'attività completate'}
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            📖
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{
              width: `${Math.min(
                overallProgress,
                100,
              )}%`,
            }}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xl font-bold">
              {activities.length}
            </p>

            <p className="mt-1 text-xs text-blue-100">
              Attività
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xl font-bold">
              {plannedDayCount}
            </p>

            <p className="mt-1 text-xs text-blue-100">
              Giorni pianificati
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-xl font-bold">
              {importedMapPointIds.length}
            </p>

            <p className="mt-1 text-xs text-blue-100">
              Dalla mappa
            </p>
          </div>
        </div>
      </article>

      {tripMapPoints.length > 0 && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-blue-700">
                📍 Punti sulla mappa
              </p>

              <p className="mt-1 text-sm text-blue-600">
                {availableMapPointCount > 0
                  ? `${availableMapPointCount} ${
                      availableMapPointCount === 1
                        ? 'punto da importare'
                        : 'punti da importare'
                    }`
                  : 'Tutti i punti sono stati importati'}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setIsImportModalOpen(true)
              }
              className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
            >
              Importa
            </button>
          </div>
        </div>
      )}

      <div className="-mx-5 mt-7 overflow-x-auto px-5 pb-2">
        <div className="flex min-w-max gap-3">
          {days.map((day) => {
            const isSelected =
              day.id === currentDayId

            const dayActivities =
              activities.filter(
                (activity) =>
                  activity.dayId === day.id,
              )

            const activityCount =
              dayActivities.length

            const completedCount =
              dayActivities.filter(
                (activity) =>
                  activity.completed,
              ).length

            return (
              <button
                type="button"
                key={day.id}
                onClick={() =>
                  setSelectedDayId(day.id)
                }
                className={`min-w-32 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
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
                  {activityCount === 0
                    ? 'Nessuna attività'
                    : `${completedCount}/${activityCount} completate`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay && (
        <>
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

          {selectedDayActivities.length > 0 && (
            <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Progresso della giornata
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedDayCompletedCount} di{' '}
                    {selectedDayActivities.length}{' '}
                    completate
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                  {selectedDayProgress}%
                </span>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      selectedDayProgress,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </article>
          )}
        </>
      )}

      {selectedDayActivities.length === 0 ? (
        <button
          type="button"
          onClick={openActivityForm}
          className="mt-6 w-full rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center active:scale-[0.99]"
        >
          <span className="text-4xl">
            🗓️
          </span>

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
            {selectedDayActivities.map(
              (activity) => {
                const categoryDetails =
                  getCategoryDetails(
                    activity.category,
                  )

                const activityIcon =
                  activity.category ===
                  'trasporto'
                    ? getTransportIcon(
                        activity.transportType,
                      )
                    : categoryDetails.icon

                const mapPointId =
                  activity.mapPointId

                const mapsUrl =
                  activity.location.trim()
                    ? createGoogleMapsUrl(
                        activity.location,
                      )
                    : null

                const isFirstActivity =
                  selectedDayActivities[0]
                    ?.id === activity.id

                const isLastActivity =
                  selectedDayActivities[
                    selectedDayActivities.length -
                      1
                  ]?.id === activity.id

                return (
                  <article
                    key={activity.id}
                    className={`relative flex gap-4 rounded-3xl border bg-white p-4 shadow-sm transition ${
                      activity.completed
                        ? 'border-green-200 opacity-70'
                        : mapPointId
                          ? 'border-blue-200'
                          : 'border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleCompleted(
                          activity.id,
                        )
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
                        : activityIcon}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {activity.time && (
                            <p className="text-xs font-semibold text-blue-600">
                              {activity.time}
                            </p>
                          )}

                          <h3
                            className={`mt-1 break-words font-bold ${
                              activity.completed
                                ? 'line-through'
                                : ''
                            }`}
                          >
                            {activity.title}
                          </h3>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              moveActivity(
                                activity.id,
                                'up',
                              )
                            }
                            disabled={
                              isFirstActivity
                            }
                            className="rounded-full px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-25"
                            aria-label="Sposta attività in alto"
                          >
                            ↑
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveActivity(
                                activity.id,
                                'down',
                              )
                            }
                            disabled={
                              isLastActivity
                            }
                            className="rounded-full px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-25"
                            aria-label="Sposta attività in basso"
                          >
                            ↓
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditActivityForm(
                                activity,
                              )
                            }
                            className="rounded-full px-2 py-1 text-sm text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            aria-label="Modifica attività"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              duplicateActivity(
                                activity.id,
                              )
                            }
                            className="rounded-full px-2 py-1 text-sm text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                            aria-label="Duplica attività"
                          >
                            📄
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Eliminare l'attività "${activity.title}"?`,
                                )
                              ) {
                                removeActivity(
                                  activity.id,
                                )
                              }
                            }}
                            className="rounded-full px-2 py-1 text-sm text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Elimina attività"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {activity.location && (
                        <p className="mt-2 break-words text-sm text-slate-500">
                          📍 {activity.location}
                        </p>
                      )}

                      {activity.notes && (
                        <p className="mt-3 break-words rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                          {activity.notes}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {activityIcon}{' '}
                          {categoryDetails.label}
                        </span>

                        {mapPointId && (
                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            🗺️ Dalla mappa
                          </span>
                        )}

                        {activity.completed && (
                          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            ✓ Completata
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {mapPointId ? (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenMapPoint(
                                mapPointId,
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
                          >
                            🗺️ Mappa TravelG
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleAddActivityToMap(
                                activity,
                              )
                            }
                            disabled={
                              locatingActivityId !==
                              null
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:cursor-wait disabled:bg-slate-300"
                          >
                            {locatingActivityId ===
                            activity.id
                              ? 'Ricerca in corso...'
                              : '📍 Aggiungi alla mappa'}
                          </button>
                        )}

                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition active:scale-95"
                          >
                            🧭 Apri in Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                )
              },
            )}
          </div>
        </div>
      )}

      <ActivityFormModal
        isOpen={isFormOpen}
        isEditing={isEditing}
        selectedDay={formSelectedDay}
        days={days}
        selectedDayId={formDayId ?? currentDayId}
        time={time}
        title={title}
        location={location}
        notes={notes}
        category={category}
        transportType={transportType}
        onDayChange={setFormDayId}
        onTimeChange={setTime}
        onTitleChange={setTitle}
        onLocationChange={setLocation}
        onNotesChange={setNotes}
        onCategoryChange={setCategory}
        onTransportTypeChange={
          setTransportType
        }
        onClose={closeActivityForm}
        onSubmit={handleSubmitActivity}
      />

      <ImportMapModal
        isOpen={isImportModalOpen}
        mapPoints={tripMapPoints}
        days={days}
        defaultDayId={currentDayId}
        importedMapPointIds={
          importedMapPointIds
        }
        onClose={() =>
          setIsImportModalOpen(false)
        }
        onImport={(input) => {
          createActivity({
            dayId: input.dayId,
            time: input.time,
            title: input.title.trim(),
            location:
              input.location.trim(),
            notes: input.notes.trim(),
            category: input.category,
            mapPointId:
              input.mapPointId,
          })

          setSelectedDayId(input.dayId)
          setIsImportModalOpen(false)
        }}
      />
    </section>
  )
}