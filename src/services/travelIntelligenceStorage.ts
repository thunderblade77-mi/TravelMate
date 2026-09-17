import type {
  DetectedVisit,
  PlaceRating,
  TravelPreferences,
} from '../types/travelIntelligence'

const PREFERENCES_KEY = 'travelmate:preferences:v1'
const VISITS_KEY = 'travelmate:detected-visits:v1'
const RATINGS_KEY = 'travelmate:place-ratings:v1'

export const defaultTravelPreferences: TravelPreferences = {
  interests: [],
  pace: 'balanced',
  avoidCrowds: false,
  localFood: true,
  hiddenGems: true,
  updatedAt: new Date(0).toISOString(),
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadTravelPreferences(): TravelPreferences {
  return readJson(PREFERENCES_KEY, defaultTravelPreferences)
}

export function saveTravelPreferences(
  preferences: Omit<TravelPreferences, 'updatedAt'>,
): TravelPreferences {
  const saved: TravelPreferences = {
    ...preferences,
    updatedAt: new Date().toISOString(),
  }

  writeJson(PREFERENCES_KEY, saved)
  return saved
}

export function loadDetectedVisits(tripId?: string): DetectedVisit[] {
  const visits = readJson<DetectedVisit[]>(VISITS_KEY, [])
  return tripId ? visits.filter((visit) => visit.tripId === tripId) : visits
}

export function saveDetectedVisit(visit: DetectedVisit): DetectedVisit[] {
  const visits = loadDetectedVisits()
  const withoutDuplicate = visits.filter((item) => item.id !== visit.id)
  const next = [...withoutDuplicate, visit]
  writeJson(VISITS_KEY, next)
  return next
}

export function loadPlaceRatings(tripId?: string): PlaceRating[] {
  const ratings = readJson<PlaceRating[]>(RATINGS_KEY, [])
  return tripId ? ratings.filter((rating) => rating.tripId === tripId) : ratings
}

export function savePlaceRating(rating: PlaceRating): PlaceRating[] {
  const ratings = loadPlaceRatings()
  const next = [
    ...ratings.filter((item) => item.id !== rating.id),
    {
      ...rating,
      score: Math.max(1, Math.min(10, Math.round(rating.score))),
    },
  ]
  writeJson(RATINGS_KEY, next)
  return next
}
