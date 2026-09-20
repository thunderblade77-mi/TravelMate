import { useNavigate } from 'react-router-dom'

import { useChecklist } from '../../hooks/useChecklist'
import { useDocuments } from '../../hooks/useDocuments'
import { useExpenses } from '../../hooks/useExpenses'
import { useRoadbook } from '../../hooks/useRoadbook'
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

function getDestinationCover(destination: string) {
  const key = destination.toLowerCase()
  if (key.includes('portog') || key.includes('lisbon') || key.includes('lisboa')) return 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=85'
  if (key.includes('spagna') || key.includes('madrid')) return 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=85'
  if (key.includes('parigi') || key.includes('francia')) return 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85'
  if (key.includes('new york')) return 'https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=1200&q=85'
  if (key.includes('giapp') || key.includes('tokyo')) return 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=85'
  return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85'
}

function QuickAction({
  icon,
  label,
  detail,
  onClick,
  badge,
}: {
  icon: IconName
  label: string
  detail: string
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[6.4rem] overflow-hidden rounded-[1.35rem] border border-stone-200/80 bg-white/90 p-3.5 text-left shadow-[0_12px_35px_rgba(50,40,25,0.06)] transition duration-200 active:scale-[0.97]"
    >
      <div className="relative flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-[#fbf8f2] text-slate-950">
          <AppIcon name={icon} className="h-5 w-5" />
        </span>
        {badge && (
          <span className="rounded-full bg-[#a97a23] px-2 py-1 text-[10px] font-bold text-white">
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
  const { activities } = useRoadbook(activeTrip?.id ?? null)

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
  const weatherSummary = weather ? `${Math.round(weather.current.temperature)}°` : 'In aggiornamento'
  const cover = getDestinationCover(activeTrip.destination)
  const tripDays = Math.max(1, Math.round((parseDate(activeTrip.endDate).getTime() - parseDate(activeTrip.startDate).getTime()) / DAY_MS) + 1)
  const stops = Array.from(new Set(activities.map((item) => item.location).filter(Boolean))).length

  return (
    <section className="-mx-5 -mt-6">
      <button type="button" onClick={onOpenRoadbook} className="relative block h-[25rem] w-full overflow-hidden text-left text-white">
        <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/15 via-slate-950/20 to-slate-950/80" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/85">Il tuo viaggio</p>
          <h1 className="mt-2 text-5xl font-semibold tracking-tight">{activeTrip.destination}</h1>
          <p className="mt-2 text-lg font-medium text-white/90">{formatDate(activeTrip.startDate)} — {formatDate(activeTrip.endDate)}</p>
          <div className="mt-5 flex gap-6 text-sm font-semibold text-white/95">
            <span>▣ {tripDays} giorni</span><span>⌖ {stops || '—'} tappe</span><span>♙ {activeTrip.travelers} viaggiatori</span>
          </div>
        </div>
      </button>

      <div className="relative -mt-5 px-5 pb-2">
        <button type="button" onClick={onOpenRoadbook} className="flex w-full items-center gap-4 rounded-[1.8rem] border border-stone-200/80 bg-[#fffdf9] p-4 text-left text-slate-950 shadow-[0_18px_45px_rgba(55,43,25,0.14)] active:scale-[0.99]">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c99a43] to-[#98701f] text-white"><AppIcon name="book" className="h-7 w-7" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a47724]">{tripState.label}</span><strong className="mt-1 block truncate text-lg font-black">Apri il Roadbook di oggi</strong><span className="mt-0.5 block truncate text-xs text-slate-500">{tripState.detail}</span></span>
          <span className="text-2xl text-[#a47724]">›</span>
        </button>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <QuickAction icon="book" label="Roadbook" detail="Programma" onClick={onOpenRoadbook} />
          <QuickAction icon="map" label="Mappa" detail="Luoghi e tappe" onClick={onOpenMap} />
          <QuickAction icon="ticket" label="Prenotazioni" detail="Documenti" onClick={() => navigate('/documents')} badge={documentAlerts > 0 ? String(documentAlerts) : undefined} />
          <QuickAction icon="wallet" label="Spese" detail={expenseCount > 0 ? formatCurrency(totalSpent) : 'Dividi costi'} onClick={() => navigate('/expenses')} badge={expenseCount > 0 ? String(expenseCount) : undefined} />
          <QuickAction icon="sparkles" label="TravelG AI" detail="Chiedi ora" onClick={() => navigate('/assistant')} />
          <QuickAction icon="users" label="Gruppo" detail="Chat e sondaggi" onClick={() => navigate('/trips')} badge={String(activeTrip.travelers)} />
        </div>

        <AutoVisitDetector trip={activeTrip} />

        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Il viaggio a colpo d'occhio</h2>
          <button type="button" onClick={() => navigate('/trips')} className="text-xs font-extrabold text-[#a47724]">Dettagli ›</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onOpenChecklist} className="rounded-[1.35rem] border border-stone-200 bg-white/90 p-4 text-left shadow-sm">
            <p className="text-sm font-extrabold">Checklist <span className="float-right text-[#a47724]">{progress}%</span></p>
            <p className="mt-1 text-[11px] text-slate-500">{totalCount === 0 ? 'Nessun elemento' : `${completedCount}/${totalCount} completati`}</p>
          </button>
          <button type="button" onClick={() => navigate('/weather')} className="rounded-[1.35rem] border border-stone-200 bg-white/90 p-4 text-left shadow-sm">
            <p className="text-sm font-extrabold">Meteo <span className="float-right text-[#a47724]">{hasCoordinates ? weatherSummary : '—'}</span></p>
            <p className="mt-1 text-[11px] text-slate-500">{hasCoordinates ? 'Previsioni del viaggio' : 'Aggiungi la posizione'}</p>
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[1.35rem] border border-stone-200 bg-white/80 px-4 py-3 text-xs">
          <span className="font-medium text-slate-500">{documentCount} documenti · {expenseCount} spese</span>
          <button type="button" onClick={() => navigate('/profile')} className="font-extrabold text-[#a47724]">Preferenze AI ›</button>
        </div>
      </div>
    </section>
  )
}
