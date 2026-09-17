import { useNavigate } from 'react-router-dom'

import { useChecklist } from '../../hooks/useChecklist'
import { useDocuments } from '../../hooks/useDocuments'
import { useExpenses } from '../../hooks/useExpenses'
import { useWeather } from '../../hooks/useWeather'
import type { Trip } from '../../types/travel'
import AutoVisitDetector from './AutoVisitDetector'

type HomePageProps = {
  activeTrip: Trip | null
  onCreateTrip: () => void
  onOpenRoadbook: () => void
  onOpenMap: () => void
  onOpenChecklist: () => void
  formatDate: (date: string) => string
  formatCurrency: (amount: number) => string
}

const DAY_MS = 24 * 60 * 60 * 1000

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function todayAtMidnight() {
  const value = new Date()
  value.setHours(0, 0, 0, 0)
  return value
}

function formatToday() {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

function getTripState(trip: Trip) {
  const start = parseDate(trip.startDate)
  const end = parseDate(trip.endDate)
  const today = todayAtMidnight()

  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1,
  )

  if (today < start) {
    const daysUntilStart = Math.ceil(
      (start.getTime() - today.getTime()) / DAY_MS,
    )
    return {
      label:
        daysUntilStart === 1
          ? 'Parti domani'
          : `Parti tra ${daysUntilStart} giorni`,
      detail: `${totalDays} giorni di viaggio`,
    }
  }

  if (today > end) {
    return {
      label: 'Viaggio concluso',
      detail: `${totalDays} giorni di ricordi`,
    }
  }

  const currentDay =
    Math.floor((today.getTime() - start.getTime()) / DAY_MS) + 1

  return {
    label: `Giorno ${currentDay} di ${totalDays}`,
    detail: 'Sei in viaggio',
  }
}

function QuickAction({
  icon,
  label,
  detail,
  onClick,
  badge,
}: {
  icon: string
  label: string
  detail: string
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-[5.15rem] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xl">
          {icon}
        </span>
        {badge && (
          <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2 min-w-0">
        <strong className="block truncate text-sm">{label}</strong>
        <span className="mt-0.5 block truncate text-[11px] text-slate-500">
          {detail}
        </span>
      </div>
    </button>
  )
}

export default function HomePage({
  activeTrip,
  onCreateTrip,
  onOpenRoadbook,
  onOpenMap,
  onOpenChecklist,
  formatDate,
  formatCurrency,
}: HomePageProps) {
  const navigate = useNavigate()

  const {
    completedCount,
    totalCount,
    progress,
  } = useChecklist(activeTrip?.id)

  const {
    documentCount,
    expiredDocumentCount,
    expiringDocumentCount,
  } = useDocuments(activeTrip?.id)

  const { expenseCount, totalSpent } = useExpenses(
    activeTrip?.id,
    activeTrip?.budget ?? 0,
  )

  const latitude = activeTrip?.latitude
  const longitude = activeTrip?.longitude
  const hasCoordinates =
    typeof latitude === 'number' && typeof longitude === 'number'

  const { weather } = useWeather(
    hasCoordinates ? latitude : undefined,
    hasCoordinates ? longitude : undefined,
  )

  if (!activeTrip) {
    return (
      <section>
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            TravelG Beta
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Il viaggio parte da qui.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Crea il viaggio, invita il gruppo e costruisci insieme il Roadbook.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateTrip}
          className="w-full rounded-3xl bg-slate-950 p-5 text-left text-white shadow-xl shadow-slate-200 transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-200">Nuovo viaggio</p>
              <h2 className="mt-1 text-2xl font-bold">Dove andiamo?</h2>
              <p className="mt-2 text-sm text-slate-300">
                Destinazione, date, persone e budget.
              </p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              ✈️
            </span>
          </div>
        </button>
      </section>
    )
  }

  const tripState = getTripState(activeTrip)
  const documentAlerts = expiredDocumentCount + expiringDocumentCount

  const weatherSummary = weather
    ? `${Math.round(weather.current.temperature)}°`
    : 'Meteo in aggiornamento'

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            TravelG Beta
          </p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">
            {activeTrip.destination}
          </h1>
          <p className="mt-1 capitalize text-sm text-slate-500">
            {formatToday()}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/trips')}
          className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
        >
          Cambia viaggio
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenRoadbook}
        className="mt-4 w-full rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-left text-white shadow-lg shadow-blue-200 transition active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              Oggi
            </p>
            <h2 className="mt-1 text-xl font-bold">{tripState.label}</h2>
            <p className="mt-1 text-sm text-blue-100">{tripState.detail}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl">
            📖
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Apri il Roadbook di oggi</p>
            <p className="mt-0.5 truncate text-xs text-blue-100">
              {formatDate(activeTrip.startDate)} → {formatDate(activeTrip.endDate)}
            </p>
          </div>
          <span className="text-xl">→</span>
        </div>
      </button>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <QuickAction icon="📖" label="Roadbook" detail="Programma" onClick={onOpenRoadbook} />
        <QuickAction icon="📍" label="Mappa" detail="Luoghi" onClick={onOpenMap} />
        <QuickAction
          icon="🎫"
          label="Prenotazioni"
          detail="Documenti"
          onClick={() => navigate('/documents')}
          badge={documentAlerts > 0 ? String(documentAlerts) : undefined}
        />
        <QuickAction
          icon="💶"
          label="Spese"
          detail={expenseCount > 0 ? formatCurrency(totalSpent) : 'Dividi costi'}
          onClick={() => navigate('/expenses')}
          badge={expenseCount > 0 ? String(expenseCount) : undefined}
        />
        <QuickAction
          icon="✨"
          label="TravelG AI"
          detail="Chiedi ora"
          onClick={() => navigate('/assistant')}
        />
        <QuickAction
          icon="👥"
          label="Gruppo"
          detail="Chat e sondaggi"
          onClick={() => navigate('/trips')}
          badge={String(activeTrip.travelers)}
        />
      </div>

      <AutoVisitDetector trip={activeTrip} />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenChecklist}
          className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold">✅ Checklist</span>
            <span className="text-xs font-bold text-blue-600">{progress}%</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {totalCount === 0
              ? 'Nessun elemento'
              : `${completedCount}/${totalCount} completati`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/weather')}
          className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm active:scale-[0.99]"
        >
          <span className="text-sm font-bold">🌦️ Meteo</span>
          <p className="mt-1 text-xs text-slate-500">
            {hasCoordinates ? weatherSummary : 'Aggiungi la posizione del viaggio'}
          </p>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-sm">
        <span className="text-slate-500">
          {documentCount} documenti · {expenseCount} spese
        </span>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="font-bold text-blue-600"
        >
          Preferenze AI →
        </button>
      </div>
    </section>
  )
}
