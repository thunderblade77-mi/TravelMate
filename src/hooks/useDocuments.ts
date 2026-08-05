import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

import type {
  CreateTravelDocumentInput,
  TravelDocument,
  TravelDocumentCategory,
} from '../types/document'

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24

type CloudDocumentRow = {
  id: string
  trip_id: string
  created_by: string
  title: string
  category: TravelDocumentCategory
  document_date: string
  notes: string
  provider: string | null
  reference_code: string | null
  start_date: string | null
  start_time: string | null
  end_date: string | null
  end_time: string | null
  origin: string | null
  destination: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  expires_at: string | null
  reminder_days: number | null
  created_at: string
}

type DocumentUpdate = Partial<
  Omit<
    TravelDocument,
    'id' | 'tripId' | 'createdAt'
  >
>

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

function createDocumentId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
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
      input.provider?.trim() || undefined,

    referenceCode:
      input.referenceCode?.trim() ||
      undefined,

    startDate:
      input.startDate || undefined,

    startTime:
      input.startTime || undefined,

    endDate:
      input.endDate || undefined,

    endTime:
      input.endTime || undefined,

    origin:
      input.origin?.trim() || undefined,

    destination:
      input.destination?.trim() ||
      undefined,

    address:
      input.address?.trim() || undefined,

    phone:
      input.phone?.trim() || undefined,

    email:
      input.email?.trim() || undefined,

    website:
      input.website?.trim() || undefined,

    expiresAt:
      input.expiresAt || undefined,

    reminderDays: normalizeReminderDays(
      input.reminderDays,
    ),
  }
}

