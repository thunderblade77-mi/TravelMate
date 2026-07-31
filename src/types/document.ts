export type TravelDocumentCategory =
  | 'flight'
  | 'accommodation'
  | 'transport'
  | 'insurance'
  | 'identity'
  | 'ticket'
  | 'other'

export type TravelDocument = {
  id: string
  tripId: string
  title: string
  category: TravelDocumentCategory
  date: string
  notes: string

  expiresAt?: string
  reminderDays?: number

  createdAt: string
}

export type CreateTravelDocumentInput = {
  tripId: string
  title: string
  category: TravelDocumentCategory
  date: string
  notes: string

  expiresAt?: string
  reminderDays?: number
}