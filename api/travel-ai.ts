import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'

import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { z } from 'zod'

const RecommendationSchema = z.object({
  title: z.string(),
  type: z.enum([
    'see',
    'eat',
    'do',
    'hidden',
  ]),
  why: z.string(),
  area: z.string().nullable(),
  estimatedTime: z.string().nullable(),
})

const TravelAiSchema = z.object({
  answer: z.string(),
  recommendations: z
    .array(RecommendationSchema)
    .max(6),
})

type TravelAiRequest = {
  destination?: unknown
  query?: unknown
  interests?: unknown
  pace?: unknown
  avoidCrowds?: unknown
  localFood?: unknown
  hiddenGems?: unknown
  latitude?: unknown
  longitude?: unknown
  currentDate?: unknown
}

function readBody(body: unknown): TravelAiRequest {
  if (
    typeof body !== 'object' ||
    body === null
  ) {
    return {}
  }

  return body as TravelAiRequest
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
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
    typeof body.destination !== 'string' ||
    !body.destination.trim() ||
    typeof body.query !== 'string' ||
    !body.query.trim()
  ) {
    return response.status(400).json({
      error:
        'Destinazione o richiesta mancanti.',
    })
  }

  const interests = Array.isArray(body.interests)
    ? body.interests.filter(
        (item): item is string =>
          typeof item === 'string',
      )
    : []

  const hasLocation =
    typeof body.latitude === 'number' &&
    typeof body.longitude === 'number'

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
              'Sei TravelG AI, un assistente di viaggio personale. Rispondi in italiano, in modo pratico e sintetico. Personalizza le proposte sulle preferenze dell’utente e sul ritmo di viaggio. Se ricevi coordinate, usale come contesto di prossimità ma non inventare distanze precise, orari di apertura o disponibilità in tempo reale. Non presentare come certo ciò che potrebbe essere cambiato. Suggerisci al massimo 6 opzioni utili e diverse tra loro.',
          },
          {
            role: 'user',
            content: `Destinazione: ${body.destination.trim()}\nData: ${
              typeof body.currentDate === 'string'
                ? body.currentDate
                : 'non specificata'
            }\nInteressi: ${
              interests.length > 0
                ? interests.join(', ')
                : 'non ancora selezionati'
            }\nRitmo: ${
              typeof body.pace === 'string'
                ? body.pace
                : 'balanced'
            }\nEvita folla: ${Boolean(body.avoidCrowds) ? 'sì' : 'no'}\nCibo locale: ${Boolean(body.localFood) ? 'sì' : 'no'}\nLuoghi meno turistici: ${Boolean(body.hiddenGems) ? 'sì' : 'no'}\nPosizione disponibile: ${
              hasLocation
                ? `${body.latitude}, ${body.longitude}`
                : 'no'
            }\n\nRichiesta: ${body.query.trim()}`,
          },
        ],
        text: {
          format: zodTextFormat(
            TravelAiSchema,
            'travel_ai_response',
          ),
        },
      })

    if (!aiResponse.output_parsed) {
      return response.status(422).json({
        error:
          'Non sono riuscito a preparare i suggerimenti.',
      })
    }

    return response
      .status(200)
      .json(aiResponse.output_parsed)
  } catch (error) {
    console.error('TravelG AI error:', error)

    return response.status(500).json({
      error:
        'TravelG AI non è disponibile in questo momento.',
    })
  }
}
