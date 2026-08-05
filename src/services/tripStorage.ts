import type { Trip } from '../types/travel'

const TRIPS_STORAGE_KEY = 'TravelG-trips'
const ACTIVE_TRIP_STORAGE_KEY = 'TravelG-active-trip-id'

export function loadTrips(): Trip[] {
  try {
    const savedTrips = localStorage.getItem(TRIPS_STORAGE_KEY)

    if (!savedTrips) {
      return []
    }

    const parsedTrips: unknown = JSON.parse(savedTrips)

    return Array.isArray(parsedTrips)
      ? (parsedTrips as Trip[])
      : []
  } catch {
    return []
  }
}

export function saveTrips(trips: Trip[]): void {
  try {
    localStorage.setItem(
      TRIPS_STORAGE_KEY,
      JSON.stringify(trips),
    )
  } catch {
    // L'app continua a funzionare anche senza localStorage.
  }
}

export function loadActiveTripId(): string | null {
  try {
    return localStorage.getItem(
      ACTIVE_TRIP_STORAGE_KEY,
    )
  } catch {
    return null
  }
}

export function saveActiveTripId(
  activeTripId: string | null,
): void {
  try {
    if (activeTripId) {
      localStorage.setItem(
        ACTIVE_TRIP_STORAGE_KEY,
        activeTripId,
      )

      return
    }

    localStorage.removeItem(
      ACTIVE_TRIP_STORAGE_KEY,
    )
  } catch {
    // L'app continua a funzionare anche senza localStorage.
  }
}