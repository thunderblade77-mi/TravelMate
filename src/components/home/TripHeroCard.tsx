import type { Trip } from '../../types/travel'

type TripProgress = {
  percentage: number
  title: string
  description: string
  status: 'upcoming' | 'active' | 'completed'
  daysUntilStart: number
  remainingDays: number
  totalDays: number
}

type TripHeroCardProps = {
  trip: Trip
  tripProgress: TripProgress
  formatDate: (date: string) => string
  formatCurrency: (amount: number) => string
  onOpenRoadbook: () => void
}

function getTripStatusLabel(
  tripProgress: TripProgress,
): string {
  if (tripProgress.status === 'upcoming') {
    return 'In preparazione'
  }

  if (tripProgress.status === 'completed') {
    return 'Concluso'
  }

  return 'In corso'
}

function getTripStatusClasses(
  tripProgress: TripProgress,
): string {
  if (tripProgress.status === 'upcoming') {
    return 'bg-amber-400/20 text-amber-50'
  }

  if (tripProgress.status === 'completed') {
    return 'bg-emerald-400/20 text-emerald-50'
  }

  return 'bg-white/15 text-white'
}

export default function TripHeroCard({
  trip,
  tripProgress,
  formatDate,
  formatCurrency,
  onOpenRoadbook,
}: TripHeroCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-100">
              Viaggio attivo
            </p>

            <h2 className="mt-1 truncate text-3xl font-bold">
              {trip.destination}
            </h2>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${getTripStatusClasses(
              tripProgress,
            )}`}
          >
            {getTripStatusLabel(tripProgress)}
          </span>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-200">
              Partenza
            </p>

            <p className="mt-1 text-sm font-semibold">
              {formatDate(trip.startDate)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-blue-200">
              Ritorno
            </p>

            <p className="mt-1 text-sm font-semibold">
              {formatDate(trip.endDate)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-blue-200">
              Budget
            </p>

            <p className="mt-1 text-sm font-semibold">
              {formatCurrency(trip.budget)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-blue-200">
              Viaggiatori
            </p>

            <p className="mt-1 text-sm font-semibold">
              {trip.travelers}{' '}
              {trip.travelers === 1
                ? 'persona'
                : 'persone'}
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-2xl bg-white/10 p-4 backdrop-blur">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-semibold">
                {tripProgress.title}
              </p>

              <p className="mt-1 text-xs text-blue-100">
                {tripProgress.description}
              </p>
            </div>

            <span className="text-sm font-bold">
              {tripProgress.percentage}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{
                width: `${tripProgress.percentage}%`,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenRoadbook}
          className="mt-6 w-full rounded-2xl bg-white px-4 py-3 font-semibold text-blue-700 transition active:scale-[0.99]"
        >
          Apri il roadbook
        </button>
      </div>
    </article>
  )
}