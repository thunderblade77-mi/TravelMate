import { useRef } from 'react'

import {
  exportTravelMateBackup,
  importTravelMateBackup,
} from '../../services/backupService'

export default function BackupCard() {
  const fileInputRef =
    useRef<HTMLInputElement>(null)

  async function handleImport(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const confirmed = window.confirm(
      'Il ripristino sostituirà tutti i dati attuali di TravelMate.\n\nContinuare?',
    )

    if (!confirmed) {
      event.target.value = ''
      return
    }

    try {
      const result =
        await importTravelMateBackup(file)

      window.alert(
        `Backup ripristinato con successo.\n\n${result.importedKeys} elementi importati.\n\nL'app verrà ricaricata.`,
      )

      window.location.reload()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Errore durante il ripristino del backup.',
      )
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-2xl">
          📦
        </span>

        <div>
          <strong className="block">
            Backup e ripristino
          </strong>

          <small className="text-slate-500">
            Salva o recupera tutti i dati di TravelMate.
          </small>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={exportTravelMateBackup}
          className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition active:scale-[0.98]"
        >
          ⬇️ Esporta dati
        </button>

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition active:scale-[0.98]"
        >
          ⬆️ Importa dati
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}