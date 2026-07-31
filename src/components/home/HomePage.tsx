import { useNavigate } from 'react-router-dom'
import WeatherCard from './WeatherCard'
import { useChecklist } from '../../hooks/useChecklist'
import { useDocuments } from '../../hooks/useDocuments'
import { useExpenses } from '../../hooks/useExpenses'
import { useWeather } from '../../hooks/useWeather'
import DocumentsCard from './DocumentsCard'
import type { Trip } from '../../types/travel'
import ChecklistSummaryCard from './ChecklistSummaryCard'
import BackupCard from './BackupCard'
import ExpensesCard from './ExpensesCard'
import TripHeroCard from './TripHeroCard'

type HomePageProps = {
  activeTrip: Trip | null
  onCreateTrip: () => void
  onOpenRoadbook: () => void
  onOpenMap: () => void
  onOpenChecklist: () => void
  formatDate: (date: string) => string
  formatCurrency: (amount: number) => string
}

type TripProgress = {
  percentage: number
  title: string
  description: string
  status: 'upcoming' | 'active' | 'completed'
  daysUntilStart: number
  remainingDays: number
  totalDays: number
}

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return today
}

function getTripProgress(
  startDate: string,
  endDate: string,
): TripProgress {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const today = getToday()

  const totalDays = Math.max(
    1,
    Math.round(
      (end.getTime() - start.getTime()) /
        MILLISECONDS_PER_DAY,
    ) + 1,
  )

  if (today < start) {
    const daysUntilStart = Math.ceil(
      (start.getTime() - today.getTime()) /
        MILLISECONDS_PER_DAY,
    )

    return {
      percentage: 0,
      title:
        daysUntilStart === 1
          ? 'Il viaggio inizia domani'
          : `Il viaggio inizia tra ${daysUntilStart} giorni`,
      description: `${totalDays} ${
        totalDays === 1 ? 'giorno' : 'giorni'
      } di viaggio`,
      status: 'upcoming',
      daysUntilStart,
      remainingDays: totalDays,
      totalDays,
    }
  }

  if (today > end) {
    return {
      percentage: 100,
      title: 'Viaggio concluso 🎉',
      description: `${totalDays} ${
        totalDays === 1 ? 'giorno' : 'giorni'
      } di ricordi`,
      status: 'completed',
      daysUntilStart: 0,
      remainingDays: 0,
      totalDays,
    }
  }

  const elapsedDays =
    Math.floor(
      (today.getTime() - start.getTime()) /
        MILLISECONDS_PER_DAY,
    ) + 1

  const remainingDays = Math.max(
    0,
    Math.ceil(
      (end.getTime() - today.getTime()) /
        MILLISECONDS_PER_DAY,
    ),
  )

  const percentage = Math.min(
    100,
    Math.round((elapsedDays / totalDays) * 100),
  )

  return {
    percentage,
    title:
      remainingDays === 0
        ? 'Ultimo giorno di viaggio'
        : remainingDays === 1
          ? 'Rimane 1 giorno'
          : `Rimangono ${remainingDays} giorni`,
    description: `Giorno ${elapsedDays} di ${totalDays}`,
    status: 'active',
    daysUntilStart: 0,
    remainingDays,
    totalDays,
  }
}

