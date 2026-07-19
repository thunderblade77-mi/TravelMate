import type { Trip } from '../../types/travel'

type HomePageProps = {
  activeTrip: Trip | null
  onCreateTrip: () => void
  onOpenRoadbook: () => void
  onOpenMap: () => void
  formatDate: (date: string) => string
  formatCurrency: (amount: number) => string
}

export default function HomePage({
  activeTrip,
  onCreateTrip,
  onOpenRoadbook,
  onOpenMap,
  formatDate,
  formatCurrency,
}: HomePageProps) {
  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-medium text-blue-600">
          Buongiorno 👋
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Dove andiamo?
        </h1>
      </div>

      {!activeTrip && (
        <>
          <button
            type="button"
            onClick={onCreateTrip}
            className="w-full rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-left text-white shadow-lg shadow-blue-200 active:scale-[0.99]"
          >
            <span className="text-4xl">✈️</span>

            <h2 className="mt-8 text-2xl font-bold">
              Crea il tuo primo viaggio
            </h2>

            <p className="mt-2 max-w-xs text-sm leading-6 text-blue-100">
              Inserisci destinazione, date, budget e compagni di viaggio.
            </p>

            <span className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700">
              Inizia ora
            </span>
          </button>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-2xl">🗺️</span>

              <h3 className="mt-5 font-semibold">
                Roadbook
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Programma giorno per giorno.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-2xl">💳</span>

              <h3 className="mt-5 font-semibold">
                Wallet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Documenti e prenotazioni.
              </p>
            </article>
          </div>
        </>
      )}

      {activeTrip && (
        <>
          <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-100">
                    Viaggio attivo
                  </p>

                  <h2 className="mt-1 text-3xl font-bold">
                    {activeTrip.destination}
                  </h2>
                </div>

                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {activeTrip.transport}
                </span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-200">
                    Partenza
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(activeTrip.startDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-200">
                    Ritorno
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {formatDate(activeTrip.endDate)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenRoadbook}
                className="mt-6 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-blue-700 active:scale-[0.99]"
              >
                Continua viaggio
              </button>
            </div>
          </article>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onOpenRoadbook}
              className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.98]"
            >
              <span className="text-2xl">📖</span>

              <span>
                <strong className="block">
                  Roadbook
                </strong>

                <small className="text-slate-500">
                  Programma completo
                </small>
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenMap}
              className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.98]"
            >
              <span className="text-2xl">📍</span>

              <span>
                <strong className="block">
                  Mappa Live
                </strong>

                <small className="text-slate-500">
                  Percorso del viaggio
                </small>
              </span>
            </button>

            <button
              type="button"
              className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.98]"
            >
              <span className="text-2xl">💰</span>

              <span>
                <strong className="block">
                  Budget
                </strong>

                <small className="text-slate-500">
                  {formatCurrency(activeTrip.budget)}
                </small>
              </span>
            </button>

            <button
              type="button"
              className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[0.98]"
            >
              <span className="text-2xl">👥</span>

              <span>
                <strong className="block">
                  Viaggiatori
                </strong>

                <small className="text-slate-500">
                  {activeTrip.travelers}{' '}
                  {activeTrip.travelers === 1
                    ? 'persona'
                    : 'persone'}
                </small>
              </span>
            </button>
          </div>
        </>
      )}
    </section>
  )
}