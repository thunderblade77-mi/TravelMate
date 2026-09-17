export type TravelInterest =
  | 'arte'
  | 'monumenti'
  | 'storia'
  | 'cibo'
  | 'nightlife'
  | 'natura'
  | 'mare'
  | 'shopping'
  | 'famiglia'
  | 'avventura'
  | 'relax'
  | 'fotografia'

export type TravelPace = 'slow' | 'balanced' | 'intense'

export type TravelPreferences = {
  interests: TravelInterest[]
  pace: TravelPace
  avoidCrowds: boolean
  localFood: boolean
  hiddenGems: boolean
  updatedAt: string
}

export type VisitSource = 'gps' | 'photo' | 'manual'

export type DetectedVisit = {
  id: string
  tripId: string
  activityId?: string
  title: string
  location: string
  latitude?: number
  longitude?: number
  visitedAt: string
  source: VisitSource
  confidence: number
}

export type PlaceRating = {
  id: string
  tripId: string
  placeId: string
  placeName: string
  userId?: string
  score: number
  note?: string
  createdAt: string
}

export type MemoryItem = {
  id: string
  tripId: string
  visitId?: string
  photoUrl?: string
  title: string
  location?: string
  takenAt: string
  favorite: boolean
}

export type TripPollOption = {
  id: string
  label: string
  votes: string[]
}

export type TripPoll = {
  id: string
  tripId: string
  question: string
  options: TripPollOption[]
  closesAt?: string
  createdAt: string
}

export type TripChatMessage = {
  id: string
  tripId: string
  authorId: string
  authorName: string
  message: string
  createdAt: string
}
