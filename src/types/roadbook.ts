export type ActivityCategory =
  | 'visita'
  | 'ristorante'
  | 'hotel'
  | 'trasporto'
  | 'altro'

export type RoadbookActivity = {
  id: string
  tripId: string
  dayId: string
  time: string
  title: string
  location: string
  notes: string
  category: ActivityCategory
  completed: boolean
  createdAt: string
}

export type RoadbookDay = {
  id: string
  date: string
  label: string
}

export type RoadbookData = {
  version: 1
  activities: RoadbookActivity[]
}

export type CreateRoadbookActivityInput = {
  tripId: string
  dayId: string
  time: string
  title: string
  location: string
  notes: string
  category: ActivityCategory
}