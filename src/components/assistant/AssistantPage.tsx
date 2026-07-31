import { useState } from 'react'

import type { Trip } from '../../types/travel'

type AssistantPageProps = {
  activeTrip: Trip | null
}

export default function AssistantPage({
  activeTrip,
}: AssistantPageProps) {
  const [itineraryText, setItineraryText] =
    useState('')

  function handleAnalyze() {
    if (!itineraryText.trim()) {
      return
    }

    console.log(
      'Itinerario da analizzare:',
      itineraryText,
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
            setItineraryText(event.target.value)
          }
          placeholder={`Esempio:

11 agosto - Sintra e Cascais

08:30 Treno per Sintra
10:00 Palazzo Pena
12:30 Quinta da Regaleira
15:30 Cabo da Roca
18:00 Cascais`}
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

        <p className="mt-3 text-center text-xs text-slate-400">
          In questa prima versione nessun dato verrà
          salvato automaticamente.
        </p>
      </div>
    </section>
  )
}