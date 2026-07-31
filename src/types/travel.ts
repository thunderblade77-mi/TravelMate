export type Page =
  | 'home'
  | 'create-trip'
  | 'trips'
  | 'map'
  | 'profile'
  | 'roadbook'

export type Trip = {
  id: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budget: number
  transport: string

  latitude?: number
  longitude?: number
}