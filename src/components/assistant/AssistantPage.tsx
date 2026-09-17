import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useRoadbook } from '../../hooks/useRoadbook'
import {
  parseItineraryMarkdown,
  type ParsedItineraryDay,
} from '../../services/itineraryParser'
import type { Trip } from '../../types/travel'

import TravelAiPanel from './TravelAiPanel'

type AssistantPageProps = {
  activeTrip: Trip | null
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
        'Non ho riconosciuto nessuna giornata. Usa titoli come "## 11 agosto - Sintra e Cascais".',
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

    setImportMessage(
      skippedCount > 0
        ? `${importedCount} attività importate. ${skippedCount} duplicati ignorati.`
        : `${importedCount} attività importate correttamente.`,
    )
  }

  return (
    <section className="space-y-6">
      <TravelAiPanel activeTrip={activeTrip} />

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              Import itinerario
            </p>
            <h2 className="mt-1 text-2xl font-bold">
              Porta un programma nel Roadbook
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Incolla un itinerario già preparato e TravelG lo divide per giorno e attività.
            </p>
          </div>
          <span className="text-3xl">📋</span>
        </div>

        {!activeTrip && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            Crea o seleziona un viaggio prima di importare un itinerario.
          </div>
        )}

        <textarea
          value={itineraryText}
          onChange={(event) => {
            setItineraryText(event.target.value)
            setParsedDays([])
            setAnalysisError(null)
            setImportMessage(null)
          }}
          placeholder={`Esempio:\n\n## 11 agosto - Sintra e Cascais\n- 08:30 Partenza da Lisbona\n- Palazzo Pena\n- Quinta da Regaleira\n- Cascais`}
          className="mt-5 min-h-52 w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!activeTrip || !itineraryText.trim()}
          className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white disabled:bg-slate-300"
        >
          ✨ Analizza itinerario
        </button>
      </article>

      {analysisError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {analysisError}
        </div>
      )}

      {parsedDays.length > 0 && (
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Anteprima
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {totalActivityCount} attività riconosciute
              </h2>
            </div>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {parsedDays.length} giorni
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {parsedDays.map((day) => (
              <article
                key={day.date}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {day.date}
                </p>
                <h3 className="mt-1 font-bold capitalize">
                  {formatPreviewDate(day.date)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {day.label}
                </p>
                <div className="mt-3 space-y-2">
                  {day.activities.map((activity, index) => (
                    <div
                      key={`${day.date}-${activity.title}-${index}`}
                      className="rounded-xl bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium">
                          {activity.title}
                        </span>
                        {activity.time && (
                          <span className="text-xs font-semibold text-blue-600">
                            {activity.time}
                          </span>
                        )}
                      </div>
                      {activity.location && (
                        <p className="mt-1 text-xs text-slate-500">
                          📍 {activity.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={handleImportIntoRoadbook}
            className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-4 font-bold text-white"
          >
            📖 Importa nel Roadbook
          </button>

          {importMessage && (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              <p>{importMessage}</p>
              <button
                type="button"
                onClick={() => navigate('/roadbook')}
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
