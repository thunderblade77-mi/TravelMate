import type {
  CreateRoadbookActivityInput,
  RoadbookActivity,
  RoadbookData,
} from '../types/roadbook'

const STORAGE_KEY = 'travelmate-roadbook'

function emptyDatabase(): RoadbookData {
  return {
    version: 1,
    activities: [],
  }
}

function normalizeActivityOrder(
  activities: RoadbookActivity[],
): RoadbookActivity[] {
  const nextOrderByDay = new Map<string, number>()

  return activities.map((activity) => {
    const dayKey =
      `${activity.tripId}|${activity.dayId}`

    const nextOrder =
      nextOrderByDay.get(dayKey) ?? 0

    nextOrderByDay.set(dayKey, nextOrder + 1)

    return {
      ...activity,
      order:
        typeof activity.order === 'number'
          ? activity.order
          : nextOrder,
    }
  })
}

export function loadRoadbook(): RoadbookData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return emptyDatabase()
    }

    const parsed = JSON.parse(raw) as RoadbookData

    if (!Array.isArray(parsed.activities)) {
      return emptyDatabase()
    }

    return {
      version: 1,
      activities: normalizeActivityOrder(
        parsed.activities,
      ),
    }
  } catch {
    return emptyDatabase()
  }
}

export function saveRoadbook(
  data: RoadbookData,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data),
  )
}

export function getTripActivities(
  tripId: string,
): RoadbookActivity[] {
  return loadRoadbook().activities.filter(
    (activity) => activity.tripId === tripId,
  )
}

function getNextActivityOrder(
  activities: RoadbookActivity[],
  tripId: string,
  dayId: string,
): number {
  const dayActivities = activities.filter(
    (activity) =>
      activity.tripId === tripId &&
      activity.dayId === dayId,
  )

  if (dayActivities.length === 0) {
    return 0
  }

  return (
    Math.max(
      ...dayActivities.map(
        (activity) => activity.order,
      ),
    ) + 1
  )
}

export function addActivity(
  input: CreateRoadbookActivityInput,
): RoadbookActivity {
  const database = loadRoadbook()

  const activity: RoadbookActivity = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    completed: false,
    ...input,
    order:
      typeof input.order === 'number'
        ? input.order
        : getNextActivityOrder(
            database.activities,
            input.tripId,
            input.dayId,
          ),
  }

  database.activities.push(activity)

  saveRoadbook(database)

  return activity
}

export function updateActivity(
  activity: RoadbookActivity,
): void {
  const database = loadRoadbook()

  database.activities =
    database.activities.map((current) =>
      current.id === activity.id
        ? activity
        : current,
    )

  saveRoadbook(database)
}

export function updateActivities(
  activities: RoadbookActivity[],
): void {
  const database = loadRoadbook()

  const updatedActivityMap = new Map(
    activities.map((activity) => [
      activity.id,
      activity,
    ]),
  )

  database.activities =
    database.activities.map(
      (currentActivity) =>
        updatedActivityMap.get(
          currentActivity.id,
        ) ?? currentActivity,
    )

  saveRoadbook(database)
}

export function deleteActivity(
  activityId: string,
): void {
  const database = loadRoadbook()

  database.activities =
    database.activities.filter(
      (activity) =>
        activity.id !== activityId,
    )

  saveRoadbook(database)
}