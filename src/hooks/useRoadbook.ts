import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  addActivity,
  deleteActivity,
  getTripActivities,
  updateActivities,
  updateActivity,
} from '../services/roadbookStorage'

import type {
  CreateRoadbookActivityInput,
  RoadbookActivity,
} from '../types/roadbook'

type MoveDirection = 'up' | 'down'

function sortActivities(
  activities: RoadbookActivity[],
): RoadbookActivity[] {
  return [...activities].sort(
    (firstActivity, secondActivity) => {
      if (
        firstActivity.dayId !==
        secondActivity.dayId
      ) {
        return firstActivity.dayId.localeCompare(
          secondActivity.dayId,
        )
      }

      if (
        firstActivity.order !==
        secondActivity.order
      ) {
        return (
          firstActivity.order -
          secondActivity.order
        )
      }

      return firstActivity.createdAt.localeCompare(
        secondActivity.createdAt,
      )
    },
  )
}

export function useRoadbook(
  tripId: string | null,
) {
  const [activities, setActivities] = useState<
    RoadbookActivity[]
  >([])

  const reload = useCallback(() => {
    if (!tripId) {
      setActivities([])
      return
    }

    setActivities(
      sortActivities(
        getTripActivities(tripId),
      ),
    )
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
      order:
        typeof input.order === 'number'
          ? input.order
          : activity.order,
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
      transportType:
        activity.transportType,
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

  function moveActivity(
    activityId: string,
    direction: MoveDirection,
  ) {
    const activity = activities.find(
      (item) => item.id === activityId,
    )

    if (!activity) {
      return
    }

    const dayActivities = activities
      .filter(
        (item) =>
          item.dayId === activity.dayId,
      )
      .sort(
        (firstActivity, secondActivity) =>
          firstActivity.order -
          secondActivity.order,
      )

    const currentIndex =
      dayActivities.findIndex(
        (item) => item.id === activityId,
      )

    const targetIndex =
      direction === 'up'
        ? currentIndex - 1
        : currentIndex + 1

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= dayActivities.length
    ) {
      return
    }

    const reorderedActivities =
      [...dayActivities]

    const [movedActivity] =
      reorderedActivities.splice(
        currentIndex,
        1,
      )

    reorderedActivities.splice(
      targetIndex,
      0,
      movedActivity,
    )

    const updatedActivities =
      reorderedActivities.map(
        (item, index) => ({
          ...item,
          order: index,
        }),
      )

    updateActivities(updatedActivities)
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
    moveActivity,
    removeActivity,
    reload,
  }
}