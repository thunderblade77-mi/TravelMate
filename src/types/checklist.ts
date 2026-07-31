export type ChecklistItem = {
  id: string
  tripId: string
  label: string
  completed: boolean
  createdAt: string
}

export type CreateChecklistItemInput = {
  tripId: string
  label: string
}