import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import { useAttachments } from '../../hooks/useAttachments'
import { useDocuments } from '../../hooks/useDocuments'

import type { TravelAttachment } from '../../types/attachment'
import type {
  TravelDocument,
  TravelDocumentCategory,
} from '../../types/document'
import type { Trip } from '../../types/travel'

type DocumentsPageProps = {
  activeTrip: Trip | null
}

type ExpirationStatus = {
  label: string
  description: string
  className: string
}

type CategoryInfo = {
  value: TravelDocumentCategory
  label: string
  icon: string
}

type DocumentCardProps = {
  document: TravelDocument
  categoryInfo: CategoryInfo
  onDeleteDocument: (documentId: string) => void
}

const categories: CategoryInfo[] = [
  {
    value: 'flight',
    label: 'Volo',
    icon: '✈️',
  },
  {
    value: 'accommodation',
    label: 'Hotel',
    icon: '🏨',
  },
  {
    value: 'transport',
    label: 'Trasporto',
    icon: '🚗',
  },
  {
    value: 'insurance',
    label: 'Assicurazione',
    icon: '🛡️',
  },
  {
    value: 'identity',
    label: 'Documento',
    icon: '🛂',
  },
  {
    value: 'ticket',
    label: 'Biglietto',
    icon: '🎫',
  },
  {
    value: 'other',
    label: 'Altro',
    icon: '📄',
  },
]

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

function parseLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return today
}

function getDaysUntil(date: string): number {
  return Math.ceil(
    (parseLocalDate(date).getTime() -
      getToday().getTime()) /
      MILLISECONDS_PER_DAY,
  )
}

function formatDocumentDate(date: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseLocalDate(date))
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getAttachmentIcon(
  attachment: TravelAttachment,
): string {
  if (attachment.mimeType === 'application/pdf') {
    return '📕'
  }

  if (attachment.mimeType.startsWith('image/')) {
    return '🖼️'
  }

  return '📎'
}

function getExpirationStatus(
  document: TravelDocument,
): ExpirationStatus | null {
  if (!document.expiresAt) {
    return null
  }

  const daysUntilExpiration = getDaysUntil(
    document.expiresAt,
  )

  if (daysUntilExpiration < 0) {
    const elapsedDays = Math.abs(
      daysUntilExpiration,
    )

    return {
      label: 'Scaduto',
      description:
        elapsedDays === 1
          ? 'Scaduto ieri'
          : `Scaduto da ${elapsedDays} giorni`,
      className: 'bg-red-100 text-red-700',
    }
  }

  if (daysUntilExpiration === 0) {
    return {
      label: 'Scade oggi',
      description: 'Scadenza oggi',
      className: 'bg-red-100 text-red-700',
    }
  }

  const reminderDays =
    document.reminderDays ?? 30

  if (daysUntilExpiration <= reminderDays) {
    return {
      label: 'In scadenza',
      description:
        daysUntilExpiration === 1
          ? 'Scade domani'
          : `Scade tra ${daysUntilExpiration} giorni`,
      className:
        'bg-amber-100 text-amber-700',
    }
  }

  return {
    label: 'Valido',
    description: `Scade tra ${daysUntilExpiration} giorni`,
    className:
      'bg-emerald-100 text-emerald-700',
  }
}

