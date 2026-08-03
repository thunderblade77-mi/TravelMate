import { useEffect, useState } from 'react'

import {
  loadActiveTripId,
  loadTrips,
  saveActiveTripId,
  saveTrips,
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

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>(loadTrips)

  const [activeTripId, setActiveTripId] = useState<
    string | null
  >(loadActiveTripId)

  useEffect(() => {
    saveTrips(trips)
  }, [trips])

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

    const activeTripExists = trips.some(
      (trip) => trip.id === activeTripId,
    )

    if (!activeTripExists) {
      setActiveTripId(trips[0].id)
    }
  }, [trips, activeTripId])

  const activeTrip =
    trips.find((trip) => trip.id === activeTripId) ??
    trips[0] ??
    null

  function createTrip(input: CreateTripInput): Trip {
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

    setTrips((currentTrips) => [
      newTrip,
      ...currentTrips,
    ])

    setActiveTripId(newTrip.id)

    return newTrip
  }

  function selectTrip(tripId: string): void {
    setActiveTripId(tripId)
  }

  function removeTrip(tripId: string): void {
    const nextTrips = trips.filter(
      (trip) => trip.id !== tripId,
    )

    setTrips(nextTrips)

    if (activeTripId === tripId) {
      setActiveTripId(nextTrips[0]?.id ?? null)
    }
  }

  return {
    trips,
    activeTrip,
    activeTripId,
    createTrip,
    selectTrip,
    removeTrip,
  }
}