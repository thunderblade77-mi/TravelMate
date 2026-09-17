export type VisitTarget = {
  id: string
  title: string
  location: string
  latitude: number
  longitude: number
}

export type VisitMatch = VisitTarget & {
  distanceMeters: number
}

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function distanceInMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const deltaLatitude = toRadians(latitudeB - latitudeA)
  const deltaLongitude = toRadians(longitudeB - longitudeA)

  const firstLatitude = toRadians(latitudeA)
  const secondLatitude = toRadians(latitudeB)

  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(deltaLongitude / 2) ** 2

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  )
}

export function findNearbyVisit(
  latitude: number,
  longitude: number,
  targets: VisitTarget[],
  radiusMeters = 120,
): VisitMatch | null {
  const matches = targets
    .map((target) => ({
      ...target,
      distanceMeters: distanceInMeters(
        latitude,
        longitude,
        target.latitude,
        target.longitude,
      ),
    }))
    .filter((target) => target.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)

  return matches[0] ?? null
}

export function watchNearbyVisits(
  targets: VisitTarget[],
  onMatch: (match: VisitMatch) => void,
  onError?: (error: GeolocationPositionError) => void,
  radiusMeters = 120,
): () => void {
  if (!('geolocation' in navigator) || targets.length === 0) {
    return () => undefined
  }

  let lastMatchId: string | null = null

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const match = findNearbyVisit(
        position.coords.latitude,
        position.coords.longitude,
        targets,
        radiusMeters,
      )

      if (!match || match.id === lastMatchId) {
        return
      }

      lastMatchId = match.id
      onMatch(match)
    },
    onError,
    {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 20_000,
    },
  )

  return () => navigator.geolocation.clearWatch(watchId)
}
