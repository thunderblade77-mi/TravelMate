import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  CreateTravelDocumentInput,
  TravelDocument,
  TravelDocumentCategory,
} from '../types/document'

const STORAGE_KEY = 'travelmate-documents'

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24

const validCategories: TravelDocumentCategory[] = [
  'flight',
  'accommodation',
  'transport',
  'insurance',
  'identity',
  'ticket',
  'other',
]

function normalizeReminderDays(
  reminderDays: unknown,
): number | undefined {
  if (
    typeof reminderDays !== 'number' ||
    !Number.isFinite(reminderDays)
  ) {
    return undefined
  }

  return Math.max(
    0,
    Math.floor(reminderDays),
  )
}

function normalizeOptionalString(
  value: unknown,
): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const cleanValue = value.trim()

  return cleanValue || undefined
}

function normalizeCategory(
  value: unknown,
): TravelDocumentCategory | null {
  if (
    typeof value !== 'string' ||
    !validCategories.includes(
      value as TravelDocumentCategory,
    )
  ) {
    return null
  }

  return value as TravelDocumentCategory
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

  const normalizedCategory =
    normalizeCategory(candidate.category)

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.tripId !== 'string' ||
    typeof candidate.title !== 'string' ||
    !normalizedCategory ||
    typeof candidate.date !== 'string' ||
    typeof candidate.notes !== 'string' ||
    typeof candidate.createdAt !== 'string'
  ) {
    return null
  }

  return {
    id: candidate.id,
    tripId: candidate.tripId,

    title: candidate.title.trim(),
    category: normalizedCategory,
    date: candidate.date,
    notes: candidate.notes.trim(),

    provider: normalizeOptionalString(
      candidate.provider,
    ),

    referenceCode: normalizeOptionalString(
      candidate.referenceCode,
    ),

    startDate: normalizeOptionalString(
      candidate.startDate,
    ),

    startTime: normalizeOptionalString(
      candidate.startTime,
    ),

    endDate: normalizeOptionalString(
      candidate.endDate,
    ),

    endTime: normalizeOptionalString(
      candidate.endTime,
    ),

    origin: normalizeOptionalString(
      candidate.origin,
    ),

    destination: normalizeOptionalString(
      candidate.destination,
    ),

    address: normalizeOptionalString(
      candidate.address,
    ),

    phone: normalizeOptionalString(
      candidate.phone,
    ),

    email: normalizeOptionalString(
      candidate.email,
    ),

    website: normalizeOptionalString(
      candidate.website,
    ),

    expiresAt: normalizeOptionalString(
      candidate.expiresAt,
    ),

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

function parseLocalDate(
  date: string,
): Date {
  return new Date(
    `${date}T00:00:00`,
  )
}

function getToday(): Date {
  const today = new Date()

  today.setHours(
    0,
    0,
    0,
    0,
  )

  return today
}

function getDaysUntil(
  date: string,
): number {
  const targetDate =
    parseLocalDate(date)

  const today = getToday()

  return Math.ceil(
    (targetDate.getTime() -
      today.getTime()) /
      MILLISECONDS_PER_DAY,
  )
}

function cleanDocumentInput(
  input: CreateTravelDocumentInput,
): CreateTravelDocumentInput {
  return {
    ...input,

    title: input.title.trim(),
    notes: input.notes.trim(),

    provider:
      input.provider?.trim() ||
      undefined,

    referenceCode:
      input.referenceCode?.trim() ||
      undefined,

    startDate:
      input.startDate ||
      undefined,

    startTime:
      input.startTime ||
      undefined,

    endDate:
      input.endDate ||
      undefined,

    endTime:
      input.endTime ||
      undefined,

    origin:
      input.origin?.trim() ||
      undefined,

    destination:
      input.destination?.trim() ||
      undefined,

    address:
      input.address?.trim() ||
      undefined,

    phone:
      input.phone?.trim() ||
      undefined,

    email:
      input.email?.trim() ||
      undefined,

    website:
      input.website?.trim() ||
      undefined,

    expiresAt:
      input.expiresAt ||
      undefined,

    reminderDays:
      normalizeReminderDays(
        input.reminderDays,
      ),
  }
}

function getSortingDate(
  document: TravelDocument,
): string {
  return (
    document.startDate ||
    document.date ||
    ''
  )
}

export function useDocuments(
  tripId?: string,
) {
  const [
    documents,
    setDocuments,
  ] = useState<
    TravelDocument[]
  >(readDocuments)

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
      if (
        event.key === STORAGE_KEY
      ) {
        setDocuments(
          readDocuments(),
        )
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

  const tripDocuments =
    useMemo(() => {
      if (!tripId) {
        return []
      }

      return documents
        .filter(
          (document) =>
            document.tripId ===
            tripId,
        )
        .sort(
          (
            firstDocument,
            secondDocument,
          ) => {
            const firstDate =
              getSortingDate(
                firstDocument,
              )

            const secondDate =
              getSortingDate(
                secondDocument,
              )

            if (
              firstDate &&
              secondDate &&
              firstDate !== secondDate
            ) {
              return firstDate.localeCompare(
                secondDate,
              )
            }

            if (
              firstDate &&
              !secondDate
            ) {
              return -1
            }

            if (
              !firstDate &&
              secondDate
            ) {
              return 1
            }

            return secondDocument.createdAt.localeCompare(
              firstDocument.createdAt,
            )
          },
        )
    }, [documents, tripId])

  const expiredDocuments =
    useMemo(
      () =>
        tripDocuments
          .filter(
            (document) =>
              document.expiresAt &&
              getDaysUntil(
                document.expiresAt,
              ) < 0,
          )
          .sort(
            (
              firstDocument,
              secondDocument,
            ) =>
              (
                firstDocument.expiresAt ??
                ''
              ).localeCompare(
                secondDocument.expiresAt ??
                  '',
              ),
          ),
      [tripDocuments],
    )

  const expiringDocuments =
    useMemo(
      () =>
        tripDocuments
          .filter(
            (document) => {
              if (
                !document.expiresAt
              ) {
                return false
              }

              const daysUntilExpiration =
                getDaysUntil(
                  document.expiresAt,
                )

              const reminderDays =
                document.reminderDays ??
                30

              return (
                daysUntilExpiration >=
                  0 &&
                daysUntilExpiration <=
                  reminderDays
              )
            },
          )
          .sort(
            (
              firstDocument,
              secondDocument,
            ) =>
              (
                firstDocument.expiresAt ??
                ''
              ).localeCompare(
                secondDocument.expiresAt ??
                  '',
              ),
          ),
      [tripDocuments],
    )

  function addDocument(
    input: CreateTravelDocumentInput,
  ): TravelDocument {
    const cleanInput =
      cleanDocumentInput(input)

    const newDocument: TravelDocument =
      {
        id: createDocumentId(),

        ...cleanInput,

        createdAt:
          new Date().toISOString(),
      }

    setDocuments(
      (currentDocuments) => [
        ...currentDocuments,
        newDocument,
      ],
    )

    return newDocument
  }

  function updateDocument(
    documentId: string,
    updates: Partial<
      Omit<
        TravelDocument,
        | 'id'
        | 'tripId'
        | 'createdAt'
      >
    >,
  ): void {
    setDocuments(
      (currentDocuments) =>
        currentDocuments.map(
          (document) => {
            if (
              document.id !==
              documentId
            ) {
              return document
            }

            return {
              ...document,
              ...updates,

              title:
                updates.title !==
                undefined
                  ? updates.title.trim()
                  : document.title,

              notes:
                updates.notes !==
                undefined
                  ? updates.notes.trim()
                  : document.notes,

              provider:
                updates.provider !==
                undefined
                  ? updates.provider.trim() ||
                    undefined
                  : document.provider,

              referenceCode:
                updates.referenceCode !==
                undefined
                  ? updates.referenceCode.trim() ||
                    undefined
                  : document.referenceCode,

              startDate:
                updates.startDate !==
                undefined
                  ? updates.startDate ||
                    undefined
                  : document.startDate,

              startTime:
                updates.startTime !==
                undefined
                  ? updates.startTime ||
                    undefined
                  : document.startTime,

              endDate:
                updates.endDate !==
                undefined
                  ? updates.endDate ||
                    undefined
                  : document.endDate,

              endTime:
                updates.endTime !==
                undefined
                  ? updates.endTime ||
                    undefined
                  : document.endTime,

              origin:
                updates.origin !==
                undefined
                  ? updates.origin.trim() ||
                    undefined
                  : document.origin,

              destination:
                updates.destination !==
                undefined
                  ? updates.destination.trim() ||
                    undefined
                  : document.destination,

              address:
                updates.address !==
                undefined
                  ? updates.address.trim() ||
                    undefined
                  : document.address,

              phone:
                updates.phone !==
                undefined
                  ? updates.phone.trim() ||
                    undefined
                  : document.phone,

              email:
                updates.email !==
                undefined
                  ? updates.email.trim() ||
                    undefined
                  : document.email,

              website:
                updates.website !==
                undefined
                  ? updates.website.trim() ||
                    undefined
                  : document.website,

              expiresAt:
                updates.expiresAt !==
                undefined
                  ? updates.expiresAt ||
                    undefined
                  : document.expiresAt,

              reminderDays:
                updates.reminderDays !==
                undefined
                  ? normalizeReminderDays(
                      updates.reminderDays,
                    )
                  : document.reminderDays,
            }
          },
        ),
    )
  }

  function deleteDocument(
    documentId: string,
  ): void {
    setDocuments(
      (currentDocuments) =>
        currentDocuments.filter(
          (document) =>
            document.id !==
            documentId,
        ),
    )
  }

  function clearTripDocuments(
    targetTripId?: string,
  ): void {
    const idToClear =
      targetTripId ?? tripId

    if (!idToClear) {
      return
    }

    setDocuments(
      (currentDocuments) =>
        currentDocuments.filter(
          (document) =>
            document.tripId !==
            idToClear,
        ),
    )
  }

  function getDocumentById(
    documentId: string,
  ): TravelDocument | undefined {
    return documents.find(
      (document) =>
        document.id ===
        documentId,
    )
  }

  return {
    documents: tripDocuments,

    documentCount:
      tripDocuments.length,

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