import { useNavigate } from 'react-router-dom'

import { useChecklist } from '../../hooks/useChecklist'
import { useDocuments } from '../../hooks/useDocuments'
import { useExpenses } from '../../hooks/useExpenses'
import { useWeather } from '../../hooks/useWeather'
import type { Trip } from '../../types/travel'
import AppIcon, { type IconName } from '../ui/AppIcon'
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
    const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / DAY_MS)
    return {
      label: daysUntilStart === 1 ? 'Parti domani' : `Parti tra ${daysUntilStart} giorni`,
      detail: `${totalDays} giorni di viaggio`,
    }
  }

  if (today > end) {
    return {
      label: 'Viaggio concluso',
      detail: `${totalDays} giorni di ricordi`,
    }
  }

  const currentDay = Math.floor((today.getTime() - start.getTime()) / DAY_MS) + 1
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
  tone,
}: {
  icon: IconName
  label: string
  detail: string
  onClick: () => void
  badge?: string
  tone: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[6.4rem] overflow-hidden rounded-[1.35rem] border border-white/80 bg-white p-3.5 text-left shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition duration-200 active:scale-[0.97]"
    >
      <div className={`absolute -right-5 -top-5 h-16 w-16 rounded-full opacity-20 blur-xl ${tone}`} />
      <div className="relative flex items-start justify-between gap-2">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg ${tone}`}>
          <AppIcon name={icon} className="h-5 w-5" />
        </span>
        {badge && (
          <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="relative mt-3 min-w-0">
        <strong className="block truncate text-sm font-extrabold tracking-tight text-slate-900">
          {label}
        </strong>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
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
  const { completedCount, totalCount, progress } = useChecklist(activeTrip?.id)
  const { documentCount, expiredDocumentCount, expiringDocumentCount } = useDocuments(activeTrip?.id)
  const { expenseCount, totalSpent } = useExpenses(activeTrip?.id, activeTrip?.budget ?? 0)

  const latitude = activeTrip?.latitude
  const longitude = activeTrip?.longitude
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number'
  const { weather } = useWeather(
    hasCoordinates ? latitude : undefined,
    hasCoordinates ? longitude : undefined,
  )

  if (!activeTrip) {
    return (
      <section>
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-[0_26px_65px_rgba(30,64,175,0.24)]">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
            TravelG Beta
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-tight">Il viaggio parte da qui.</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100/80">
            Crea il viaggio, invita il gruppo e costruisci insieme il Roadbook.
          </p>
          <button
            type="button"
            onClick={onCreateTrip}
            className="mt-6 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4 text-left text-slate-950 shadow-xl transition active:scale-[0.98]"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Nuovo viaggio</p>
              <p className="mt-1 text-lg font-extrabold">Dove andiamo?</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <AppIcon name="plus" className="h-5 w-5" />
            </span>
          </button>
        </div>
      </section>
    )
  }

  const tripState = getTripState(activeTrip)
  const documentAlerts = expiredDocumentCount + expiringDocumentCount
  const weatherSummary = weather
    ? `${Math.round(weather.current.temperature)}°`
    : 'In aggiornamento'

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.12)]" />
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-600">TravelG Live</p>
          </div>
          <h1 className="mt-2 truncate text-[1.75rem] font-black tracking-tight text-slate-950">
            {activeTrip.destination}
          </h1>
          <p className="mt-1 capitalize text-sm font-medium text-slate-500">{formatToday()}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/trips')}
          className="shrink-0 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-xs font-bold text-slate-600 shadow-lg backdrop-blur"
        >
          Cambia
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenRoadbook}
        className="relative mt-5 w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-5 text-left text-white shadow-[0_22px_55px_rgba(37,99,235,0.28)] transition active:scale-[0.99]"
      >
        <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 left-6 h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-100">La tua giornata</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">{tripState.label}</h2>
            <p className="mt-1 text-sm font-medium text-blue-100/80">{tripState.detail}</p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur">
            <AppIcon name="book" className="h-6 w-6" />
          </span>
        </div>

        <div className="relative mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Apri il Roadbook di oggi</p>
            <p className="mt-0.5 truncate text-[11px] text-blue-100/75">
              {formatDate(activeTrip.startDate)} → {formatDate(activeTrip.endDate)}
            </p>
          </div>
          <span className="text-xl">→</span>
        </div>
      </button>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <QuickAction icon="book" label="Roadbook" detail="Programma" onClick={onOpenRoadbook} tone="bg-gradient-to-br from-blue-500 to-blue-700" />
        <QuickAction icon="map" label="Mappa" detail="Luoghi" onClick={onOpenMap} tone="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <QuickAction icon="ticket" label="Prenotazioni" detail="Documenti" onClick={() => navigate('/documents')} badge={documentAlerts > 0 ? String(documentAlerts) : undefined} tone="bg-gradient-to-br from-violet-500 to-indigo-600" />
        <QuickAction icon="wallet" label="Spese" detail={expenseCount > 0 ? formatCurrency(totalSpent) : 'Dividi costi'} onClick={() => navigate('/expenses')} badge={expenseCount > 0 ? String(expenseCount) : undefined} tone="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <QuickAction icon="sparkles" label="TravelG AI" detail="Chiedi ora" onClick={() => navigate('/assistant')} tone="bg-gradient-to-br from-fuchsia-500 to-violet-600" />
        <QuickAction icon="users" label="Gruppo" detail="Chat e sondaggi" onClick={() => navigate('/trips')} badge={String(activeTrip.travelers)} tone="bg-gradient-to-br from-orange-400 to-rose-500" />
      </div>

      <AutoVisitDetector trip={activeTrip} />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenChecklist}
          className="rounded-[1.35rem] border border-white/80 bg-white p-4 text-left shadow-[0_12px_35px_rgba(15,23,42,0.07)] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <AppIcon name="check" className="h-4.5 w-4.5" />
            </span>
            <span className="text-xs font-black text-blue-600">{progress}%</span>
          </div>
          <p className="mt-3 text-sm font-extrabold">Checklist</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {totalCount === 0 ? 'Nessun elemento' : `${completedCount}/${totalCount} completati`}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/weather')}
          className="rounded-[1.35rem] border border-white/80 bg-white p-4 text-left shadow-[0_12px_35px_rgba(15,23,42,0.07)] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white">
              <AppIcon name="weather" className="h-4.5 w-4.5" />
            </span>
            <span className="text-lg font-black text-slate-900">{hasCoordinates ? weatherSummary : '—'}</span>
          </div>
          <p className="mt-3 text-sm font-extrabold">Meteo</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {hasCoordinates ? 'Previsioni del viaggio' : 'Aggiungi la posizione'}
          </p>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[1.35rem] border border-white/80 bg-white/85 px-4 py-3 text-xs shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur">
        <span className="font-medium text-slate-500">{documentCount} documenti · {expenseCount} spese</span>
        <button type="button" onClick={() => navigate('/profile')} className="font-extrabold text-blue-600">
          Preferenze AI →
        </button>
      </div>
    </section>
  )
}
