import {
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

import {
  exportTravelMateBackup,
  importTravelMateBackup,
} from '../../services/backupService'

import type { Trip } from '../../types/travel'

type ProfilePageProps = {
  trips: Trip[]
}

export default function ProfilePage({
  trips,
}: ProfilePageProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null)

  const [
    backupMessage,
    setBackupMessage,
  ] = useState<string | null>(null)

  const [
    backupError,
    setBackupError,
  ] = useState<string | null>(null)

  const [
    isImporting,
    setIsImporting,
  ] = useState(false)

  const totalBudget = trips.reduce(
    (sum, trip) => sum + trip.budget,
    0,
  )

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

  function handleExportBackup() {
    setBackupError(null)
    setBackupMessage(null)

    try {
      exportTravelMateBackup()

      setBackupMessage(
        'Backup creato. Ora invia il file JSON al telefono.',
      )
    } catch {
      setBackupError(
        'Non è stato possibile creare il backup.',
      )
    }
  }

  function openImportFilePicker() {
    setBackupError(null)
    setBackupMessage(null)

    fileInputRef.current?.click()
  }

  async function handleImportBackup(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    const confirmed = window.confirm(
      'Importando il backup verranno sostituiti i dati TravelMate presenti su questo dispositivo. Continuare?',
    )

    if (!confirmed) {
      return
    }

    setIsImporting(true)
    setBackupError(null)
    setBackupMessage(null)

    try {
      const result =
        await importTravelMateBackup(file)

      setBackupMessage(
        `${result.importedKeys} sezioni importate correttamente. TravelMate verrà ricaricata.`,
      )

      window.setTimeout(() => {
        window.location.href = '/'
      }, 700)
    } catch (error) {
      setBackupError(
        error instanceof Error
          ? error.message
          : 'Non è stato possibile importare il backup.',
      )
    } finally {
      setIsImporting(false)
    }
  }

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

      <div className="mt-6 rounded-3xl border border-blue-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
            💾
          </div>

          <div>
            <h3 className="text-lg font-bold">
              Trasferisci i tuoi dati
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Esporta dal PC e importa sul telefono
              per copiare viaggi, Roadbook, mappa,
              checklist, documenti e spese.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="w-full rounded-2xl bg-blue-600 px-4 py-4 font-bold text-white transition active:scale-[0.99]"
          >
            ⬇️ Esporta backup
          </button>

          <button
            type="button"
            onClick={openImportFilePicker}
            disabled={isImporting}
            className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 font-bold text-blue-700 transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          >
            {isImporting
              ? 'Importazione in corso...'
              : '⬆️ Importa backup'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>

        {backupMessage && (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {backupMessage}
          </div>
        )}

        {backupError && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {backupError}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">
          Funzioni in arrivo
        </h3>

        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>☁️ Sincronizzazione cloud</li>
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