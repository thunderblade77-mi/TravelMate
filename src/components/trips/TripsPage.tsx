import { useState } from 'react'

import TripGroupPanel from './TripGroupPanel'
import type { Trip } from '../../types/travel'

type TripsPageProps = {
  trips: Trip[]
  activeTrip: Trip | null
  onCreateTrip: () => void
  onSelectTrip: (tripId: string) => void
  onRemoveTrip?: (tripId: string) => void
  onJoinTrip?: () => void
  onShareTrip?: (trip: Trip) => void
  formatDate: (date: string) => string
  formatCurrency: (amount: number) => string
}

export default function TripsPage({
  trips,
  activeTrip,
  onJoinTrip,
  onShareTrip,
  onCreateTrip,
  onSelectTrip,
  onRemoveTrip,
  formatDate,
  formatCurrency,
}: TripsPageProps) {
  const [openMenuTripId, setOpenMenuTripId] = useState<string | null>(null)
  const [showGroup, setShowGroup] = useState(true)

  function handleRemoveTrip(trip: Trip) {
    if (!onRemoveTrip) return

    const confirmed = window.confirm(
      `Eliminare definitivamente il viaggio "${trip.destination}"?`,
    )

    if (!confirmed) return

    onRemoveTrip(trip.id)
    setOpenMenuTripId(null)
  }

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            TravelG
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">I miei viaggi</h1>
          <p className="mt-2 text-sm text-slate-500">
            Viaggi, inviti e organizzazione del gruppo.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateTrip}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition active:scale-95"
        >
          + Nuovo
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onJoinTrip}
          className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700"
        >
          🔑 Entra con codice
        </button>
        <button
          type="button"
          disabled={!activeTrip}
          onClick={() => setShowGroup((value) => !value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-40"
        >
          👥 {showGroup ? 'Nascondi gruppo' : 'Apri gruppo'}
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="text-4xl">🧳</span>
          <h2 className="mt-4 text-lg font-bold">Nessun viaggio creato</h2>
          <p className="mt-2 text-sm text-slate-500">
            Crea un viaggio oppure entra con il codice ricevuto da un amico.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {trips.map((trip) => {
            const isActive = trip.id === activeTrip?.id
            const isMenuOpen = openMenuTripId === trip.id

            return (
              <article
                key={trip.id}
                className={`relative rounded-3xl border bg-white p-5 shadow-sm ${
                  isActive ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectTrip(trip.id)}
                  className="w-full pr-12 text-left active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="break-words text-xl font-bold">{trip.destination}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                      </p>
                    </div>

                    {isActive && (
                      <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Attivo
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                    <span>👥 {trip.travelers}</span>
                    <span>🚗 {trip.transport}</span>
                    <span>💰 {formatCurrency(trip.budget)}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setOpenMenuTripId((current) => (current === trip.id ? null : trip.id))
                  }
                  className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold text-slate-400 transition hover:bg-slate-100"
                  aria-label={`Azioni per ${trip.destination}`}
                >
                  ⋮
                </button>

                {isMenuOpen && (
                  <div className="absolute bottom-14 right-4 z-10 min-w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTrip(trip.id)
                        setOpenMenuTripId(null)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      ✓ Seleziona viaggio
                    </button>

                    {onShareTrip && (
                      <button
                        type="button"
                        onClick={() => {
                          onShareTrip(trip)
                          setOpenMenuTripId(null)
                        }}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        👥 Condividi / invita
                      </button>
                    )}

                    {onRemoveTrip && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTrip(trip)}
                        className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        🗑️ Elimina viaggio
                      </button>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {activeTrip && showGroup && (
        <TripGroupPanel trip={activeTrip} onShareTrip={onShareTrip} />
      )}
    </section>
  )
}
