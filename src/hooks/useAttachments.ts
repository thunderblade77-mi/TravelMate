import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  openDB,
  type DBSchema,
} from 'idb'

import type {
  CreateTravelAttachmentInput,
  TravelAttachment,
} from '../types/attachment'

type StoredTravelAttachment = Omit<
  TravelAttachment,
  'url'
> & {
  blob: Blob
}

interface TravelMateDatabase extends DBSchema {
  attachments: {
    key: string
    value: StoredTravelAttachment
    indexes: {
      'by-document-id': string
    }
  }
}

const DATABASE_NAME = 'travelmate'
const DATABASE_VERSION = 1
const STORE_NAME = 'attachments'
const ATTACHMENTS_CHANGED_EVENT =
  'travelmate-attachments-changed'

function createAttachmentId(): string {
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

const databasePromise =
  openDB<TravelMateDatabase>(
    DATABASE_NAME,
    DATABASE_VERSION,
    {
      upgrade(database) {
        if (
          !database.objectStoreNames.contains(
            STORE_NAME,
          )
        ) {
          const attachmentStore =
            database.createObjectStore(
              STORE_NAME,
              {
                keyPath: 'id',
              },
            )

          attachmentStore.createIndex(
            'by-document-id',
            'documentId',
          )
        }
      },
    },
  )

function notifyAttachmentsChanged(
  documentId: string,
) {
  window.dispatchEvent(
    new CustomEvent(
      ATTACHMENTS_CHANGED_EVENT,
      {
        detail: {
          documentId,
        },
      },
    ),
  )
}

async function readDocumentAttachments(
  documentId: string,
): Promise<StoredTravelAttachment[]> {
  const database = await databasePromise

  const storedAttachments =
    await database.getAllFromIndex(
      STORE_NAME,
      'by-document-id',
      documentId,
    )

  return storedAttachments.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

export function useAttachments(
  documentId?: string,
) {
  const [attachments, setAttachments] =
    useState<TravelAttachment[]>([])

  const [isLoading, setIsLoading] =
    useState(Boolean(documentId))

  const [error, setError] = useState<
    string | null
  >(null)

  const generatedUrlsRef = useRef<
    Set<string>
  >(new Set())

  const revokeGeneratedUrls =
    useCallback(() => {
      generatedUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(url)
        },
      )

      generatedUrlsRef.current.clear()
    }, [])

  const loadAttachments =
    useCallback(async () => {
      revokeGeneratedUrls()

      if (!documentId) {
        setAttachments([])
        setIsLoading(false)
        setError(null)

        return
      }

      setIsLoading(true)

      try {
        const storedAttachments =
          await readDocumentAttachments(
            documentId,
          )

        const loadedAttachments =
          storedAttachments.map(
            (attachment) => {
              const url =
                URL.createObjectURL(
                  attachment.blob,
                )

              generatedUrlsRef.current.add(
                url,
              )

              return {
                id: attachment.id,
                documentId:
                  attachment.documentId,
                name: attachment.name,
                mimeType:
                  attachment.mimeType,
                size: attachment.size,
                createdAt:
                  attachment.createdAt,
                url,
              }
            },
          )

        setAttachments(loadedAttachments)
        setError(null)
      } catch (loadError) {
        console.error(
          'Errore durante il caricamento degli allegati:',
          loadError,
        )

        setAttachments([])
        setError(
          'Impossibile caricare gli allegati.',
        )
      } finally {
        setIsLoading(false)
      }
    }, [
      documentId,
      revokeGeneratedUrls,
    ])

  useEffect(() => {
    void loadAttachments()

    return () => {
      revokeGeneratedUrls()
    }
  }, [
    loadAttachments,
    revokeGeneratedUrls,
  ])

  useEffect(() => {
    function handleAttachmentsChanged(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<{
          documentId?: string
        }>

      if (
        customEvent.detail?.documentId ===
        documentId
      ) {
        void loadAttachments()
      }
    }

    window.addEventListener(
      ATTACHMENTS_CHANGED_EVENT,
      handleAttachmentsChanged,
    )

    return () => {
      window.removeEventListener(
        ATTACHMENTS_CHANGED_EVENT,
        handleAttachmentsChanged,
      )
    }
  }, [documentId, loadAttachments])

  async function addAttachment(
    input: CreateTravelAttachmentInput,
  ): Promise<TravelAttachment> {
    try {
      const response = await fetch(input.url)

      if (!response.ok) {
        throw new Error(
          'Impossibile leggere il file selezionato.',
        )
      }

      const blob = await response.blob()

      const attachment: TravelAttachment = {
        id: createAttachmentId(),
        documentId: input.documentId,
        name: input.name,
        mimeType:
          input.mimeType ||
          blob.type ||
          'application/octet-stream',
        size: input.size || blob.size,
        url: input.url,
        createdAt:
          new Date().toISOString(),
      }

      const storedAttachment: StoredTravelAttachment =
        {
          id: attachment.id,
          documentId:
            attachment.documentId,
          name: attachment.name,
          mimeType:
            attachment.mimeType,
          size: attachment.size,
          createdAt:
            attachment.createdAt,
          blob,
        }

      const database =
        await databasePromise

      await database.put(
        STORE_NAME,
        storedAttachment,
      )

      if (input.url.startsWith('blob:')) {
        URL.revokeObjectURL(input.url)
      }

      setError(null)

      notifyAttachmentsChanged(
        input.documentId,
      )

      return attachment
    } catch (addError) {
      console.error(
        'Errore durante il salvataggio dell’allegato:',
        addError,
      )

      setError(
        'Impossibile salvare l’allegato.',
      )

      throw addError
    }
  }

  async function deleteAttachment(
    attachmentId: string,
  ): Promise<void> {
    try {
      const database =
        await databasePromise

      await database.delete(
        STORE_NAME,
        attachmentId,
      )

      setError(null)

      if (documentId) {
        notifyAttachmentsChanged(
          documentId,
        )
      }
    } catch (deleteError) {
      console.error(
        'Errore durante l’eliminazione dell’allegato:',
        deleteError,
      )

      setError(
        'Impossibile eliminare l’allegato.',
      )

      throw deleteError
    }
  }

  async function clearDocumentAttachments(
    targetDocumentId?: string,
  ): Promise<void> {
    const id =
      targetDocumentId ?? documentId

    if (!id) {
      return
    }

    try {
      const database =
        await databasePromise

      const transaction =
        database.transaction(
          STORE_NAME,
          'readwrite',
        )

      const attachmentKeys =
        await transaction.store.index(
          'by-document-id',
        ).getAllKeys(id)

      await Promise.all(
        attachmentKeys.map(
          (attachmentId) =>
            transaction.store.delete(
              attachmentId,
            ),
        ),
      )

      await transaction.done

      setError(null)

      notifyAttachmentsChanged(id)
    } catch (clearError) {
      console.error(
        'Errore durante l’eliminazione degli allegati:',
        clearError,
      )

      setError(
        'Impossibile eliminare gli allegati.',
      )

      throw clearError
    }
  }

  const attachmentCount = useMemo(
    () => attachments.length,
    [attachments],
  )

  return {
    attachments,
    attachmentCount,
    isLoading,
    error,
    addAttachment,
    deleteAttachment,
    clearDocumentAttachments,
  }
}