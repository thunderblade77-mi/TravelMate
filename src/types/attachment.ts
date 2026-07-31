export type TravelAttachment = {
  id: string
  documentId: string

  name: string
  mimeType: string
  size: number

  createdAt: string

  /**
   * Per ora:
   * Object URL oppure Base64.
   *
   * In futuro:
   * riferimento IndexedDB.
   */
  url: string
}

export type CreateTravelAttachmentInput = {
  documentId: string

  name: string
  mimeType: string
  size: number

  url: string
}