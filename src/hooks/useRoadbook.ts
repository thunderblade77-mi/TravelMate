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
  const [activities, setActivities] = useState<RoadbookActivity[]>([])

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
    input: Omit<CreateRoadbookActivityInput, 'tripId'>,
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

  function toggleCompleted(activityId: string) {
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

  function removeActivity(activityId: string) {
    deleteActivity(activityId)
    reload()
  }

  return {
    activities,
    createActivity,
    toggleCompleted,
    removeActivity,
    reload,
  }
}