import { useEffect, useState } from 'react'

import {
  loadMapPoints,
  saveMapPoints,
} from '../services/mapPointStorage'

import type {
  MapPoint,
  MapPointType,
} from '../types/map'

type CreateMapPointInput = {
  tripId: string
  name: string
  location: string
  latitude: number
  longitude: number
  type: MapPointType
}

export function useMapPoints() {
  const [mapPoints, setMapPoints] = useState<MapPoint[]>(
    loadMapPoints,
  )

  useEffect(() => {
    saveMapPoints(mapPoints)
  }, [mapPoints])

  function addMapPoint(
    input: CreateMapPointInput,
  ): MapPoint {
    const newPoint: MapPoint = {
      id: crypto.randomUUID(),
      tripId: input.tripId,
      name: input.name.trim(),
      location: input.location.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      type: input.type,
      createdAt: new Date().toISOString(),
    }

    setMapPoints((current) => [
      ...current,
      newPoint,
    ])

    return newPoint
  }

  function removeMapPoint(id: string) {
    setMapPoints((current) =>
      current.filter((point) => point.id !== id),
    )
  }

  function getTripMapPoints(
    tripId: string,
  ): MapPoint[] {
    return mapPoints.filter(
      (point) => point.tripId === tripId,
    )
  }

  return {
    mapPoints,
    addMapPoint,
    removeMapPoint,
    getTripMapPoints,
  }
}