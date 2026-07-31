import { useEffect, useMemo, useState } from 'react'

import type {
  CreateTravelDocumentInput,
  TravelDocument,
} from '../types/document'

const STORAGE_KEY = 'travelmate-documents'
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

function normalizeReminderDays(
  reminderDays: unknown,
): number | undefined {
  if (
    typeof reminderDays !== 'number' ||
    !Number.isFinite(reminderDays)
  ) {
    return undefined
  }

  return Math.max(0, Math.floor(reminderDays))
}

function normalizeDocument(
  document: unknown,
): TravelDocument | null {
  if (
    typeof document !== 'object' ||
    document === null
  ) {
    return null
  }

  const candidate =
    document as Partial<TravelDocument>

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.tripId !== 'string' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.category !== 'string' ||
    typeof candidate.date !== 'string' ||
    typeof candidate.notes !== 'string' ||
    typeof candidate.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: candidate.id,
    tripId: candidate.tripId,
    title: candidate.title,
    category: candidate.category,
    date: candidate.date,
    notes: candidate.notes,
    expiresAt:
      typeof candidate.expiresAt === 'string' &&
      candidate.expiresAt
        ? candidate.expiresAt
        : undefined,
    reminderDays: normalizeReminderDays(
      candidate.reminderDays,
    ),
    createdAt: candidate.createdAt,
  }
}

function readDocuments(): TravelDocument[] {
  try {
    const storedDocuments =
      localStorage.getItem(STORAGE_KEY)

    if (!storedDocuments) {
      return []
    }

    const parsedDocuments: unknown =
      JSON.parse(storedDocuments)

    if (!Array.isArray(parsedDocuments)) {
      return []
    }

    return parsedDocuments
      .map(normalizeDocument)
      .filter(
        (
          document,
        ): document is TravelDocument =>
          document !== null,
      )
  } catch {
    return []
  }
}

function createDocumentId(): string {
  if (
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function parseLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return today
}

function getDaysUntil(date: string): number {
  const targetDate = parseLocalDate(date)
  const today = getToday()

  return Math.ceil(
    (targetDate.getTime() - today.getTime()) /
      MILLISECONDS_PER_DAY,
  )
}

export function useDocuments(tripId?: string) {
  const [documents, setDocuments] =
    useState<TravelDocument[]>(readDocuments)

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(documents),
    )
  }, [documents])

  useEffect(() => {
    function handleStorageChange(
      event: StorageEvent,
    ) {
      if (event.key === STORAGE_KEY) {
        setDocuments(readDocuments())
      }
    }

    window.addEventListener(
      'storage',
      handleStorageChange,
    )

    return () => {
      window.removeEventListener(
        'storage',
        handleStorageChange,
      )
    }
  }, [])

  const tripDocuments = useMemo(() => {
    if (!tripId) {
      return []
    }

    return documents
      .filter(
        (document) =>
          document.tripId === tripId,
      )
      .sort(
        (
          firstDocument,
          secondDocument,
        ) => {
          if (
            firstDocument.date &&
            secondDocument.date
          ) {
            return firstDocument.date.localeCompare(
              secondDocument.date,
            )
          }

          if (firstDocument.date) {
            return -1
          }

          if (secondDocument.date) {
            return 1
          }

          return secondDocument.createdAt.localeCompare(
            firstDocument.createdAt,
          )
        },
      )
  }, [documents, tripId])

  const expiredDocuments = useMemo(
    () =>
      tripDocuments
        .filter(
          (document) =>
            document.expiresAt &&
            getDaysUntil(document.expiresAt) < 0,
        )
        .sort((firstDocument, secondDocument) =>
          (firstDocument.expiresAt ?? '').localeCompare(
            secondDocument.expiresAt ?? '',
          ),
        ),
    [tripDocuments],
  )

  const expiringDocuments = useMemo(
    () =>
      tripDocuments
        .filter((document) => {
          if (!document.expiresAt) {
            return false
          }

          const daysUntilExpiration =
            getDaysUntil(document.expiresAt)

          const reminderDays =
            document.reminderDays ?? 30

          return (
            daysUntilExpiration >= 0 &&
            daysUntilExpiration <= reminderDays
          )
        })
        .sort((firstDocument, secondDocument) =>
          (firstDocument.expiresAt ?? '').localeCompare(
            secondDocument.expiresAt ?? '',
          ),
        ),
    [tripDocuments],
  )

  function addDocument(
    input: CreateTravelDocumentInput,
  ): TravelDocument {
    const newDocument: TravelDocument = {
      id: createDocumentId(),
      tripId: input.tripId,
      title: input.title.trim(),
      category: input.category,
      date: input.date,
      notes: input.notes.trim(),
      expiresAt: input.expiresAt || undefined,
      reminderDays: normalizeReminderDays(
        input.reminderDays,
      ),
      createdAt: new Date().toISOString(),
    }

    setDocuments((currentDocuments) => [
      ...currentDocuments,
      newDocument,
    ])

    return newDocument
  }

  function updateDocument(
    documentId: string,
    updates: Partial<
      Omit<
        TravelDocument,
        'id' | 'tripId' | 'createdAt'
      >
    >,
  ) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) => {
        if (document.id !== documentId) {
          return document
        }

        return {
          ...document,
          ...updates,
          title:
            updates.title !== undefined
              ? updates.title.trim()
              : document.title,
          notes:
            updates.notes !== undefined
              ? updates.notes.trim()
              : document.notes,
          expiresAt:
            updates.expiresAt !== undefined
              ? updates.expiresAt || undefined
              : document.expiresAt,
          reminderDays:
            updates.reminderDays !== undefined
              ? normalizeReminderDays(
                  updates.reminderDays,
                )
              : document.reminderDays,
        }
      }),
    )
  }

  function deleteDocument(documentId: string) {
    setDocuments((currentDocuments) =>
      currentDocuments.filter(
        (document) =>
          document.id !== documentId,
      ),
    )
  }

  function clearTripDocuments(
    targetTripId?: string,
  ) {
    const idToClear = targetTripId ?? tripId

    if (!idToClear) {
      return
    }

    setDocuments((currentDocuments) =>
      currentDocuments.filter(
        (document) =>
          document.tripId !== idToClear,
      ),
    )
  }

  function getDocumentById(
    documentId: string,
  ): TravelDocument | undefined {
    return documents.find(
      (document) =>
        document.id === documentId,
    )
  }

  return {
    documents: tripDocuments,
    documentCount: tripDocuments.length,
    expiredDocuments,
    expiredDocumentCount:
      expiredDocuments.length,
    expiringDocuments,
    expiringDocumentCount:
      expiringDocuments.length,
    addDocument,
    updateDocument,
    deleteDocument,
    clearTripDocuments,
    getDocumentById,
  }
}