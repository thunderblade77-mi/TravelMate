import type { Trip } from '../../types/travel'

type ProfilePageProps = {
  trips: Trip[]
}

export default function ProfilePage({ trips }: ProfilePageProps) {
  const totalBudget = trips.reduce((sum, trip) => sum + trip.budget, 0)

  const totalTravelers = trips.reduce(
    (sum, trip) => sum + trip.travelers,
    0,
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">
        Profilo
      </h1>

      <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-4xl">
          👤
        </div>

        <h2 className="mt-5 text-2xl font-bold">
          Viaggiatore
        </h2>

        <p className="mt-1 text-slate-500">
          Benvenuto in TravelMate
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Viaggi creati
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {trips.length}
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Viaggiatori
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {totalTravelers}
          </h3>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">
            Budget totale pianificato
          </p>

          <h3 className="mt-2 text-3xl font-bold text-blue-600">
            {formatCurrency(totalBudget)}
          </h3>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">
          Funzioni in arrivo
        </h3>

        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>✅ Backup Cloud</li>
          <li>🤖 TravelMate AI</li>
          <li>📄 Wallet documenti</li>
          <li>🗺️ Mappe offline</li>
          <li>📍 Posizione in tempo reale</li>
          <li>👨‍👩‍👧 Condivisione viaggio</li>
        </ul>
      </div>
    </section>
  )
}