function DocumentCard({
  document,
  categoryInfo,
  onDeleteDocument,
}: DocumentCardProps) {
  const {
    attachments,
    attachmentCount,
    addAttachment,
    deleteAttachment,
    clearDocumentAttachments,
  } = useAttachments(document.id)

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  const expirationStatus =
    getExpirationStatus(document)

  function handleSelectFiles(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    )

    selectedFiles.forEach((file) => {
      const isPdf =
        file.type === 'application/pdf'

      const isImage =
        file.type.startsWith('image/')

      if (!isPdf && !isImage) {
        return
      }

      const temporaryUrl =
        URL.createObjectURL(file)

      addAttachment({
        documentId: document.id,
        name: file.name,
        mimeType:
          file.type ||
          'application/octet-stream',
        size: file.size,
        url: temporaryUrl,
      })
    })

    event.target.value = ''
  }

  function handleDeleteAttachment(
    attachment: TravelAttachment,
  ) {
    if (attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url)
    }

    deleteAttachment(attachment.id)
  }

  function handleDeleteDocument() {
    attachments.forEach((attachment) => {
      if (attachment.url.startsWith('blob:')) {
        URL.revokeObjectURL(attachment.url)
      }
    })

    clearDocumentAttachments(document.id)
    onDeleteDocument(document.id)
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              {categoryInfo.icon}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-bold">
                  {document.title}
                </h3>

                {expirationStatus && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${expirationStatus.className}`}
                  >
                    {expirationStatus.label}
                  </span>
                )}

                {attachmentCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    📎 {attachmentCount}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {categoryInfo.label}
              </p>
            </div>
          </div>

          {document.date && (
            <p className="mt-4 text-sm font-medium text-slate-600">
              📅{' '}
              {formatDocumentDate(document.date)}
            </p>
          )}

          {document.expiresAt && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  ⏰ Scadenza
                </p>

                <p className="text-sm font-semibold text-slate-900">
                  {formatDocumentDate(
                    document.expiresAt,
                  )}
                </p>
              </div>

              {expirationStatus && (
                <p className="mt-1 text-xs text-slate-500">
                  {expirationStatus.description}
                  {' · '}
                  preavviso{' '}
                  {document.reminderDays ?? 30}{' '}
                  giorni
                </p>
              )}
            </div>
          )}

          {document.notes && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {document.notes}
            </p>
          )}
        </div>

        <button
          type="button"
          aria-label={`Elimina ${document.title}`}
          onClick={handleDeleteDocument}
          className="shrink-0 rounded-xl px-3 py-2 text-red-600 transition hover:bg-red-50 active:scale-95"
        >
          🗑️
        </button>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-slate-800">
              📎 Allegati
            </h4>

            <p className="mt-1 text-xs text-slate-500">
              PDF e immagini del documento
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 active:scale-95"
          >
            + Aggiungi file
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleSelectFiles}
            className="hidden"
          />
        </div>

        {attachments.length === 0 ? (
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="mt-4 w-full rounded-2xl border border-dashed border-slate-300 p-5 text-center transition hover:border-blue-300 hover:bg-blue-50/50"
          >
            <span className="text-2xl">📂</span>

            <span className="mt-2 block text-sm font-semibold text-slate-700">
              Nessun allegato
            </span>

            <span className="mt-1 block text-xs text-slate-500">
              Tocca qui per aggiungere PDF o immagini
            </span>
          </button>
        ) : (
          <div className="mt-4 space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  {getAttachmentIcon(attachment)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {attachment.name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatFileSize(
                      attachment.size,
                    )}
                  </p>
                </div>

                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Apri ${attachment.name}`}
                  className="shrink-0 rounded-lg px-2.5 py-2 text-sm text-blue-600 transition hover:bg-blue-100 active:scale-95"
                >
                  👁️
                </a>

                <button
                  type="button"
                  aria-label={`Elimina ${attachment.name}`}
                  onClick={() =>
                    handleDeleteAttachment(
                      attachment,
                    )
                  }
                  className="shrink-0 rounded-lg px-2.5 py-2 text-sm text-red-600 transition hover:bg-red-100 active:scale-95"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs leading-5 text-slate-400">
          Gli allegati usano per ora un collegamento
          temporaneo del browser. Nel prossimo passaggio
          li renderemo permanenti con IndexedDB.
        </p>
      </div>
    </article>
  )
}

