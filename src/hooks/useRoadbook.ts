import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'
import { recordActivityExperience } from '../services/tripExperience'

import type {
  ActivityCategory,
  CreateRoadbookActivityInput,
  RoadbookActivity,
  TransportType,
} from '../types/roadbook'

type MoveDirection = 'up' | 'down'

type CloudRoadbookRow = {
  id: string
  trip_id: string
  created_by: string
  day_id: string
  activity_time: string
  title: string
  location: string
  notes: string
  category: ActivityCategory
  transport_type: TransportType | null
  activity_order: number
  completed: boolean
  map_point_id: string | null
  created_at: string
}

function createActivityId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function mapCloudActivity(row: CloudRoadbookRow): RoadbookActivity {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayId: row.day_id,
    time: row.activity_time,
    title: row.title,
    location: row.location,
    notes: row.notes,
    category: row.category,
    transportType: row.transport_type ?? undefined,
    order: row.activity_order,
    completed: row.completed,
    mapPointId: row.map_point_id ?? undefined,
    createdAt: row.created_at,
  }
}

function sortActivities(activities: RoadbookActivity[]): RoadbookActivity[] {
  return [...activities].sort((firstActivity, secondActivity) => {
    if (firstActivity.dayId !== secondActivity.dayId) {
      return firstActivity.dayId.localeCompare(secondActivity.dayId)
    }
    if (firstActivity.order !== secondActivity.order) {
      return firstActivity.order - secondActivity.order
    }
    return firstActivity.createdAt.localeCompare(secondActivity.createdAt)
  })
}