export default function HomePage({
  activeTrip,
  onCreateTrip,
  onOpenRoadbook,
  onOpenMap,
  onOpenChecklist,
  formatDate,
  formatCurrency,
}: HomePageProps) {
  const navigate = useNavigate()

  const latitude = activeTrip?.latitude
  const longitude = activeTrip?.longitude

  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number'

  const { weather, loading } = useWeather(
    hasCoordinates ? latitude : undefined,
    hasCoordinates ? longitude : undefined,
  )

  const {
    completedCount,
    totalCount,
    progress,
  } = useChecklist(activeTrip?.id)

  const {
    documentCount,
    expiredDocumentCount,
    expiringDocumentCount,
  } = useDocuments(activeTrip?.id)

  const {
  expenseCount,
  totalSpent,
} = useExpenses(
  activeTrip?.id,
  activeTrip?.budget ?? 0,
)

  const tripProgress = activeTrip
    ? getTripProgress(
        activeTrip.startDate,
        activeTrip.endDate,
      )
    : null

  const documentAlertCount =
    expiredDocumentCount +
    expiringDocumentCount

  return (
    <section>
      <div className="mb-7">
        <p className="text-sm font-medium text-blue-600">
          Buongiorno 👋
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Il tuo viaggio
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Tutto ciò che ti serve, in un solo posto.
        </p>
      </div>

      {!activeTrip && (
        <>
          <button
            type="button"
            onClick={onCreateTrip}
            className="w-full rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-left text-white shadow-lg shadow-blue-200 transition active:scale-[0.99]"
          >
            <span className="text-4xl">✈️</span>

            <h2 className="mt-8 text-2xl font-bold">
              Crea il tuo primo viaggio
            </h2>

            <p className="mt-2 max-w-xs text-sm leading-6 text-blue-100">
              Inserisci destinazione, date, budget e
              compagni di viaggio.
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
              <span className="text-2xl">✅</span>

              <h3 className="mt-5 font-semibold">
                Checklist
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Prepara tutto il necessario.
              </p>
            </article>
          </div>
        </>
      )}

      {activeTrip && tripProgress && (
        <>
<TripHeroCard
  trip={activeTrip}
  tripProgress={tripProgress}
  formatDate={formatDate}
  formatCurrency={formatCurrency}
  onOpenRoadbook={onOpenRoadbook}
/>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⏳</span>

                <span className="text-xs font-semibold text-blue-600">
                  Viaggio
                </span>
              </div>

              <p className="mt-4 text-2xl font-bold">
                {tripProgress.status === 'upcoming'
                  ? tripProgress.daysUntilStart
                  : tripProgress.status === 'active'
                    ? tripProgress.remainingDays
                    : tripProgress.totalDays}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {tripProgress.status === 'upcoming'
                  ? tripProgress.daysUntilStart === 1
                    ? 'giorno alla partenza'
                    : 'giorni alla partenza'
                  : tripProgress.status === 'active'
                    ? tripProgress.remainingDays === 1
                      ? 'giorno rimanente'
                      : 'giorni rimanenti'
                    : tripProgress.totalDays === 1
                      ? 'giorno di viaggio'
                      : 'giorni di viaggio'}
              </p>
            </article>

<ChecklistSummaryCard
  progress={progress}
  totalCount={totalCount}
  completedCount={completedCount}
  onOpenChecklist={onOpenChecklist}
/>
          </div>

          <ExpensesCard
  expenseCount={expenseCount}
  totalSpent={totalSpent}
  formatCurrency={formatCurrency}
  onOpenExpenses={() => navigate('/expenses')}
/>
<DocumentsCard
  documentAlertCount={documentAlertCount}
  expiredDocumentCount={expiredDocumentCount}
  expiringDocumentCount={expiringDocumentCount}
  onOpenDocuments={() => navigate('/documents')}
/>
{hasCoordinates && (
  <WeatherCard
    loading={loading}
    weather={weather}
    destination={activeTrip.destination}
    onOpenWeather={() => navigate('/weather')}
  />
)}
          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Il tuo spazio di viaggio
              </h2>

              <span className="text-xs font-medium text-slate-400">
                Accesso rapido
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                     <button
                type="button"
                onClick={onOpenRoadbook}
                className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                  📖
                </span>

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
                className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                  📍
                </span>

                <span>
                  <strong className="block">
                    Mappa
                  </strong>

                  <small className="text-slate-500">
                    Luoghi e percorso
                  </small>
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenChecklist}
                className="flex min-h-32 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                    {progress === 100 &&
                    totalCount > 0
                      ? '🏆'
                      : '✅'}
                  </span>

                  {totalCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                      {progress}%
                    </span>
                  )}
                </div>

                <div className="w-full">
                  <strong className="block">
                    Checklist
                  </strong>

                  {totalCount === 0 ? (
                    <small className="text-slate-500">
                      Nessun elemento
                    </small>
                  ) : (
                    <>
                      <small className="block text-slate-500">
                        {completedCount} di {totalCount}{' '}
                        completati
                      </small>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/documents')
                }
                className="flex min-h-32 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-2xl">
                    📄
                  </span>

                  {documentCount > 0 && (
                    <span
                      className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                        documentAlertCount > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {documentCount}
                    </span>
                  )}
                </div>

                <span>
                  <strong className="block">
                    Documenti
                  </strong>

                  <small className="text-slate-500">
                    {documentCount === 0
                      ? 'Nessun documento'
                      : documentAlertCount > 0
                        ? `${documentAlertCount} da controllare`
                        : documentCount === 1
                          ? '1 documento salvato'
                          : `${documentCount} documenti salvati`}
                  </small>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/expenses')
                }
                className="flex min-h-32 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                    💰
                  </span>

                  {expenseCount > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-semibold text-emerald-700">
                      {expenseCount}
                    </span>
                  )}
                </div>

                <span>
                  <strong className="block">
                    Spese
                  </strong>

                  <small className="text-slate-500">
                    {expenseCount === 0
                      ? 'Gestisci il budget'
                      : `${formatCurrency(
                          totalSpent,
                        )} spesi`}
                  </small>
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/weather')}
                className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-2xl">
                  🌦️
                </span>

                <span>
                  <strong className="block">
                    Meteo
                  </strong>

                  <small className="text-slate-500">
                    Previsioni aggiornate
                  </small>
                </span>
              </button>
                <button
                type="button"
                onClick={() => navigate('/trips')}
                className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-2xl">
                  🧳
                </span>

                <span>
                  <strong className="block">
                    Viaggi
                  </strong>

                  <small className="text-slate-500">
                    Gestisci le destinazioni
                  </small>
                </span>
              </button>

              <BackupCard />
            </div>
          </div>
        </>
      )}
    </section>
  )
}