function mapCloudDocument(
  row: CloudDocumentRow,
): TravelDocument {
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    category: row.category,
    date: row.document_date,
    notes: row.notes,

    provider:
      row.provider ?? undefined,

    referenceCode:
      row.reference_code ?? undefined,

    startDate:
      row.start_date ?? undefined,

    startTime:
      row.start_time ?? undefined,

    endDate:
      row.end_date ?? undefined,

    endTime:
      row.end_time ?? undefined,

    origin:
      row.origin ?? undefined,

    destination:
      row.destination ?? undefined,

    address:
      row.address ?? undefined,

    phone:
      row.phone ?? undefined,

    email:
      row.email ?? undefined,

    website:
      row.website ?? undefined,

    expiresAt:
      row.expires_at ?? undefined,

    reminderDays:
      row.reminder_days ?? undefined,

    createdAt: row.created_at,
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
  const [documents, setDocuments] =
    useState<TravelDocument[]>([])

  const [userId, setUserId] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(Boolean(tripId))

  const [error, setError] =
    useState<string | null>(null)

  const reloadDocuments =
    useCallback(async () => {
      if (!tripId) {
        setDocuments([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          setUserId(null)
          setDocuments([])
          setError(
            'Devi effettuare il login.',
          )
          return
        }

        setUserId(user.id)

        const {
          data,
          error: documentsError,
        } = await supabase
          .from('travel_documents')
          .select(
            `
              id,
              trip_id,
              created_by,
              title,
              category,
              document_date,
              notes,
              provider,
              reference_code,
              start_date,
              start_time,
              end_date,
              end_time,
              origin,
              destination,
              address,
              phone,
              email,
              website,
              expires_at,
              reminder_days,
              created_at
            `,
          )
          .eq('trip_id', tripId)
          .order('created_at', {
            ascending: false,
          })

        if (documentsError) {
          throw documentsError
        }

        setDocuments(
          (data ?? []).map((row) =>
            mapCloudDocument(
              row as CloudDocumentRow,
            ),
          ),
        )

        setError(null)
      } catch (loadError) {
        console.error(
          'Errore caricamento documenti:',
          loadError,
        )

        setDocuments([])
        setError(
          'Impossibile caricare documenti e prenotazioni.',
        )
      } finally {
        setLoading(false)
      }
    }, [tripId])

  useEffect(() => {
    void reloadDocuments()
  }, [reloadDocuments])

  useEffect(() => {
    if (!tripId) {
      return
    }

    const channel = supabase
      .channel(
        `travelg-documents-${tripId}`,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'travel_documents',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void reloadDocuments()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tripId, reloadDocuments])

  const tripDocuments = useMemo(
    () =>
      [...documents].sort(
        (
          firstDocument,
          secondDocument,
        ) => {
          const firstDate =
            getSortingDate(firstDocument)

          const secondDate =
            getSortingDate(secondDocument)

          if (
            firstDate &&
            secondDate &&
            firstDate !== secondDate
          ) {
            return firstDate.localeCompare(
              secondDate,
            )
          }

          if (firstDate && !secondDate) {
            return -1
          }

          if (!firstDate && secondDate) {
            return 1
          }

          return secondDocument.createdAt.localeCompare(
            firstDocument.createdAt,
          )
        },
      ),
    [documents],
  )

  const expiredDocuments = useMemo(
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

  const expiringDocuments = useMemo(
    () =>
      tripDocuments
        .filter((document) => {
          if (!document.expiresAt) {
            return false
          }

          const daysUntilExpiration =
            getDaysUntil(
              document.expiresAt,
            )

          const reminderDays =
            document.reminderDays ?? 30

          return (
            daysUntilExpiration >= 0 &&
            daysUntilExpiration <=
              reminderDays
          )
        })
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
    if (!userId) {
      throw new Error(
        'Utente non autenticato.',
      )
    }

    const cleanInput =
      cleanDocumentInput(input)

    const newDocument: TravelDocument = {
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

    void supabase
      .from('travel_documents')
      .insert({
        id: newDocument.id,
        trip_id: newDocument.tripId,
        created_by: userId,
        title: newDocument.title,
        category: newDocument.category,
        document_date:
  newDocument.date || null,
        notes: newDocument.notes,
        provider:
          newDocument.provider ?? null,
        reference_code:
          newDocument.referenceCode ??
          null,
        start_date:
          newDocument.startDate ?? null,
        start_time:
          newDocument.startTime ?? null,
        end_date:
          newDocument.endDate ?? null,
        end_time:
          newDocument.endTime ?? null,
        origin:
          newDocument.origin ?? null,
        destination:
          newDocument.destination ??
          null,
        address:
          newDocument.address ?? null,
        phone:
          newDocument.phone ?? null,
        email:
          newDocument.email ?? null,
        website:
          newDocument.website ?? null,
        expires_at:
          newDocument.expiresAt ?? null,
        reminder_days:
          newDocument.reminderDays ??
          null,
        created_at:
          newDocument.createdAt,
      })
      .then(({ error: insertError }) => {
        if (!insertError) {
          setError(null)
          return
        }

        console.error(
          'Errore aggiunta documento:',
          insertError,
        )

        setDocuments(
          (currentDocuments) =>
            currentDocuments.filter(
              (document) =>
                document.id !==
                newDocument.id,
            ),
        )

        setError(
          'Impossibile aggiungere il documento.',
        )
      })

    return newDocument
  }

  function updateDocument(
    documentId: string,
    updates: DocumentUpdate,
  ): void {
    const currentDocument =
      documents.find(
        (document) =>
          document.id === documentId,
      )

    if (!currentDocument) {
      return
    }

    const updatedDocument: TravelDocument = {
      ...currentDocument,
      ...updates,

      title:
        updates.title !== undefined
          ? updates.title.trim()
          : currentDocument.title,

      notes:
        updates.notes !== undefined
          ? updates.notes.trim()
          : currentDocument.notes,

      provider:
        updates.provider !== undefined
          ? normalizeOptionalString(
              updates.provider,
            )
          : currentDocument.provider,

      referenceCode:
        updates.referenceCode !== undefined
          ? normalizeOptionalString(
              updates.referenceCode,
            )
          : currentDocument.referenceCode,

      startDate:
        updates.startDate !== undefined
          ? updates.startDate ||
            undefined
          : currentDocument.startDate,

      startTime:
        updates.startTime !== undefined
          ? updates.startTime ||
            undefined
          : currentDocument.startTime,

      endDate:
        updates.endDate !== undefined
          ? updates.endDate || undefined
          : currentDocument.endDate,

      endTime:
        updates.endTime !== undefined
          ? updates.endTime || undefined
          : currentDocument.endTime,

      origin:
        updates.origin !== undefined
          ? normalizeOptionalString(
              updates.origin,
            )
          : currentDocument.origin,

      destination:
        updates.destination !== undefined
          ? normalizeOptionalString(
              updates.destination,
            )
          : currentDocument.destination,

      address:
        updates.address !== undefined
          ? normalizeOptionalString(
              updates.address,
            )
          : currentDocument.address,

      phone:
        updates.phone !== undefined
          ? normalizeOptionalString(
              updates.phone,
            )
          : currentDocument.phone,

      email:
        updates.email !== undefined
          ? normalizeOptionalString(
              updates.email,
            )
          : currentDocument.email,

      website:
        updates.website !== undefined
          ? normalizeOptionalString(
              updates.website,
            )
          : currentDocument.website,

      expiresAt:
        updates.expiresAt !== undefined
          ? updates.expiresAt ||
            undefined
          : currentDocument.expiresAt,

      reminderDays:
        updates.reminderDays !== undefined
          ? normalizeReminderDays(
              updates.reminderDays,
            )
          : currentDocument.reminderDays,
    }

    setDocuments(
      (currentDocuments) =>
        currentDocuments.map(
          (document) =>
            document.id === documentId
              ? updatedDocument
              : document,
        ),
    )

    void supabase
      .from('travel_documents')
      .update({
        title: updatedDocument.title,
        category:
          updatedDocument.category,
        document_date:
  updatedDocument.date || null,
        notes: updatedDocument.notes,
        provider:
          updatedDocument.provider ??
          null,
        reference_code:
          updatedDocument.referenceCode ??
          null,
        start_date:
          updatedDocument.startDate ??
          null,
        start_time:
          updatedDocument.startTime ??
          null,
        end_date:
          updatedDocument.endDate ??
          null,
        end_time:
          updatedDocument.endTime ??
          null,
        origin:
          updatedDocument.origin ?? null,
        destination:
          updatedDocument.destination ??
          null,
        address:
          updatedDocument.address ??
          null,
        phone:
          updatedDocument.phone ?? null,
        email:
          updatedDocument.email ?? null,
        website:
          updatedDocument.website ??
          null,
        expires_at:
          updatedDocument.expiresAt ??
          null,
        reminder_days:
          updatedDocument.reminderDays ??
          null,
      })
      .eq('id', documentId)
      .then(({ error: updateError }) => {
        if (!updateError) {
          setError(null)
          return
        }

        console.error(
          'Errore aggiornamento documento:',
          updateError,
        )

        setDocuments(
          (currentDocuments) =>
            currentDocuments.map(
              (document) =>
                document.id ===
                documentId
                  ? currentDocument
                  : document,
            ),
        )

        setError(
          'Impossibile aggiornare il documento.',
        )
      })
  }

  function deleteDocument(
    documentId: string,
  ): void {
    const deletedDocument =
      documents.find(
        (document) =>
          document.id === documentId,
      )

    setDocuments(
      (currentDocuments) =>
        currentDocuments.filter(
          (document) =>
            document.id !== documentId,
        ),
    )

    void supabase
      .from('travel_documents')
      .delete()
      .eq('id', documentId)
      .then(({ error: deleteError }) => {
        if (!deleteError) {
          setError(null)
          return
        }

        console.error(
          'Errore eliminazione documento:',
          deleteError,
        )

        if (deletedDocument) {
          setDocuments(
            (currentDocuments) => [
              ...currentDocuments,
              deletedDocument,
            ],
          )
        }

        setError(
          'Impossibile eliminare il documento.',
        )
      })
  }

  function clearTripDocuments(
    targetTripId?: string,
  ): void {
    const idToClear =
      targetTripId ?? tripId

    if (!idToClear) {
      return
    }

    const previousDocuments =
      documents

    setDocuments(
      (currentDocuments) =>
        currentDocuments.filter(
          (document) =>
            document.tripId !==
            idToClear,
        ),
    )

    void supabase
      .from('travel_documents')
      .delete()
      .eq('trip_id', idToClear)
      .then(({ error: deleteError }) => {
        if (!deleteError) {
          setError(null)
          return
        }

        console.error(
          'Errore eliminazione documenti viaggio:',
          deleteError,
        )

        setDocuments(previousDocuments)

        setError(
          'Impossibile eliminare i documenti del viaggio.',
        )
      })
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

    documentCount:
      tripDocuments.length,

    expiredDocuments,

    expiredDocumentCount:
      expiredDocuments.length,

    expiringDocuments,

    expiringDocumentCount:
      expiringDocuments.length,

    loading,
    error,

    addDocument,
    updateDocument,
    deleteDocument,
    clearTripDocuments,
    getDocumentById,

    reloadDocuments,
  }
}