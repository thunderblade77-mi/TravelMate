import type {
  TravelDocumentCategory,
} from '../types/document'

export type BookingImportResult = {
  category: TravelDocumentCategory

  title: string

  provider: string | null
  referenceCode: string | null

  date: string | null

  startDate: string | null
  startTime: string | null

  endDate: string | null
  endTime: string | null

  origin: string | null
  destination: string | null

  address: string | null
  phone: string | null
  email: string | null
  website: string | null

  expiresAt: string | null

  notes: string

  confidence: number
  warnings: string[]

  fileName: string
  mimeType: string
}

const MAX_FILE_SIZE_BYTES =
  4 * 1024 * 1024

function readFileAsDataUrl(
  file: File,
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        if (
          typeof reader.result === 'string'
        ) {
          resolve(reader.result)
          return
        }

        reject(
          new Error(
            'Impossibile leggere il PDF.',
          ),
        )
      }

      reader.onerror = () => {
        reject(
          new Error(
            'Impossibile leggere il PDF.',
          ),
        )
      }

      reader.readAsDataURL(file)
    },
  )
}

export async function importBookingPdf(
  file: File,
): Promise<BookingImportResult> {
  if (
    file.type !== 'application/pdf' &&
    !file.name
      .toLowerCase()
      .endsWith('.pdf')
  ) {
    throw new Error(
      'Seleziona un file PDF.',
    )
  }

  if (
    file.size >
    MAX_FILE_SIZE_BYTES
  ) {
    throw new Error(
      'Il PDF supera il limite di 4 MB.',
    )
  }

  const base64 =
    await readFileAsDataUrl(file)

  const response = await fetch(
    '/api/import-booking',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        fileName: file.name,
        mimeType:
          file.type ||
          'application/pdf',
        base64,
      }),
    },
  )

  const result: unknown =
    await response.json()

  if (!response.ok) {
    const message =
      typeof result === 'object' &&
      result !== null &&
      'error' in result &&
      typeof result.error === 'string'
        ? result.error
        : 'Importazione non riuscita.'

    throw new Error(message)
  }

  return result as BookingImportResult
}
