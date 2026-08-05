import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'

import OpenAI from 'openai'

import {
  zodTextFormat,
} from 'openai/helpers/zod'

import { z } from 'zod'

const MAX_FILE_SIZE_BYTES =
  4 * 1024 * 1024

const BookingImportSchema = z.object({
  category: z.enum([
    'flight',
    'accommodation',
    'transport',
    'insurance',
    'identity',
    'ticket',
    'other',
  ]),

  title: z.string(),

  provider: z.string().nullable(),
  referenceCode: z.string().nullable(),

  date: z.string().nullable(),

  startDate: z.string().nullable(),
  startTime: z.string().nullable(),

  endDate: z.string().nullable(),
  endTime: z.string().nullable(),

  origin: z.string().nullable(),
  destination: z.string().nullable(),

  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),

  expiresAt: z.string().nullable(),

  notes: z.string(),

  confidence: z.number().min(0).max(1),

  warnings: z.array(z.string()),
})

type ImportRequestBody = {
  fileName?: unknown
  mimeType?: unknown
  base64?: unknown
}

function readBody(
  body: unknown,
): ImportRequestBody {
  if (
    typeof body !== 'object' ||
    body === null
  ) {
    return {}
  }

  return body as ImportRequestBody
}

function estimateBase64Bytes(
  base64: string,
): number {
  const cleanBase64 =
    base64.includes(',')
      ? base64.split(',').pop() ?? ''
      : base64

  return Math.floor(
    (cleanBase64.length * 3) / 4,
  )
}

function toNullableString(
  value: string | null,
): string | null {
  const cleanValue = value?.trim() ?? ''

  return cleanValue || null
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader(
      'Allow',
      'POST',
    )

    return response.status(405).json({
      error: 'Metodo non consentito.',
    })
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(500).json({
      error:
        'OPENAI_API_KEY non configurata sul server.',
    })
  }

  const body = readBody(request.body)

  if (
    typeof body.fileName !== 'string' ||
    typeof body.mimeType !== 'string' ||
    typeof body.base64 !== 'string'
  ) {
    return response.status(400).json({
      error:
        'File, nome o formato mancanti.',
    })
  }

  if (
    body.mimeType !== 'application/pdf'
  ) {
    return response.status(400).json({
      error:
        'Per ora sono supportati solo file PDF.',
    })
  }

  if (
    estimateBase64Bytes(body.base64) >
    MAX_FILE_SIZE_BYTES
  ) {
    return response.status(413).json({
      error:
        'Il PDF supera il limite di 4 MB.',
    })
  }

  const fileData =
    body.base64.startsWith('data:')
      ? body.base64
      : `data:${body.mimeType};base64,${body.base64}`

  try {
    const openai = new OpenAI({
      apiKey:
        process.env.OPENAI_API_KEY,
    })

    const aiResponse =
      await openai.responses.parse({
        model:
          process.env.OPENAI_MODEL ??
          'gpt-5.6',

        input: [
          {
            role: 'system',
            content:
              'Sei un estrattore di prenotazioni di viaggio. Leggi il PDF e restituisci solo i dati realmente presenti. Non inventare. Usa date ISO YYYY-MM-DD e orari HH:MM. Se un campo non è presente, usa null. Inserisci nei warnings ogni dato ambiguo o non certo. Per title usa un titolo utile e breve, ad esempio nome hotel oppure tratta del volo.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                filename: body.fileName,
                file_data: fileData,
              },
              {
                type: 'input_text',
                text:
                  'Analizza questa prenotazione e prepara i dati per il Travel Wallet. Riconosci hotel, volo, auto, treno, traghetto, assicurazione, documento personale, biglietto o altro.',
              },
            ],
          },
        ],

        text: {
          format: zodTextFormat(
            BookingImportSchema,
            'travel_booking',
          ),
        },
      })

    if (!aiResponse.output_parsed) {
      return response.status(422).json({
        error:
          'Il documento non è stato riconosciuto.',
      })
    }

    const result =
      aiResponse.output_parsed

    return response.status(200).json({
      ...result,

      title: result.title.trim(),
      provider: toNullableString(
        result.provider,
      ),
      referenceCode:
        toNullableString(
          result.referenceCode,
        ),

      date: toNullableString(
        result.date,
      ),

      startDate: toNullableString(
        result.startDate,
      ),
      startTime: toNullableString(
        result.startTime,
      ),

      endDate: toNullableString(
        result.endDate,
      ),
      endTime: toNullableString(
        result.endTime,
      ),

      origin: toNullableString(
        result.origin,
      ),
      destination: toNullableString(
        result.destination,
      ),

      address: toNullableString(
        result.address,
      ),
      phone: toNullableString(
        result.phone,
      ),
      email: toNullableString(
        result.email,
      ),
      website: toNullableString(
        result.website,
      ),

      expiresAt: toNullableString(
        result.expiresAt,
      ),

      notes: result.notes.trim(),

      fileName: body.fileName,
      mimeType: body.mimeType,
    })
  } catch (error) {
    console.error(
      'Errore importazione prenotazione:',
      error,
    )

    return response.status(500).json({
      error:
        'Non è stato possibile analizzare il PDF.',
    })
  }
}
