import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useRoadbook } from '../../hooks/useRoadbook'

import {
  parseItineraryMarkdown,
  type ParsedItineraryDay,
} from '../../services/itineraryParser'

import type { Trip } from '../../types/travel'

type AssistantPageProps = {
  activeTrip: Trip | null
}

function getCategoryIcon(
  category:
    | 'visita'
    | 'ristorante'
    | 'hotel'
    | 'trasporto'
    | 'altro',
  title: string,
): string {
  const normalizedTitle = title.toLowerCase()

  if (category === 'ristorante') {
    return '🍽️'
  }

  if (category === 'hotel') {
    return '🏨'
  }

  if (category === 'trasporto') {
    if (
      normalizedTitle.includes('volo') ||
      normalizedTitle.includes('aereo') ||
      normalizedTitle.includes('aeroporto')
    ) {
      return '✈️'
    }

    if (
      normalizedTitle.includes('treno') ||
      normalizedTitle.includes('ferrovia')
    ) {
      return '🚆'
    }

    if (
      normalizedTitle.includes('metro') ||
      normalizedTitle.includes('metropolitana')
    ) {
      return '🚇'
    }

    if (
      normalizedTitle.includes('autobus') ||
      normalizedTitle.includes('bus') ||
      normalizedTitle.includes('pullman')
    ) {
      return '🚌'
    }

    if (
      normalizedTitle.includes('traghetto') ||
      normalizedTitle.includes('nave')
    ) {
      return '⛴️'
    }

    if (normalizedTitle.includes('taxi')) {
      return '🚕'
    }

    if (
      normalizedTitle.includes('piedi') ||
      normalizedTitle.includes('passeggiata')
    ) {
      return '🚶'
    }

    return '🚗'
  }

  if (category === 'altro') {
    return '✨'
  }

  return '📍'
}

