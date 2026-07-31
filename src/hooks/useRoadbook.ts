import { useCallback, useEffect, useState } from 'react'

import {
  addActivity,
  deleteActivity,
  getTripActivities,
  updateActivity,
} from '../services/roadbookStorage'

import type {
  CreateRoadbookActivityInput,
  RoadbookActivity,
} from '../types/roadbook'

export function useRoadbook(tripId: string | null) {
  const [activities, setActivities] = useState<
    RoadbookActivity[]
  >([])

  const reload = useCallback(() => {
    if (!tripId) {
      setActivities([])
      return
    }

    setActivities(getTripActivities(tripId))
  }, [tripId])

  useEffect(() => {
    reload()
  }, [reload])

  function createActivity(
    input: Omit<
      CreateRoadbookActivityInput,
      'tripId'
    >,
  ) {
    if (!tripId) {
      return
    }

    addActivity({
      tripId,
      ...input,
    })

    reload()
  }

  function editActivity(
    activityId: string,
    input: Omit<
      CreateRoadbookActivityInput,
      'tripId'
    >,
  ) {
    const activity = activities.find(
      (item) => item.id === activityId,
    )

    if (!activity) {
      return
    }

    updateActivity({
      ...activity,
      ...input,
    })

    reload()
  }

  function duplicateActivity(
    activityId: string,
  ) {
    const activity = activities.find(
      (item) => item.id === activityId,
    )

    if (!activity || !tripId) {
      return
    }

    addActivity({
      tripId,
      dayId: activity.dayId,
      time: activity.time,
      title: `${activity.title} (copia)`,
      location: activity.location,
      notes: activity.notes,
      category: activity.category,
      mapPointId: activity.mapPointId,
    })

    reload()
  }

  function toggleCompleted(
    activityId: string,
  ) {
    const activity = activities.find(
      (item) => item.id === activityId,
    )

    if (!activity) {
      return
    }

    updateActivity({
      ...activity,
      completed: !activity.completed,
    })

    reload()
  }

  function removeActivity(
    activityId: string,
  ) {
    deleteActivity(activityId)
    reload()
  }

  return {
    activities,
    createActivity,
    editActivity,
    duplicateActivity,
    toggleCompleted,
    removeActivity,
    reload,
  }
}