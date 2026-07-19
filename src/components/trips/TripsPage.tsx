import type { Trip } from '../../types/travel'

type TripsPageProps = {
  trips: Trip[]
  activeTrip: Trip | null
  onCreateTrip: () => void
  onSelectTrip: (tripId: string) => void
  formatDate: (date: string) => string
  formatCurrency: (amount: number) => string
}

export default function TripsPage({
  trips,
  activeTrip,
  onCreateTrip,
  onSelectTrip,
  formatDate,
  formatCurrency,
}: TripsPageProps) {
  return (
    <section>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">I miei viaggi</h1>

          <p className="mt-2 text-slate-500">Tutti i tuoi itinerari.</p>
        </div>

        <button
          type="button"
          onClick={onCreateTrip}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Nuovo
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="text-4xl">🧳</span>

          <h2 className="mt-4 text-lg font-bold">Nessun viaggio creato</h2>

          <p className="mt-2 text-sm text-slate-500">
            Il tuo prossimo viaggio apparirà qui.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {trips.map((trip) => (
            <button
              type="button"
              key={trip.id}
              onClick={() => onSelectTrip(trip.id)}
              className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{trip.destination}</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                  </p>
                </div>

                {trip.id === activeTrip?.id && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Attivo
                  </span>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>👥 {trip.travelers}</span>
                <span>🚗 {trip.transport}</span>
                <span>💰 {formatCurrency(trip.budget)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}