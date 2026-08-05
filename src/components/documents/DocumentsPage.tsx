import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

import { useAttachments } from '../../hooks/useAttachments'
import { useDocuments } from '../../hooks/useDocuments'

import {
  importBookingPdf,
  type BookingImportResult,
} from '../../services/bookingImport'

import type { TravelAttachment } from '../../types/attachment'
import type {
  TravelDocument,
  TravelDocumentCategory,
} from '../../types/document'
import type { Trip } from '../../types/travel'

type DocumentsPageProps = {
  activeTrip: Trip | null
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

type PendingAttachment = {
  documentId: string
  file: File
}

type PendingAttachmentWriterProps = {
  pendingAttachment: PendingAttachment | null
  onCompleted: () => void
  onError: (message: string) => void
}

const categories: CategoryInfo[] = [
  {
    value: 'accommodation',
    label: 'Hotel',
    icon: '🏨',
  },
  {
    value: 'flight',
    label: 'Volo',
    icon: '✈️',
  },
  {
    value: 'transport',
    label: 'Trasporto',
    icon: '🚗',
  },
  {
    value: 'ticket',
    label: 'Biglietto',
    icon: '🎫',
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
    value: 'other',
    label: 'Altro',
    icon: '📄',
  },
]

function parseLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

function formatDate(date?: string): string {
  if (!date) {
    return ''
  }

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

function normalizeWebsite(website: string): string {
  return /^https?:\/\//i.test(website)
    ? website
    : `https://${website}`
}

function createMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address,
  )}`
}

function PendingAttachmentWriter({
  pendingAttachment,
  onCompleted,
  onError,
}: PendingAttachmentWriterProps) {
  const documentId =
    pendingAttachment?.documentId

  const { addAttachment } =
    useAttachments(documentId)

  useEffect(() => {
    if (!pendingAttachment) {
      return
    }

    const currentAttachment =
      pendingAttachment

    let cancelled = false

    async function saveAttachment() {
      const temporaryUrl =
        URL.createObjectURL(
          currentAttachment.file,
        )

      try {
        await addAttachment({
          documentId:
            currentAttachment.documentId,
          name:
            currentAttachment.file.name,
          mimeType:
            currentAttachment.file.type ||
            'application/pdf',
          size:
            currentAttachment.file.size,
          url: temporaryUrl,
        })

        if (!cancelled) {
          onCompleted()
        }
      } catch {
        URL.revokeObjectURL(
          temporaryUrl,
        )

        if (!cancelled) {
          onError(
            'La prenotazione è stata salvata, ma non è stato possibile allegare il PDF.',
          )
        }
      }
    }

    void saveAttachment()

    return () => {
      cancelled = true
    }
  }, [
    pendingAttachment,
    addAttachment,
    onCompleted,
    onError,
  ])

  return null
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

  async function handleSelectFiles(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? [],
    )

    for (const file of selectedFiles) {
      const isPdf =
        file.type === 'application/pdf'

      const isImage =
        file.type.startsWith('image/')

      if (!isPdf && !isImage) {
        continue
      }

      const temporaryUrl =
        URL.createObjectURL(file)

      try {
        await addAttachment({
          documentId: document.id,
          name: file.name,
          mimeType:
            file.type ||
            'application/octet-stream',
          size: file.size,
          url: temporaryUrl,
        })
      } catch {
        URL.revokeObjectURL(temporaryUrl)
      }
    }

    event.target.value = ''
  }

  async function handleDeleteAttachment(
    attachment: TravelAttachment,
  ) {
    await deleteAttachment(attachment.id)
  }

  async function handleDeleteDocument() {
    const confirmed = window.confirm(
      `Eliminare "${document.title}"?`,
    )

    if (!confirmed) {
      return
    }

    await clearDocumentAttachments(document.id)
    onDeleteDocument(document.id)
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            {categoryInfo.icon}
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              {categoryInfo.label}
            </p>

            <h3 className="mt-1 break-words text-lg font-bold">
              {document.title}
            </h3>

            {document.provider && (
              <p className="mt-1 text-sm text-slate-500">
                {document.provider}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleDeleteDocument()
          }}
          className="shrink-0 rounded-xl px-3 py-2 text-red-600 transition hover:bg-red-50 active:scale-95"
          aria-label={`Elimina ${document.title}`}
        >
          🗑️
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {document.referenceCode && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {document.category === 'identity'
                ? 'Numero documento'
                : 'Codice prenotazione'}
            </p>

            <p className="mt-1 break-all font-bold">
              {document.referenceCode}
            </p>
          </div>
        )}

        {(document.origin ||
          document.destination) && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold">
              {document.origin || '—'} →{' '}
              {document.destination || '—'}
            </p>
          </div>
        )}

        {(document.startDate ||
          document.endDate) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                {document.category ===
                'accommodation'
                  ? 'Check-in'
                  : 'Partenza'}
              </p>

              <p className="mt-1 text-sm font-semibold">
                {formatDate(document.startDate) ||
                  '—'}
              </p>

              {document.startTime && (
                <p className="mt-1 text-sm text-blue-600">
                  {document.startTime}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                {document.category ===
                'accommodation'
                  ? 'Check-out'
                  : 'Arrivo'}
              </p>

              <p className="mt-1 text-sm font-semibold">
                {formatDate(document.endDate) ||
                  '—'}
              </p>

              {document.endTime && (
                <p className="mt-1 text-sm text-blue-600">
                  {document.endTime}
                </p>
              )}
            </div>
          </div>
        )}

        {document.date && (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm">
            📅 {formatDate(document.date)}
          </div>
        )}

        {document.expiresAt && (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            ⏰ Scadenza: {formatDate(document.expiresAt)}
          </div>
        )}

        {document.address && (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm">
            📍 {document.address}
          </div>
        )}

        {document.notes && (
          <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {document.notes}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {document.address && (
          <a
            href={createMapsUrl(document.address)}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            🧭 Naviga
          </a>
        )}

        {document.phone && (
          <a
            href={`tel:${document.phone}`}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            ☎️ Chiama
          </a>
        )}

        {document.email && (
          <a
            href={`mailto:${document.email}`}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            ✉️ Email
          </a>
        )}

        {document.website && (
          <a
            href={normalizeWebsite(
              document.website,
            )}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            🔗 Apri prenotazione
          </a>
        )}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold">
              📎 Allegati
            </h4>

            <p className="mt-1 text-xs text-slate-500">
              Voucher, PDF, boarding pass e immagini
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
          >
            + File
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => {
              void handleSelectFiles(event)
            }}
            className="hidden"
          />
        </div>

        {attachments.length === 0 ? (
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="mt-4 w-full rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500"
          >
            Aggiungi voucher o documento
          </button>
        ) : (
          <div className="mt-4 space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
              >
                <span className="text-xl">
                  {getAttachmentIcon(attachment)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {attachment.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {formatFileSize(
                      attachment.size,
                    )}
                  </p>
                </div>

                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg px-2 py-1 text-blue-600"
                >
                  👁️
                </a>

                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteAttachment(
                      attachment,
                    )
                  }}
                  className="rounded-lg px-2 py-1 text-red-600"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        {attachmentCount > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            {attachmentCount}{' '}
            {attachmentCount === 1
              ? 'allegato'
              : 'allegati'}
          </p>
        )}

        <p className="mt-3 text-xs leading-5 text-slate-400">
          Gli allegati sono salvati in modo permanente
          sul dispositivo tramite IndexedDB.
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
    addDocument,
    deleteDocument,
  } = useDocuments(activeTrip?.id)

  const importFileInputRef =
    useRef<HTMLInputElement>(null)

  const [category, setCategory] =
    useState<TravelDocumentCategory>(
      'accommodation',
    )

  const [title, setTitle] = useState('')
  const [provider, setProvider] = useState('')
  const [referenceCode, setReferenceCode] =
    useState('')
  const [date, setDate] = useState('')
  const [startDate, setStartDate] =
    useState('')
  const [startTime, setStartTime] =
    useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] =
    useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [expiresAt, setExpiresAt] =
    useState('')
  const [reminderDays, setReminderDays] =
    useState('30')
  const [notes, setNotes] = useState('')

  const [isImporting, setIsImporting] =
    useState(false)

  const [importError, setImportError] =
    useState<string | null>(null)

  const [importMessage, setImportMessage] =
    useState<string | null>(null)

  const [importWarnings, setImportWarnings] =
    useState<string[]>([])

  const [importConfidence, setImportConfidence] =
    useState<number | null>(null)

  const [importedPdf, setImportedPdf] =
    useState<File | null>(null)

  const [
    pendingAttachment,
    setPendingAttachment,
  ] = useState<PendingAttachment | null>(null)

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
      <section>
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-5xl">📄</div>

          <h2 className="mt-4 text-2xl font-bold">
            Nessun viaggio attivo
          </h2>

          <p className="mt-2 text-slate-500">
            Seleziona un viaggio per usare il Travel
            Wallet.
          </p>
        </div>
      </section>
    )
  }

  const trip = activeTrip

  function resetForm() {
    setTitle('')
    setProvider('')
    setReferenceCode('')
    setDate('')
    setStartDate('')
    setStartTime('')
    setEndDate('')
    setEndTime('')
    setOrigin('')
    setDestination('')
    setAddress('')
    setPhone('')
    setEmail('')
    setWebsite('')
    setExpiresAt('')
    setReminderDays('30')
    setNotes('')
    setImportedPdf(null)
    setImportWarnings([])
    setImportConfidence(null)
  }

  function applyImportedData(
    imported: BookingImportResult,
  ) {
    setCategory(imported.category)
    setTitle(imported.title)
    setProvider(imported.provider ?? '')
    setReferenceCode(
      imported.referenceCode ?? '',
    )
    setDate(imported.date ?? '')
    setStartDate(imported.startDate ?? '')
    setStartTime(imported.startTime ?? '')
    setEndDate(imported.endDate ?? '')
    setEndTime(imported.endTime ?? '')
    setOrigin(imported.origin ?? '')
    setDestination(
      imported.destination ?? '',
    )
    setAddress(imported.address ?? '')
    setPhone(imported.phone ?? '')
    setEmail(imported.email ?? '')
    setWebsite(imported.website ?? '')
    setExpiresAt(imported.expiresAt ?? '')
    setNotes(imported.notes)
    setImportWarnings(imported.warnings)
    setImportConfidence(imported.confidence)
  }

  async function handleImportPdf(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    setIsImporting(true)
    setImportError(null)
    setImportMessage(null)
    setImportWarnings([])
    setImportConfidence(null)

    try {
      const imported =
        await importBookingPdf(file)

      applyImportedData(imported)
      setImportedPdf(file)

      setImportMessage(
        'PDF analizzato. Controlla e correggi i campi prima di salvare.',
      )
    } catch (error) {
      setImportedPdf(null)

      setImportError(
        error instanceof Error
          ? error.message
          : 'Non è stato possibile analizzare il PDF.',
      )
    } finally {
      setIsImporting(false)
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    const newDocument = addDocument({
      tripId: trip.id,
      title,
      category,
      date,
      notes,
      provider,
      referenceCode,
      startDate,
      startTime,
      endDate,
      endTime,
      origin,
      destination,
      address,
      phone,
      email,
      website,
      expiresAt: expiresAt || undefined,
      reminderDays:
        reminderDays === ''
          ? undefined
          : Number(reminderDays),
    })

    if (importedPdf) {
      setPendingAttachment({
        documentId: newDocument.id,
        file: importedPdf,
      })
    } else {
      setImportMessage(
        'Elemento salvato nel Travel Wallet.',
      )
    }

    resetForm()
  }

  const isAccommodation =
    category === 'accommodation'

  const isFlight = category === 'flight'

  const isTransport =
    category === 'transport'

  const isIdentity =
    category === 'identity'

  const isInsurance =
    category === 'insurance'

  return (
    <section className="space-y-6">
      <PendingAttachmentWriter
        pendingAttachment={pendingAttachment}
        onCompleted={() => {
          setPendingAttachment(null)
          setImportMessage(
            'Prenotazione e PDF salvati nel Travel Wallet.',
          )
        }}
        onError={(message) => {
          setPendingAttachment(null)
          setImportError(message)
        }}
      />

      <header>
        <p className="text-sm font-medium text-blue-600">
          {trip.destination}
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          🎒 Travel Wallet
        </h1>

        <p className="mt-2 text-slate-500">
          Prenotazioni, biglietti e documenti del
          viaggio in un unico posto.
        </p>
      </header>

      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            ✨
          </span>

          <div>
            <h2 className="font-bold">
              Importazione assistita AI
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Carica un PDF di Booking, Airbnb, una
              compagnia aerea, un treno o un autonoleggio.
              TravelG compilerà il modulo e ti lascerà
              controllare tutto prima del salvataggio.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            importFileInputRef.current?.click()
          }
          disabled={isImporting}
          className="mt-5 w-full rounded-2xl bg-violet-600 px-4 py-4 font-bold text-white transition active:scale-[0.99] disabled:cursor-wait disabled:bg-slate-300"
        >
          {isImporting
            ? 'Analisi del PDF in corso...'
            : '📄 Importa prenotazione PDF'}
        </button>

        <input
          ref={importFileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => {
            void handleImportPdf(event)
          }}
          className="hidden"
        />

        {importMessage && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            {importMessage}
          </div>
        )}

        {importError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {importError}
          </div>
        )}

        {importConfidence !== null && (
          <div className="mt-4 rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold">
                Affidabilità del riconoscimento
              </p>

              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                {Math.round(
                  importConfidence * 100,
                )}
                %
              </span>
            </div>
          </div>
        )}

        {importWarnings.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-800">
              Controlla questi dati
            </p>

            <ul className="mt-2 space-y-1 text-sm text-amber-700">
              {importWarnings.map(
                (warning, index) => (
                  <li
                    key={`${warning}-${index}`}
                  >
                    • {warning}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {categories.slice(0, 6).map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() =>
              setCategory(item.value)
            }
            className={`rounded-2xl border p-3 text-center text-xs font-semibold transition ${
              category === item.value
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <span className="block text-2xl">
              {item.icon}
            </span>

            <span className="mt-1 block">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold">
          {importedPdf
            ? 'Controlla i dati riconosciuti'
            : `Aggiungi ${categoryMap[category].label}`}
        </h2>

        {importedPdf && (
          <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">
            📎 Il PDF <strong>{importedPdf.name}</strong>{' '}
            verrà allegato automaticamente quando
            salverai.
          </div>
        )}

        <input
          type="text"
          required
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder={
            isAccommodation
              ? 'Nome hotel'
              : isFlight
                ? 'Volo Milano → Madrid'
                : isIdentity
                  ? 'Carta di identità'
                  : 'Titolo'
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        {(isAccommodation ||
          isFlight ||
          isTransport) && (
          <input
            type="text"
            value={provider}
            onChange={(event) =>
              setProvider(event.target.value)
            }
            placeholder={
              isAccommodation
                ? 'Piattaforma o struttura, es. Booking'
                : isFlight
                  ? 'Compagnia aerea'
                  : 'Compagnia o autonoleggio'
            }
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        )}

        <input
          type="text"
          value={referenceCode}
          onChange={(event) =>
            setReferenceCode(event.target.value)
          }
          placeholder={
            isIdentity
              ? 'Numero documento'
              : 'Codice prenotazione'
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        {(isFlight || isTransport) && (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={origin}
              onChange={(event) =>
                setOrigin(event.target.value)
              }
              placeholder="Da"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              type="text"
              value={destination}
              onChange={(event) =>
                setDestination(
                  event.target.value,
                )
              }
              placeholder="A"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>
        )}

        {(isAccommodation ||
          isFlight ||
          isTransport) && (
          <>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                {isAccommodation
                  ? 'Check-in'
                  : 'Partenza'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-slate-300 px-3 py-3"
                />

                <input
                  type="time"
                  value={startTime}
                  onChange={(event) =>
                    setStartTime(
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-slate-300 px-3 py-3"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                {isAccommodation
                  ? 'Check-out'
                  : 'Arrivo'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-slate-300 px-3 py-3"
                />

                <input
                  type="time"
                  value={endTime}
                  onChange={(event) =>
                    setEndTime(
                      event.target.value,
                    )
                  }
                  className="rounded-xl border border-slate-300 px-3 py-3"
                />
              </div>
            </div>
          </>
        )}

        {!isAccommodation &&
          !isFlight &&
          !isTransport && (
            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          )}

        {isAccommodation && (
          <>
            <input
              type="text"
              value={address}
              onChange={(event) =>
                setAddress(event.target.value)
              }
              placeholder="Indirizzo hotel"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Telefono"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Email"
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>
          </>
        )}

        <input
          type="text"
          value={website}
          onChange={(event) =>
            setWebsite(event.target.value)
          }
          placeholder="Link della prenotazione o sito"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        {(isIdentity || isInsurance) && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Scadenza
            </p>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={expiresAt}
                onChange={(event) =>
                  setExpiresAt(event.target.value)
                }
                className="rounded-xl border border-slate-300 px-3 py-3"
              />

              <input
                type="number"
                min="0"
                value={reminderDays}
                onChange={(event) =>
                  setReminderDays(
                    event.target.value,
                  )
                }
                placeholder="Preavviso"
                className="rounded-xl border border-slate-300 px-3 py-3"
              />
            </div>
          </div>
        )}

        <textarea
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          rows={3}
          placeholder="Note, terminal, gate, condizioni..."
          className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3"
        />

        <button
          type="submit"
          disabled={
            isImporting ||
            pendingAttachment !== null
          }
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:cursor-wait disabled:bg-slate-300"
        >
          {pendingAttachment
            ? 'Salvataggio PDF...'
            : importedPdf
              ? 'Conferma e salva prenotazione'
              : 'Salva nel Wallet'}
        </button>
      </form>

      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Nessun elemento nel Wallet
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