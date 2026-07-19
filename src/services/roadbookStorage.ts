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

export function loadRoadbook(): RoadbookData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return emptyDatabase()
    }

    const parsed = JSON.parse(raw) as RoadbookData

    if (!parsed.activities) {
      return emptyDatabase()
    }

    return parsed
  } catch {
    return emptyDatabase()
  }
}

export function saveRoadbook(data: RoadbookData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getTripActivities(
  tripId: string,
): RoadbookActivity[] {
  return loadRoadbook().activities.filter(
    (activity) => activity.tripId === tripId,
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
  }

  database.activities.push(activity)

  saveRoadbook(database)

  return activity
}

export function updateActivity(
  activity: RoadbookActivity,
) {
  const database = loadRoadbook()

  database.activities = database.activities.map((current) =>
    current.id === activity.id ? activity : current,
  )

  saveRoadbook(database)
}

export function deleteActivity(activityId: string) {
  const database = loadRoadbook()

  database.activities = database.activities.filter(
    (activity) => activity.id !== activityId,
  )

  saveRoadbook(database)
}