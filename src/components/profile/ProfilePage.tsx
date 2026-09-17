import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'

import {
  exportTravelMateBackup,
  importTravelMateBackup,
} from '../../services/backupService'
import {
  loadTravelPreferences,
  saveTravelPreferences,
} from '../../services/travelIntelligenceStorage'
import {
  loadSyncedTravelPreferences,
  saveCloudTravelPreferences,
} from '../../services/travelPreferencesCloud'

import type { Trip } from '../../types/travel'
import type {
  TravelInterest,
  TravelPace,
} from '../../types/travelIntelligence'

type ProfilePageProps = {
  trips: Trip[]
}

const interestOptions: {
  value: TravelInterest
  label: string
  icon: string
}[] = [
  { value: 'arte', label: 'Arte', icon: '🎨' },
  { value: 'monumenti', label: 'Monumenti', icon: '🏛️' },
  { value: 'storia', label: 'Storia', icon: '📜' },
  { value: 'cibo', label: 'Cibo', icon: '🍽️' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { value: 'natura', label: 'Natura', icon: '🌿' },
  { value: 'mare', label: 'Mare', icon: '🏖️' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'famiglia', label: 'Famiglia', icon: '👨‍👩‍👧' },
  { value: 'avventura', label: 'Avventura', icon: '🧗' },
  { value: 'relax', label: 'Relax', icon: '🧘' },
  { value: 'fotografia', label: 'Fotografia', icon: '📷' },
]

const paceOptions: {
  value: TravelPace
  label: string
  description: string
}[] = [
  {
    value: 'slow',
    label: 'Relax',
    description: 'Poche tappe e più tempo in ogni posto.',
  },
  {
    value: 'balanced',
    label: 'Equilibrato',
    description: 'Un buon mix tra visite e tempo libero.',
  },
  {
    value: 'intense',
    label: 'Intenso',
    description: 'Voglio vedere il più possibile.',
  },
]

export default function ProfilePage({
  trips,
}: ProfilePageProps) {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null)

  const initialPreferences = loadTravelPreferences()

  const [interests, setInterests] = useState<TravelInterest[]>(
    initialPreferences.interests,
  )
  const [pace, setPace] = useState<TravelPace>(
    initialPreferences.pace,
  )
  const [avoidCrowds, setAvoidCrowds] = useState(
    initialPreferences.avoidCrowds,
  )
  const [localFood, setLocalFood] = useState(
    initialPreferences.localFood,
  )
  const [hiddenGems, setHiddenGems] = useState(
    initialPreferences.hiddenGems,
  )
  const [preferencesSaved, setPreferencesSaved] = useState(false)
  const [preferencesSyncing, setPreferencesSyncing] = useState(false)
  const [preferencesSyncError, setPreferencesSyncError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setPreferencesSyncing(true)

    void loadSyncedTravelPreferences()
      .then((synced) => {
        if (!active) return
        setInterests(synced.interests)
        setPace(synced.pace)
        setAvoidCrowds(synced.avoidCrowds)
        setLocalFood(synced.localFood)
        setHiddenGems(synced.hiddenGems)
        setPreferencesSyncError(null)
      })
      .catch(() => {
        if (active) {
          setPreferencesSyncError('Cloud non disponibile: sto usando le preferenze salvate sul dispositivo.')
        }
      })
      .finally(() => {
        if (active) setPreferencesSyncing(false)
      })

    return () => {
      active = false
    }
  }, [])

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

  function toggleInterest(interest: TravelInterest) {
    setPreferencesSaved(false)
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    )
  }

  async function handleSavePreferences() {
    setPreferencesSyncing(true)
    setPreferencesSyncError(null)

    const values = {
      interests,
      pace,
      avoidCrowds,
      localFood,
      hiddenGems,
    }

    try {
      await saveCloudTravelPreferences(values)
      setPreferencesSaved(true)
    } catch {
      saveTravelPreferences(values)
      setPreferencesSaved(true)
      setPreferencesSyncError(
        'Preferenze salvate sul dispositivo. La sincronizzazione cloud verrà riprovata più avanti.',
      )
    } finally {
      setPreferencesSyncing(false)
    }
  }

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
      'Importando il backup verranno sostituiti i dati TravelG presenti su questo dispositivo. Continuare?',
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
        `${result.importedKeys} sezioni importate correttamente. TravelG verrà ricaricata.`,
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
          Le tue preferenze guideranno TravelG AI durante il viaggio.
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

      <div className="mt-6 rounded-3xl border border-violet-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
            ✨
          </div>
          <div>
            <h3 className="text-lg font-bold">Il tuo stile di viaggio</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Scegli ciò che ti interessa: questi dati serviranno all’assistente AI per proporti luoghi, esperienze e cibo davvero coerenti con te.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {interestOptions.map((option) => {
            const selected = interests.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleInterest(option.value)}
                className={`rounded-2xl border px-2 py-3 text-center text-xs font-semibold transition active:scale-95 ${
                  selected
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block text-xl">{option.icon}</span>
                <span className="mt-1 block">{option.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-800">Ritmo preferito</p>
          <div className="mt-2 space-y-2">
            {paceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setPace(option.value)
                  setPreferencesSaved(false)
                }}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  pace === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <strong className="text-sm">{option.label}</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {[
            {
              label: 'Preferisco evitare la folla',
              value: avoidCrowds,
              setValue: setAvoidCrowds,
            },
            {
              label: 'Voglio provare cucina locale',
              value: localFood,
              setValue: setLocalFood,
            },
            {
              label: 'Mi interessano posti meno turistici',
              value: hiddenGems,
              setValue: setHiddenGems,
            },
          ].map((item) => (
            <label
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <input
                type="checkbox"
                checked={item.value}
                onChange={(event) => {
                  item.setValue(event.target.checked)
                  setPreferencesSaved(false)
                }}
                className="h-5 w-5 accent-blue-600"
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void handleSavePreferences()}
          disabled={preferencesSyncing}
          className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {preferencesSyncing
            ? 'Sincronizzazione…'
            : preferencesSaved
              ? '✓ Preferenze sincronizzate'
              : 'Salva e sincronizza preferenze'}
        </button>

        {preferencesSyncError && (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium leading-5 text-amber-700">
            {preferencesSyncError}
          </p>
        )}

        {!preferencesSyncError && !preferencesSyncing && (
          <p className="mt-3 text-center text-xs font-semibold text-emerald-600">
            Cloud sync attivo tra i tuoi dispositivi
          </p>
        )}
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
          TravelG 2.0
        </h3>

        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>📍 Check automatico delle visite tramite posizione</li>
          <li>🤖 Suggerimenti AI basati su gusti e contesto</li>
          <li>👥 Organizzazione collaborativa del viaggio</li>
          <li>⭐ Valutazioni condivise dei luoghi</li>
          <li>📸 Memory story con foto preferite e geolocalizzate</li>
        </ul>
      </div>
    </section>
  )
}
