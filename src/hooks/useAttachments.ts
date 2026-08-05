import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

import type {
  CreateTravelAttachmentInput,
  TravelAttachment,
} from '../types/attachment'

const BUCKET_NAME = 'travel-attachments'
const SIGNED_URL_DURATION = 60 * 60

type CloudAttachmentRow = {
  id: string
  trip_id: string
  document_id: string
  created_by: string
  name: string
  mime_type: string
  file_size: number | string
  storage_path: string
  created_at: string
}

function createAttachmentId(): string {
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

function sanitizeFileName(
  fileName: string,
): string {
  return (
    fileName
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') ||
    'allegato'
  )
}

export function useAttachments(
  documentId?: string,
) {
  const [attachments, setAttachments] =
    useState<TravelAttachment[]>([])

  const [isLoading, setIsLoading] =
    useState(Boolean(documentId))

  const [error, setError] =
    useState<string | null>(null)

  const loadAttachments =
    useCallback(async () => {
      if (!documentId) {
        setAttachments([])
        setIsLoading(false)
        setError(null)
        return
      }

      setIsLoading(true)

      try {
        const {
          data,
          error: attachmentsError,
        } = await supabase
          .from('travel_attachments')
          .select(
            `
              id,
              trip_id,
              document_id,
              created_by,
              name,
              mime_type,
              file_size,
              storage_path,
              created_at
            `,
          )
          .eq('document_id', documentId)
          .order('created_at', {
            ascending: false,
          })

        if (attachmentsError) {
          throw attachmentsError
        }

        const rows =
          (data ?? []) as CloudAttachmentRow[]

        const loadedAttachments =
          await Promise.all(
            rows.map(async (row) => {
              const {
                data: signedUrlData,
                error: signedUrlError,
              } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(
                  row.storage_path,
                  SIGNED_URL_DURATION,
                )

              if (signedUrlError) {
                console.error(
                  'Errore URL firmato allegato:',
                  signedUrlError,
                )
              }

              const attachment: TravelAttachment = {
                id: row.id,
                documentId: row.document_id,
                name: row.name,
                mimeType: row.mime_type,
                size:
                  Number(row.file_size) || 0,
                url:
                  signedUrlData?.signedUrl ??
                  '',
                createdAt: row.created_at,
              }

              return attachment
            }),
          )

        setAttachments(
          loadedAttachments.filter(
            (attachment) =>
              Boolean(attachment.url),
          ),
        )

        setError(null)
      } catch (loadError) {
        console.error(
          'Errore caricamento allegati cloud:',
          loadError,
        )

        setAttachments([])

        setError(
          'Impossibile caricare gli allegati.',
        )
      } finally {
        setIsLoading(false)
      }
    }, [documentId])

  useEffect(() => {
    void loadAttachments()
  }, [loadAttachments])

  useEffect(() => {
    if (!documentId) {
      return
    }

    const channel = supabase
      .channel(
        `travelg-attachments-${documentId}`,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'travel_attachments',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          void loadAttachments()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [documentId, loadAttachments])

  async function addAttachment(
    input: CreateTravelAttachmentInput,
  ): Promise<TravelAttachment> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error(
          'Utente non autenticato.',
        )
      }

      const {
        data: document,
        error: documentError,
      } = await supabase
        .from('travel_documents')
        .select('trip_id')
        .eq('id', input.documentId)
        .single()

      if (
        documentError ||
        !document?.trip_id
      ) {
        throw (
          documentError ??
          new Error(
            'Documento non trovato.',
          )
        )
      }

      const response = await fetch(
        input.url,
      )

      if (!response.ok) {
        throw new Error(
          'Impossibile leggere il file selezionato.',
        )
      }

      const blob = await response.blob()

      const attachmentId =
        createAttachmentId()

      const cleanFileName =
        sanitizeFileName(input.name)

      const storagePath = [
        document.trip_id,
        input.documentId,
        `${attachmentId}-${cleanFileName}`,
      ].join('/')

      const mimeType =
        input.mimeType ||
        blob.type ||
        'application/octet-stream'

      const {
        error: uploadError,
      } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(
          storagePath,
          blob,
          {
            contentType: mimeType,
            upsert: false,
          },
        )

      if (uploadError) {
        throw uploadError
      }

      const createdAt =
        new Date().toISOString()

      const {
        error: metadataError,
      } = await supabase
        .from('travel_attachments')
        .insert({
          id: attachmentId,
          trip_id:
            document.trip_id,
          document_id:
            input.documentId,
          created_by: user.id,
          name: input.name.trim(),
          mime_type: mimeType,
          file_size:
            input.size || blob.size,
          storage_path: storagePath,
          created_at: createdAt,
        })

      if (metadataError) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([storagePath])

        throw metadataError
      }

      const {
        data: signedUrlData,
        error: signedUrlError,
      } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(
          storagePath,
          SIGNED_URL_DURATION,
        )

      if (signedUrlError) {
        throw signedUrlError
      }

      const attachment: TravelAttachment = {
        id: attachmentId,
        documentId:
          input.documentId,
        name: input.name.trim(),
        mimeType,
        size:
          input.size || blob.size,
        url:
          signedUrlData.signedUrl,
        createdAt,
      }

      setAttachments(
        (currentAttachments) => [
          attachment,
          ...currentAttachments,
        ],
      )

      setError(null)

      if (
        input.url.startsWith('blob:')
      ) {
        URL.revokeObjectURL(
          input.url,
        )
      }

      return attachment
    } catch (addError) {
      console.error(
        'Errore salvataggio allegato cloud:',
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
      const attachment =
        attachments.find(
          (item) =>
            item.id === attachmentId,
        )

      const {
        data: metadata,
        error: metadataError,
      } = await supabase
        .from('travel_attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single()

      if (metadataError) {
        throw metadataError
      }

      const {
        error: storageError,
      } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([
          metadata.storage_path,
        ])

      if (storageError) {
        throw storageError
      }

      const {
        error: deleteError,
      } = await supabase
        .from('travel_attachments')
        .delete()
        .eq('id', attachmentId)

      if (deleteError) {
        throw deleteError
      }

      setAttachments(
        (currentAttachments) =>
          currentAttachments.filter(
            (item) =>
              item.id !== attachmentId,
          ),
      )

      setError(null)

      if (attachment?.url) {
        // URL firmato remoto:
        // non necessita revokeObjectURL.
      }
    } catch (deleteError) {
      console.error(
        'Errore eliminazione allegato cloud:',
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
      const {
        data,
        error: metadataError,
      } = await supabase
        .from('travel_attachments')
        .select(
          'id, storage_path',
        )
        .eq('document_id', id)

      if (metadataError) {
        throw metadataError
      }

      const storagePaths =
        (data ?? []).map(
          (item) =>
            item.storage_path,
        )

      if (
        storagePaths.length > 0
      ) {
        const {
          error: storageError,
        } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(storagePaths)

        if (storageError) {
          throw storageError
        }
      }

      const {
        error: deleteError,
      } = await supabase
        .from('travel_attachments')
        .delete()
        .eq('document_id', id)

      if (deleteError) {
        throw deleteError
      }

      if (id === documentId) {
        setAttachments([])
      }

      setError(null)
    } catch (clearError) {
      console.error(
        'Errore eliminazione allegati cloud:',
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
    reloadAttachments:
      loadAttachments,
  }
}