export function useRoadbook(tripId: string | null) {
  const [activities, setActivities] = useState<RoadbookActivity[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(tripId))
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!tripId) {
      setActivities([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) {
        setUserId(null)
        setActivities([])
        setError('Devi effettuare il login.')
        return
      }
      setUserId(user.id)
      const { data, error: activitiesError } = await supabase
        .from('roadbook_activities')
        .select('id,trip_id,created_by,day_id,activity_time,title,location,notes,category,transport_type,activity_order,completed,map_point_id,created_at')
        .eq('trip_id', tripId)
        .order('day_id', { ascending: true })
        .order('activity_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (activitiesError) throw activitiesError
      setActivities(sortActivities((data ?? []).map((row) => mapCloudActivity(row as CloudRoadbookRow))))
      setError(null)
    } catch (loadError) {
      console.error('Errore caricamento Roadbook:', loadError)
      setActivities([])
      setError('Impossibile caricare il Roadbook.')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => { void reload() }, [reload])

  useEffect(() => {
    if (!tripId) return
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void reload()
      }
    }

    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    const channel = supabase
      .channel(`travelg-roadbook-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roadbook_activities', filter: `trip_id=eq.${tripId}` }, () => { void reload() })
      .subscribe()
    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      void supabase.removeChannel(channel)
    }
  }, [tripId, reload])

  function createActivity(input: Omit<CreateRoadbookActivityInput, 'tripId'>) {
    if (!tripId || !userId) return
    const dayActivities = activities.filter((activity) => activity.dayId === input.dayId)
    const nextOrder = typeof input.order === 'number' ? input.order : dayActivities.length
    const newActivity: RoadbookActivity = {
      id: createActivityId(), tripId, dayId: input.dayId, time: input.time,
      title: input.title.trim(), location: input.location.trim(), notes: input.notes.trim(),
      category: input.category, transportType: input.transportType, order: nextOrder,
      completed: false, mapPointId: input.mapPointId, createdAt: new Date().toISOString(),
    }
    setActivities((current) => sortActivities([...current, newActivity]))
    void supabase.from('roadbook_activities').insert({
      id: newActivity.id, trip_id: tripId, created_by: userId, day_id: newActivity.dayId,
      activity_time: newActivity.time, title: newActivity.title, location: newActivity.location,
      notes: newActivity.notes, category: newActivity.category,
      transport_type: newActivity.transportType ?? null, activity_order: newActivity.order,
      completed: false, map_point_id: newActivity.mapPointId ?? null, created_at: newActivity.createdAt,
    }).then(({ error: insertError }) => {
      if (!insertError) { setError(null); return }
      console.error('Errore creazione attività:', insertError)
      setActivities((current) => current.filter((activity) => activity.id !== newActivity.id))
      setError('Impossibile creare l’attività.')
    })
  }

  function editActivity(activityId: string, input: Omit<CreateRoadbookActivityInput, 'tripId'>) {
    const currentActivity = activities.find((activity) => activity.id === activityId)
    if (!currentActivity) return
    const updatedActivity: RoadbookActivity = {
      ...currentActivity, dayId: input.dayId, time: input.time, title: input.title.trim(),
      location: input.location.trim(), notes: input.notes.trim(), category: input.category,
      transportType: input.transportType,
      order: typeof input.order === 'number' ? input.order : currentActivity.order,
      mapPointId: input.mapPointId,
    }
    setActivities((current) => sortActivities(current.map((activity) => activity.id === activityId ? updatedActivity : activity)))
    void supabase.from('roadbook_activities').update({
      day_id: updatedActivity.dayId, activity_time: updatedActivity.time, title: updatedActivity.title,
      location: updatedActivity.location, notes: updatedActivity.notes, category: updatedActivity.category,
      transport_type: updatedActivity.transportType ?? null, activity_order: updatedActivity.order,
      map_point_id: updatedActivity.mapPointId ?? null,
    }).eq('id', activityId).then(({ error: updateError }) => {
      if (!updateError) { setError(null); return }
      console.error('Errore modifica attività:', updateError)
      setActivities((current) => sortActivities(current.map((activity) => activity.id === activityId ? currentActivity : activity)))
      setError('Impossibile modificare l’attività.')
    })
  }

  function duplicateActivity(activityId: string) {
    const activity = activities.find((item) => item.id === activityId)
    if (!activity) return
    createActivity({ dayId: activity.dayId, time: activity.time, title: `${activity.title} (copia)`, location: activity.location, notes: activity.notes, category: activity.category, transportType: activity.transportType, mapPointId: activity.mapPointId })
  }

  function toggleCompleted(activityId: string) {
    const currentActivity = activities.find((activity) => activity.id === activityId)
    if (!currentActivity || !tripId || !userId) return
    const nextCompleted = !currentActivity.completed
    setActivities((current) => current.map((activity) => activity.id === activityId ? { ...activity, completed: nextCompleted } : activity))

    void (async () => {
      const { error: updateError } = await supabase.from('roadbook_activities').update({ completed: nextCompleted }).eq('id', activityId)
      if (updateError) {
        console.error('Errore completamento attività:', updateError)
        setActivities((current) => current.map((activity) => activity.id === activityId ? currentActivity : activity))
        setError('Impossibile aggiornare l’attività.')
        return
      }

      if (nextCompleted) {
        try {
          await recordActivityExperience({
            tripId,
            activityId,
            placeName: currentActivity.title,
            location: currentActivity.location ?? '',
            source: 'manual',
            confidence: 1,
          })
        } catch (experienceError) {
          console.error('Errore registrazione esperienza:', experienceError)
          setError('Attività completata, ma il ricordo non è stato sincronizzato. Riprova più tardi.')
          return
        }
      }
      setError(null)
    })()
  }

  function moveActivity(activityId: string, direction: MoveDirection) {
    const activity = activities.find((item) => item.id === activityId)
    if (!activity) return
    const dayActivities = activities.filter((item) => item.dayId === activity.dayId).sort((a, b) => a.order - b.order)
    const currentIndex = dayActivities.findIndex((item) => item.id === activityId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= dayActivities.length) return
    const reordered = [...dayActivities]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    const updated = reordered.map((item, index) => ({ ...item, order: index }))
    const previous = activities
    setActivities((current) => {
      const map = new Map(updated.map((item) => [item.id, item]))
      return sortActivities(current.map((item) => map.get(item.id) ?? item))
    })
    void Promise.all(updated.map((item) => supabase.from('roadbook_activities').update({ activity_order: item.order }).eq('id', item.id))).then((results) => {
      const failed = results.find((result) => result.error)
      if (!failed?.error) { setError(null); return }
      console.error('Errore riordinamento attività:', failed.error)
      setActivities(previous)
      setError('Impossibile riordinare le attività.')
    })
  }

  function removeActivity(activityId: string) {
    const removedActivity = activities.find((activity) => activity.id === activityId)
    setActivities((current) => current.filter((activity) => activity.id !== activityId))
    void supabase.from('roadbook_activities').delete().eq('id', activityId).then(({ error: deleteError }) => {
      if (!deleteError) { setError(null); return }
      console.error('Errore eliminazione attività:', deleteError)
      if (removedActivity) setActivities((current) => sortActivities([...current, removedActivity]))
      setError('Impossibile eliminare l’attività.')
    })
  }

  return { activities, loading, error, createActivity, editActivity, duplicateActivity, toggleCompleted, moveActivity, removeActivity, reload }
}
