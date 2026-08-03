import type { ActivityCategory } from '../types/roadbook'

export type ParsedItineraryActivity = {
  time: string
  title: string
  location: string
  notes: string
  category: ActivityCategory
}

export type ParsedItineraryDay = {
  date: string
  label: string
  activities: ParsedItineraryActivity[]
}

const italianMonths: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
}

function formatDate(
  year: number,
  monthIndex: number,
  day: number,
): string {
  const month = String(monthIndex + 1).padStart(
    2,
    '0',
  )

  const formattedDay = String(day).padStart(2, '0')

  return `${year}-${month}-${formattedDay}`
}

function extractTime(line: string): {
  time: string
  text: string
} {
  const match = line.match(
    /^(\d{1,2}[:.]\d{2})\s+(.+)$/,
  )

  if (!match) {
  return {
    time: '',
    text: line,
  }
}

  return {
    time: match[1].replace('.', ':').padStart(5, '0'),
    text: match[2].trim(),
  }
}

function detectCategory(
  text: string,
): ActivityCategory {
  const normalized = text.toLowerCase()

  if (
    normalized.includes('hotel') ||
    normalized.includes('pernottamento') ||
    normalized.includes('check-in') ||
    normalized.includes('dormiamo') ||
    normalized.includes('notte a')
  ) {
    return 'hotel'
  }

  if (
    normalized.includes('ristorante') ||
    normalized.includes('pranzo') ||
    normalized.includes('cena') ||
    normalized.includes('colazione') ||
    normalized.includes('aperitivo')
  ) {
    return 'ristorante'
  }

  if (
    normalized.includes('partenza') ||
    normalized.includes('trasferimento') ||
    normalized.includes('treno') ||
    normalized.includes('metro') ||
    normalized.includes('autobus') ||
    normalized.includes('bus') ||
    normalized.includes('taxi') ||
    normalized.includes('volo') ||
    normalized.includes('aereo') ||
    normalized.includes('traghetto') ||
    normalized.includes('auto') ||
    normalized.includes('macchina') ||
    normalized.includes('arrivo')
  ) {
    return 'trasporto'
  }

  return 'visita'
}

function cleanActivityLine(line: string): string {
  return line
    .replace(/^[-*•]\s*/, '')
    .replace(
      /^[📍🚗🚆🚌🚇🚲⛴️✈️🚕🏨🍽️📸]\s*/,
      '',
    )
    .trim()
}

function isIgnoredLine(line: string): boolean {
  const normalized = line.toLowerCase()

  return (
    !line ||
    normalized.startsWith('# itinerario') ||
    normalized.startsWith('base ad ') ||
    normalized.startsWith(
      'base in ',
    )
  )
}

function parseDayHeading(
  line: string,
  year: number,
): {
  date: string
  label: string
} | null {
  const cleanLine = line
    .replace(/^#{1,6}\s*/, '')
    .trim()

  const match = cleanLine.match(
    /^(\d{1,2})(?:\s*(?:--|–|—|-)\s*(\d{1,2}))?\s+([a-zàèéìòù]+)(?:\s*(?:--|–|—|-)\s*(.+))?$/i,
  )

  if (!match) {
    return null
  }

  const day = Number(match[1])
  const monthName = match[3].toLowerCase()
  const monthIndex = italianMonths[monthName]

  if (
    Number.isNaN(day) ||
    monthIndex === undefined
  ) {
    return null
  }

  return {
    date: formatDate(year, monthIndex, day),
    label: match[4]?.trim() || cleanLine,
  }
}

export function parseItineraryMarkdown(
  markdown: string,
  tripStartDate: string,
): ParsedItineraryDay[] {
  const startDate = new Date(
    `${tripStartDate}T12:00:00`,
  )

  const year = startDate.getFullYear()

  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())

  const parsedDays: ParsedItineraryDay[] = []

  let currentDay: ParsedItineraryDay | null = null

  for (const line of lines) {
    if (isIgnoredLine(line)) {
      continue
    }

    const parsedHeading = parseDayHeading(
      line,
      year,
    )

    if (parsedHeading) {
      currentDay = {
        date: parsedHeading.date,
        label: parsedHeading.label,
        activities: [],
      }

      parsedDays.push(currentDay)
      continue
    }

    if (!currentDay) {
      continue
    }

    const cleanLine = cleanActivityLine(line)

    if (!cleanLine) {
      continue
    }

    const { time, text } =
      extractTime(cleanLine)

    currentDay.activities.push({
      time,
      title: text,
      location: text,
      notes: '',
      category: detectCategory(text),
    })
  }

  return parsedDays
}