import type { MapPoint } from '../types/map'

const MAP_POINTS_STORAGE_KEY = 'TravelG-map-points'

export function loadMapPoints(): MapPoint[] {
  const storedValue = localStorage.getItem(
    MAP_POINTS_STORAGE_KEY,
  )

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue as MapPoint[]
  } catch {
    return []
  }
}

export function saveMapPoints(
  mapPoints: MapPoint[],
): void {
  localStorage.setItem(
    MAP_POINTS_STORAGE_KEY,
    JSON.stringify(mapPoints),
  )
}