export default function DocumentsPage({
  activeTrip,
}: DocumentsPageProps) {
  const {
    documents,
    expiredDocumentCount,
    expiringDocumentCount,
    addDocument,
    deleteDocument,
  } = useDocuments(activeTrip?.id)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [expiresAt, setExpiresAt] =
    useState('')
  const [reminderDays, setReminderDays] =
    useState('30')
  const [category, setCategory] =
    useState<TravelDocumentCategory>('other')

  const categoryMap = useMemo(
    () =>
      Object.fromEntries(
        categories.map((item) => [
          item.value,
          item,
        ]),
      ) as Record<
        TravelDocumentCategory,
        CategoryInfo
      >,
    [],
  )

  if (!activeTrip) {
    return (
      <section className="mx-auto max-w-xl p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">📄</div>

          <h2 className="mt-4 text-2xl font-bold">
            Nessun viaggio attivo
          </h2>

          <p className="mt-2 text-slate-500">
            Crea prima un viaggio per poter salvare
            documenti.
          </p>
        </div>
      </section>
    )
  }

  const trip = activeTrip

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    const parsedReminderDays =
      reminderDays === ''
        ? undefined
        : Number(reminderDays)

    addDocument({
      tripId: trip.id,
      title,
      category,
      date,
      notes,
      expiresAt: expiresAt || undefined,
      reminderDays:
        parsedReminderDays !== undefined &&
        Number.isFinite(parsedReminderDays)
          ? Math.max(
              0,
              Math.floor(parsedReminderDays),
            )
          : undefined,
    })

    setTitle('')
    setDate('')
    setNotes('')
    setExpiresAt('')
    setReminderDays('30')
    setCategory('other')
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-medium text-blue-600">
          {trip.destination}
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          📄 Documenti
        </h1>

        <p className="mt-2 text-slate-500">
          Conserva prenotazioni, biglietti e
          documenti importanti del viaggio.
        </p>
      </header>

      {(expiredDocumentCount > 0 ||
        expiringDocumentCount > 0) && (
        <div className="space-y-3">
          {expiredDocumentCount > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <span className="text-xl">⚠️</span>

              <div>
                <p className="font-semibold text-red-800">
                  {expiredDocumentCount === 1
                    ? '1 documento scaduto'
                    : `${expiredDocumentCount} documenti scaduti`}
                </p>

                <p className="mt-1 text-sm text-red-700">
                  Controlla i documenti prima della
                  partenza.
                </p>
              </div>
            </div>
          )}

          {expiringDocumentCount > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <span className="text-xl">⏰</span>

              <div>
                <p className="font-semibold text-amber-800">
                  {expiringDocumentCount === 1
                    ? '1 documento in scadenza'
                    : `${expiringDocumentCount} documenti in scadenza`}
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  Una o più scadenze richiedono la tua
                  attenzione.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label
            htmlFor="document-title"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Titolo
          </label>

          <input
            id="document-title"
            type="text"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Es. Prenotazione hotel"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />
        </div>

        <div>
          <label
            htmlFor="document-category"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Categoria
          </label>

          <select
            id="document-category"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={category}
            onChange={(event) =>
              setCategory(
                event.target
                  .value as TravelDocumentCategory,
              )
            }
          >
            {categories.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.icon} {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="document-date"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Data
          </label>

          <input
            id="document-date"
            type="date"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
          />
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2">
            <span>⏰</span>

            <div>
              <p className="text-sm font-semibold text-slate-700">
                Scadenza
              </p>

              <p className="text-xs text-slate-500">
                Facoltativa
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="document-expiration"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Data di scadenza
              </label>

              <input
                id="document-expiration"
                type="date"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={expiresAt}
                onChange={(event) =>
                  setExpiresAt(event.target.value)
                }
              />
            </div>

            <div>
              <label
                htmlFor="document-reminder"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Preavviso in giorni
              </label>

              <input
                id="document-reminder"
                type="number"
                min="0"
                step="1"
                disabled={!expiresAt}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={reminderDays}
                onChange={(event) =>
                  setReminderDays(event.target.value)
                }
              />
            </div>
          </div>

          {expiresAt && (
            <p className="mt-3 text-xs text-slate-500">
              Riceverai un avviso visivo{' '}
              {reminderDays
                ? `${reminderDays} giorni prima della scadenza.`
                : 'alla scadenza.'}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="document-notes"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Note
          </label>

          <textarea
            id="document-notes"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            rows={4}
            placeholder="Numero prenotazione, indirizzo, orari..."
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99]"
        >
          Salva documento
        </button>
      </form>

      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center">
            <div className="text-4xl">🗂️</div>

            <p className="mt-3 font-semibold">
              Nessun documento salvato
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Aggiungi prenotazioni, biglietti e
              informazioni importanti.
            </p>
          </div>
        ) : (
          documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              categoryInfo={
                categoryMap[document.category]
              }
              onDeleteDocument={deleteDocument}
            />
          ))
        )}
      </div>
    </section>
  )
}