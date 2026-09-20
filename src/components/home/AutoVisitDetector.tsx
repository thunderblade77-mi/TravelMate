import { useEffect, useMemo, useState } from 'react'

import { useMapPoints } from '../../hooks/useMapPoints'
import { useRoadbook } from '../../hooks/useRoadbook'
import { recordActivityExperience } from '../../services/tripExperience'
import { watchNearbyVisits } from '../../services/visitDetection'
import type { Trip } from '../../types/travel'

type AutoVisitDetectorProps = {
  trip: Trip
}

const STORAGE_KEY = 'travelg:auto-visit-detection:v1'

export default function AutoVisitDetector({ trip }: AutoVisitDetectorProps) {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  )
  const [status, setStatus] = useState('GPS automatico disattivato')

  const { activities, toggleCompleted } = useRoadbook(trip.id)
  const { getTripMapPoints } = useMapPoints()

  const targets = useMemo(() => {
    const points = getTripMapPoints(trip.id)
    const today = new Date()
    const todayId = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    return activities
      .filter((activity) => activity.dayId === todayId && activity.mapPointId && !activity.completed)
      .map((activity) => {
        const point = points.find((item) => item.id === activity.mapPointId)
        if (!point) return null

        return {
          id: activity.id,
          title: activity.title,
          location: activity.location || point.location,
          latitude: point.latitude,
          longitude: point.longitude,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [activities, getTripMapPoints, trip.id])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled))

    if (!enabled) {
      setStatus('GPS automatico disattivato')
      return
    }

    if (targets.length === 0) {
      setStatus('Aggiungi le tappe alla mappa per usare il rilevamento')
      return
    }

    setStatus(`GPS attivo · ${targets.length} tappe monitorate`)

    const stop = watchNearbyVisits(
      targets,
      async (match) => {
        const activity = activities.find((item) => item.id === match.id)
        if (!activity) return

        try {
          await recordActivityExperience({
            tripId: trip.id,
            activityId: activity.id,
            placeName: activity.title,
            location: activity.location || match.location,
            latitude: match.latitude,
            longitude: match.longitude,
            source: 'gps',
            confidence: 1,
          })

          if (!activity.completed) {
            toggleCompleted(activity.id)
          }

          setStatus(`✓ Visita rilevata e salvata nei ricordi: ${activity.title}`)
        } catch (error) {
          console.error('Errore salvataggio visita GPS:', error)
          setStatus(`Visita rilevata: ${activity.title} · sincronizzazione in attesa`)
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('Consenti la posizione nelle impostazioni del browser')
        } else {
          setStatus('GPS non disponibile in questo momento')
        }
      },
      120,
    )

    return stop
  }, [enabled, targets, activities, toggleCompleted, trip.id])

  return (
    <button
      type="button"
      onClick={() => setEnabled((value) => !value)}
      className={`mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left shadow-sm ${
        enabled
          ? 'border-[#d7bd89] bg-[#fbf4e6]'
          : 'border-stone-200 bg-[#fffdf9]'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-bold ${enabled ? 'text-[#8b651e]' : 'text-slate-700'}`}>
          📍 Rilevamento visite {enabled ? 'attivo' : 'spento'}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{status}</p>
      </div>
      <span className={`relative h-7 w-12 shrink-0 rounded-full ${enabled ? 'bg-[#b88931]' : 'bg-stone-300'}`}>
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}
