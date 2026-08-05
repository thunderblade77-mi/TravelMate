import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'
import {
  loadActiveTripId,
  saveActiveTripId,
} from '../services/tripStorage'
import type { Trip } from '../types/travel'

type CreateTripInput = {
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budget: number
  transport: string
  latitude?: number
  longitude?: number
}

type CloudTripRow = {
  id: string
  owner_id: string
  title: string
  destination: string
  start_date: string | null
  end_date: string | null
  travelers: number
  budget: number | string
  transport: string
  latitude: number | null
  longitude: number | null
  created_at: string
}

function mapCloudTrip(row: CloudTripRow): Trip {
  return {
    id: row.id,
    destination: row.destination || row.title,
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    travelers: Math.max(1, Number(row.travelers) || 1),
    budget: Math.max(0, Number(row.budget) || 0),
    transport: row.transport || 'Auto',
    latitude:
      typeof row.latitude === 'number'
        ? row.latitude
        : undefined,
    longitude:
      typeof row.longitude === 'number'
        ? row.longitude
        : undefined,
  }
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [activeTripId, setActiveTripId] =
    useState<string | null>(loadActiveTripId)
  const [userId, setUserId] =
    useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] =
    useState<string | null>(null)

  const loadTrips = useCallback(async () => {
    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setUserId(null)
        setTrips([])
        setError(null)
        return
      }

      setUserId(user.id)

      const { data, error: tripsError } =
        await supabase
          .from('trips')
          .select(
            `
              id,
              owner_id,
              title,
              destination,
              start_date,
              end_date,
              travelers,
              budget,
              transport,
              latitude,
              longitude,
              created_at
            `,
          )
          .order('created_at', {
            ascending: false,
          })

      if (tripsError) {
        throw tripsError
      }

      setTrips(
        (data ?? []).map((row) =>
          mapCloudTrip(row as CloudTripRow),
        ),
      )
      setError(null)
    } catch (loadError) {
      console.error(
        'Errore caricamento viaggi cloud:',
        loadError,
      )
      setTrips([])
      setError(
        'Non è stato possibile caricare i viaggi dal cloud.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTrips()
  }, [loadTrips])

  useEffect(() => {
    saveActiveTripId(activeTripId)
  }, [activeTripId])

  useEffect(() => {
    if (trips.length === 0) {
      if (activeTripId !== null) {
        setActiveTripId(null)
      }
      return
    }

    const exists = trips.some(
      (trip) => trip.id === activeTripId,
    )

    if (!exists) {
      setActiveTripId(trips[0].id)
    }
  }, [trips, activeTripId])

  useEffect(() => {
    const channel = supabase
      .channel('travelmate-trips')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
        },
        () => {
          void loadTrips()
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
        },
        () => {
          void loadTrips()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [loadTrips])

  const activeTrip = useMemo(
    () =>
      trips.find(
        (trip) => trip.id === activeTripId,
      ) ??
      trips[0] ??
      null,
    [trips, activeTripId],
  )

  function createTrip(input: CreateTripInput): Trip {
    if (!userId) {
      throw new Error('Utente non autenticato.')
    }

    const newTrip: Trip = {
      id: crypto.randomUUID(),
      destination: input.destination.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      travelers: Math.max(1, input.travelers),
      budget: Math.max(0, input.budget),
      transport: input.transport,
      latitude: input.latitude,
      longitude: input.longitude,
    }

    setTrips((current) => [newTrip, ...current])
    setActiveTripId(newTrip.id)

    void supabase
      .from('trips')
      .insert({
        id: newTrip.id,
        owner_id: userId,
        title: newTrip.destination,
        destination: newTrip.destination,
        start_date: newTrip.startDate || null,
        end_date: newTrip.endDate || null,
        travelers: newTrip.travelers,
        budget: newTrip.budget,
        transport: newTrip.transport,
        latitude: newTrip.latitude ?? null,
        longitude: newTrip.longitude ?? null,
      })
      .then(({ error: insertError }) => {
        if (!insertError) {
          setError(null)
          return
        }

        console.error(
          'Errore creazione viaggio cloud:',
          insertError,
        )

        setTrips((current) =>
          current.filter(
            (trip) => trip.id !== newTrip.id,
          ),
        )

        setError(
          'Non è stato possibile creare il viaggio nel cloud.',
        )

        window.alert(
          `Creazione non riuscita: ${insertError.message}`,
        )
      })

    return newTrip
  }

  function selectTrip(tripId: string): void {
    setActiveTripId(tripId)
  }

  function removeTrip(tripId: string): void {
    const previousTrips = trips
    const nextTrips = previousTrips.filter(
      (trip) => trip.id !== tripId,
    )

    setTrips(nextTrips)

    if (activeTripId === tripId) {
      setActiveTripId(
        nextTrips[0]?.id ?? null,
      )
    }

    void supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .then(({ error: deleteError }) => {
        if (!deleteError) {
          setError(null)
          return
        }

        console.error(
          'Errore eliminazione viaggio cloud:',
          deleteError,
        )

        setTrips(previousTrips)
        setError(
          'Non è stato possibile eliminare il viaggio dal cloud.',
        )

        window.alert(
          `Eliminazione non riuscita: ${deleteError.message}`,
        )
      })
  }

  return {
    trips,
    activeTrip,
    activeTripId,
    loading,
    error,
    createTrip,
    selectTrip,
    removeTrip,
    reload: loadTrips,
  }
}