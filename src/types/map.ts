export type MapPointType =
  | 'hotel'
  | 'restaurant'
  | 'attraction'
  | 'transport'

export type MapPoint = {
  id: string
  tripId: string

  name: string
  location: string

  latitude: number
  longitude: number

  type: MapPointType

  createdAt: string
}