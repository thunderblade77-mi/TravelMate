import { useEffect, useState } from 'react'

import { loadTravelPreferences } from '../../services/travelIntelligenceStorage'
import { loadSyncedTravelPreferences } from '../../services/travelPreferencesCloud'

import type { Trip } from '../../types/travel'

type Recommendation = {
  title: string
  type: 'see' | 'eat' | 'do' | 'hidden'
  why: string
  area: string | null
  estimatedTime: string | null
}

type TravelAiResponse = {
  answer: string
  recommendations: Recommendation[]
}

type Props = {
  activeTrip: Trip | null
}

const typeIcons: Record<Recommendation['type'], string> = {
  see: '🏛️',
  eat: '🍽️',
  do: '✨',
  hidden: '💎',
}

export default function TravelAiPanel({ activeTrip }: Props) {
  const [preferences, setPreferences] = useState(() =>
    loadTravelPreferences(),
  )
  const [preferencesSynced, setPreferencesSynced] = useState(false)

  useEffect(() => {
    let active = true

    void loadSyncedTravelPreferences()
      .then((synced) => {
        if (!active) return
        setPreferences(synced)
        setPreferencesSynced(true)
      })
      .catch(() => {
        if (active) setPreferencesSynced(false)
      })

    return () => {
      active = false
    }
  }, [])

  const [query, setQuery] = useState(
    'Cosa mi consigli di fare adesso?',
  )
  const [result, setResult] =
    useState<TravelAiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  function requestLocation() {
    if (!navigator.geolocation) {
      setError('La posizione non è disponibile su questo dispositivo.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setError(null)
      },
      () => {
        setError(
          'Non è stato possibile ottenere la posizione. Puoi comunque usare TravelG AI senza GPS.',
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    )
  }

  async function askTravelAi() {
    if (!activeTrip || !query.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/travel-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: activeTrip.destination,
          query: query.trim(),
          interests: preferences.interests,
          pace: preferences.pace,
          avoidCrowds: preferences.avoidCrowds,
          localFood: preferences.localFood,
          hiddenGems: preferences.hiddenGems,
          latitude: location?.latitude,
          longitude: location?.longitude,
          currentDate: new Date().toLocaleDateString('it-IT'),
        }),
      })

      const payload = await response.json() as
        | TravelAiResponse
        | { error?: string }

      if (!response.ok || !('answer' in payload)) {
        throw new Error(
          'error' in payload && payload.error
            ? payload.error
            : 'TravelG AI non è disponibile.',
        )
      }

      setResult(payload)
    } catch (caughtError) {
      setResult(null)
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'TravelG AI non è disponibile.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!activeTrip) {
    return (
      <article className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <span className="text-4xl">✨</span>
        <h2 className="mt-3 text-xl font-bold">TravelG AI</h2>
        <p className="mt-2 text-sm text-slate-500">
          Seleziona un viaggio per ricevere suggerimenti personalizzati.
        </p>
      </article>
    )
  }

  return (
    <article className="rounded-3xl bg-gradient-to-br from-indigo-950 via-blue-900 to-blue-700 p-5 text-white shadow-xl shadow-blue-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
              TravelG AI
            </p>
            {preferencesSynced && (
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-100">
                Cloud sync
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-bold">
            Il tuo assistente a {activeTrip.destination}
          </h2>
          <p className="mt-2 text-sm leading-6 text-blue-100">
            Suggerimenti basati sulle tue preferenze e, se vuoi, sulla posizione attuale.
          </p>
        </div>
        <span className="text-3xl">✨</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {preferences.interests.slice(0, 5).map((interest) => (
          <span
            key={interest}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-blue-50"
          >
            {interest}
          </span>
        ))}
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
          ritmo {preferences.pace}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-3 text-slate-900">
        <textarea
          rows={3}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Es. Vorrei un ristorante tipico non turistico vicino a me"
          className="w-full resize-none border-0 bg-transparent text-sm leading-6 outline-none"
        />

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={requestLocation}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${
              location
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {location ? '📍 Posizione attiva' : '📍 Usa posizione'}
          </button>

          <button
            type="button"
            onClick={() => void askTravelAi()}
            disabled={loading || !query.trim()}
            className="ml-auto rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Sto pensando…' : 'Chiedi →'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-red-500/15 p-3 text-sm text-red-50">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-white/10 p-4 text-sm leading-6 text-blue-50">
            {result.answer}
          </div>

          {result.recommendations.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="rounded-2xl bg-white p-4 text-slate-900"
            >
              <div className="flex gap-3">
                <span className="text-2xl">{typeIcons[item.type]}</span>
                <div className="min-w-0">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {item.why}
                  </p>
                  {(item.area || item.estimatedTime) && (
                    <p className="mt-2 text-xs text-slate-400">
                      {[item.area, item.estimatedTime]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}
