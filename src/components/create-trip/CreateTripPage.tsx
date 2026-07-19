import type { FormEvent } from 'react'

type CreateTripPageProps = {
  destination: string
  startDate: string
  endDate: string
  travelers: number
  budget: string
  transport: string

  onDestinationChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onTravelersChange: (value: number) => void
  onBudgetChange: (value: string) => void
  onTransportChange: (value: string) => void

  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function CreateTripPage({
  destination,
  startDate,
  endDate,
  travelers,
  budget,
  transport,
  onDestinationChange,
  onStartDateChange,
  onEndDateChange,
  onTravelersChange,
  onBudgetChange,
  onTransportChange,
  onBack,
  onSubmit,
}: CreateTripPageProps) {
  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 text-sm font-semibold text-blue-600"
      >
        ← Torna alla Home
      </button>

      <h1 className="text-3xl font-bold tracking-tight">
        Nuovo viaggio
      </h1>

      <p className="mt-2 text-slate-500">
        Inserisci le informazioni principali.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Destinazione
          </span>

          <input
            type="text"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            placeholder="Es. Portogallo"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Partenza
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">
              Ritorno
            </span>

            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Numero di viaggiatori
          </span>

          <input
            type="number"
            min="1"
            max="50"
            value={travelers}
            onChange={(e) => onTravelersChange(Number(e.target.value))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Budget totale
          </span>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              €
            </span>

            <input
              type="number"
              min="0"
              step="50"
              value={budget}
              onChange={(e) => onBudgetChange(e.target.value)}
              placeholder="2500"
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-9 pr-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">
            Mezzo principale
          </span>

          <select
            value={transport}
            onChange={(e) => onTransportChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option>Auto</option>
            <option>Aereo</option>
            <option>Treno</option>
            <option>Moto</option>
            <option>Camper</option>
            <option>Nave</option>
          </select>
        </label>

        <button
          type="submit"
          className="w-full rounded-2xl bg-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 active:scale-[0.99]"
        >
          Crea viaggio
        </button>
      </form>
    </section>
  )
}