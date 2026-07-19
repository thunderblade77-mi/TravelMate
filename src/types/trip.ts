export type ActivityKind = 'transport' | 'visit' | 'food' | 'rest' | 'other'

export type Activity = {
  id: string
  time: string
  title: string
  description?: string
  location?: string
  latitude?: number
  longitude?: number
  kind?: ActivityKind
}

export type ItineraryDay = {
  date: string
  city: string
  country: string
  dayNumber: number
  activities: Activity[]
}

export type TripItinerary = {
  id: string
  title: string
  startDate: string
  endDate: string
  days: ItineraryDay[]
}

export type ActivityStatus = 'past' | 'current' | 'upcoming'

export type ActivityWithStatus = Activity & {
  status: ActivityStatus
}

export type TodayItineraryState =
  | {
      kind: 'active'
      day: ItineraryDay
      currentActivity: Activity | null
      nextActivity: Activity | null
      timeline: ActivityWithStatus[]
      navigationTarget: Activity | null
    }
  | {
      kind: 'before-trip'
      trip: TripItinerary
    }
  | {
      kind: 'after-trip'
      trip: TripItinerary
    }
  | {
      kind: 'no-day'
      trip: TripItinerary
      date: string
    }
