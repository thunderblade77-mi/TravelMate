import { useEffect, useState } from 'react'

import { supabase } from '../lib/supabase'
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

type MapPointRow = {
  id: string
  trip_id: string
  name: string
  location: string
  latitude: number
  longitude: number
  type: MapPointType
  created_at: string
}

const CLOUD_MIGRATION_KEY = 'travelg:map-points-cloud-migrated:v1'

function fromRow(row: MapPointRow): MapPoint {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    type: row.type,
    createdAt: row.created_at,
  }
}

export function useMapPoints() {
  const [mapPoints, setMapPoints] = useState<MapPoint[]>(
    loadMapPoints,
  )

  useEffect(() => {
    saveMapPoints(mapPoints)
  }, [mapPoints])

  useEffect(() => {
    let cancelled = false

    async function loadCloudPoints() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || cancelled) return

      const { data, error } = await supabase
        .from('map_points')
        .select(
          'id,trip_id,name,location,latitude,longitude,type,created_at',
        )
        .order('created_at', { ascending: true })

      if (error || cancelled) return

      const cloudPoints = ((data ?? []) as MapPointRow[]).map(fromRow)
      const alreadyMigrated =
        window.localStorage.getItem(CLOUD_MIGRATION_KEY) === '1'

      if (!alreadyMigrated) {
        const localPoints = loadMapPoints()
        const cloudIds = new Set(cloudPoints.map((point) => point.id))
        const missingLocalPoints = localPoints.filter(
          (point) => !cloudIds.has(point.id),
        )

        if (missingLocalPoints.length > 0) {
          await supabase.from('map_points').upsert(
            missingLocalPoints.map((point) => ({
              id: point.id,
              trip_id: point.tripId,
              created_by: user.id,
              name: point.name,
              location: point.location,
              latitude: point.latitude,
              longitude: point.longitude,
              type: point.type,
              created_at: point.createdAt,
            })),
            { onConflict: 'id' },
          )
        }

        window.localStorage.setItem(CLOUD_MIGRATION_KEY, '1')

        const merged = new Map<string, MapPoint>()
        cloudPoints.forEach((point) => merged.set(point.id, point))
        missingLocalPoints.forEach((point) => merged.set(point.id, point))

        if (!cancelled) {
          setMapPoints(
            Array.from(merged.values()).sort((a, b) =>
              a.createdAt.localeCompare(b.createdAt),
            ),
          )
        }
        return
      }

      if (!cancelled) {
        setMapPoints(cloudPoints)
      }
    }

    void loadCloudPoints()

    const channel = supabase
      .channel('travelg-map-points')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'map_points',
        },
        () => {
          void loadCloudPoints()
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [])

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

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from('map_points').insert({
        id: newPoint.id,
        trip_id: newPoint.tripId,
        created_by: user.id,
        name: newPoint.name,
        location: newPoint.location,
        latitude: newPoint.latitude,
        longitude: newPoint.longitude,
        type: newPoint.type,
        created_at: newPoint.createdAt,
      })
    })()

    return newPoint
  }

  function removeMapPoint(id: string) {
    setMapPoints((current) =>
      current.filter((point) => point.id !== id),
    )

    void supabase
      .from('map_points')
      .delete()
      .eq('id', id)
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