function formatPreviewDate(date: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`))
}

export default function AssistantPage({
  activeTrip,
}: AssistantPageProps) {
  const navigate = useNavigate()

  const {
    activities,
    createActivity,
  } = useRoadbook(activeTrip?.id ?? null)

  const [itineraryText, setItineraryText] =
    useState('')

  const [parsedDays, setParsedDays] = useState<
    ParsedItineraryDay[]
  >([])

  const [analysisError, setAnalysisError] =
    useState<string | null>(null)

  const [importMessage, setImportMessage] =
    useState<string | null>(null)

  const totalActivityCount = parsedDays.reduce(
    (total, day) =>
      total + day.activities.length,
    0,
  )

  function handleTextChange(value: string) {
    setItineraryText(value)
    setParsedDays([])
    setAnalysisError(null)
    setImportMessage(null)
  }

  function handleAnalyze() {
    if (!activeTrip || !itineraryText.trim()) {
      return
    }

    const result = parseItineraryMarkdown(
      itineraryText,
      activeTrip.startDate,
    )

    if (result.length === 0) {
      setParsedDays([])
      setImportMessage(null)

      setAnalysisError(
        'Non ho riconosciuto nessuna giornata. Controlla che ogni giorno abbia un titolo come "## 11 agosto - Sintra e Cascais".',
      )

      return
    }

    setAnalysisError(null)
    setImportMessage(null)
    setParsedDays(result)
  }

  function handleImportIntoRoadbook() {
    if (!activeTrip || parsedDays.length === 0) {
      return
    }

    const confirmed = window.confirm(
      `Importare ${totalActivityCount} attività nel Roadbook di ${activeTrip.destination}?`,
    )

    if (!confirmed) {
      return
    }

    const existingActivityKeys = new Set(
      activities.map((activity) => {
        const normalizedTitle = activity.title
          .trim()
          .toLowerCase()

        return `${activity.dayId}|${activity.time}|${normalizedTitle}`
      }),
    )

    let importedCount = 0
    let skippedCount = 0

    parsedDays.forEach((day) => {
      day.activities.forEach((activity) => {
        const normalizedTitle = activity.title
          .trim()
          .toLowerCase()

        const activityKey =
          `${day.date}|${activity.time}|${normalizedTitle}`

        if (existingActivityKeys.has(activityKey)) {
          skippedCount += 1
          return
        }

        createActivity({
          dayId: day.date,
          time: activity.time,
          title: activity.title,
          location: activity.location,
          notes: activity.notes,
          category: activity.category,
        })

        existingActivityKeys.add(activityKey)
        importedCount += 1
      })
    })

    if (skippedCount > 0) {
      setImportMessage(
        `${importedCount} attività importate. ${skippedCount} attività duplicate ignorate.`,
      )

      return
    }

    setImportMessage(
      `${importedCount} attività importate correttamente.`,
    )
  }

  return (
    <section>
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-sm">
        <p className="text-sm font-semibold text-blue-100">
          Assistente Viaggio
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Importa il tuo itinerario
        </h1>

        <p className="mt-3 text-sm leading-6 text-blue-100">
          Incolla il programma creato con
          un’intelligenza artificiale, copiato da un
          documento o preparato personalmente.
        </p>
      </div>

      {!activeTrip && (
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Crea o seleziona un viaggio prima di
          importare un itinerario.
        </div>
      )}

      {activeTrip && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Viaggio selezionato
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {activeTrip.destination}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Dal {activeTrip.startDate} al{' '}
            {activeTrip.endDate}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="itinerary">
          <span className="block text-base font-bold text-slate-900">
            Incolla l’itinerario
          </span>

          <span className="mt-1 block text-sm leading-6 text-slate-500">
            Puoi includere date, orari, luoghi,
            trasporti, hotel e note.
          </span>
        </label>

        <textarea
          id="itinerary"
          value={itineraryText}
          onChange={(event) =>
            handleTextChange(event.target.value)
          }
          placeholder={`Esempio:

## 11 agosto - Sintra e Cascais
- 08:30 Partenza da Lisbona
- Palazzo Pena
- Quinta da Regaleira
- Cabo da Roca
- Cascais`}
          className="mt-4 min-h-80 w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <p className="mt-2 text-right text-xs text-slate-400">
          {itineraryText.length} caratteri
        </p>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={
            !activeTrip || !itineraryText.trim()
          }
          className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          ✨ Analizza itinerario
        </button>
      </div>

      {analysisError && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {analysisError}
        </div>
      )}

      {parsedDays.length > 0 && (
        <div className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Anteprima importazione
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Itinerario riconosciuto
              </h2>
            </div>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {parsedDays.length}{' '}
              {parsedDays.length === 1
                ? 'giorno'
                : 'giorni'}
            </span>
          </div>

          <div className="mt-4 rounded-2xl bg-slate-100 p-4">
            <p className="font-semibold text-slate-900">
              {totalActivityCount}{' '}
              {totalActivityCount === 1
                ? 'attività riconosciuta'
                : 'attività riconosciute'}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Controlla il risultato prima di
              importarlo nel Roadbook.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            {parsedDays.map((day) => (
              <article
                key={day.date}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {day.date}
                </p>

                <h3 className="mt-1 text-lg font-bold capitalize text-slate-900">
                  {formatPreviewDate(day.date)}
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {day.label}
                </p>

                {day.activities.length === 0 ? (
                  <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Nessuna attività riconosciuta.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {day.activities.map(
                      (activity, index) => (
                        <div
                          key={`${day.date}-${activity.title}-${index}`}
                          className="flex gap-3 rounded-2xl bg-slate-50 p-3"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                            {getCategoryIcon(
                              activity.category,
                              activity.title,
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="break-words font-semibold text-slate-900">
                                {activity.title}
                              </p>

                              {activity.time && (
                                <span className="shrink-0 text-xs font-semibold text-blue-600">
                                  {activity.time}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs capitalize text-slate-500">
                              {activity.category}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={handleImportIntoRoadbook}
            className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-4 font-bold text-white transition active:scale-[0.99]"
          >
            📖 Importa nel Roadbook
          </button>

          {importMessage && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              <p>{importMessage}</p>

              <button
                type="button"
                onClick={() =>
                  navigate('/roadbook')
                }
                className="mt-3 rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
              >
                Apri il Roadbook →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}