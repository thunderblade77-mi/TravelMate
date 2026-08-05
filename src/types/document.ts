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

  provider?: string
  referenceCode?: string

  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string

  origin?: string
  destination?: string

  address?: string
  phone?: string
  email?: string
  website?: string

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

  provider?: string
  referenceCode?: string

  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string

  origin?: string
  destination?: string

  address?: string
  phone?: string
  email?: string
  website?: string

  expiresAt?: string
  reminderDays?: number
}