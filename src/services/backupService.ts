const STORAGE_KEY_PREFIX = 'travelmate-'
const BACKUP_VERSION = 1

type TravelMateBackup = {
  app: 'TravelMate'
  version: number
  createdAt: string
  data: Record<string, string>
}

export type ImportBackupResult = {
  importedKeys: number
  createdAt: string | null
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function createBackupFileName(): string {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    now.getDate(),
  ).padStart(2, '0')

  return `travelmate-backup-${year}-${month}-${day}.json`
}

function collectTravelMateData(): Record<
  string,
  string
> {
  const data: Record<string, string> = {}

  for (
    let index = 0;
    index < localStorage.length;
    index += 1
  ) {
    const key = localStorage.key(index)

    if (
      !key ||
      !key.startsWith(STORAGE_KEY_PREFIX)
    ) {
      continue
    }

    const value = localStorage.getItem(key)

    if (value !== null) {
      data[key] = value
    }
  }

  return data
}

function removeCurrentTravelMateData(): void {
  const keysToRemove: string[] = []

  for (
    let index = 0;
    index < localStorage.length;
    index += 1
  ) {
    const key = localStorage.key(index)

    if (
      key?.startsWith(STORAGE_KEY_PREFIX)
    ) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key)
  })
}

function parseBackup(
  fileContent: string,
): TravelMateBackup {
  const parsedBackup: unknown =
    JSON.parse(fileContent)

  if (!isRecord(parsedBackup)) {
    throw new Error(
      'Il file selezionato non contiene un backup valido.',
    )
  }

  if (parsedBackup.app !== 'TravelMate') {
    throw new Error(
      'Il file selezionato non è un backup di TravelMate.',
    )
  }

  if (
    typeof parsedBackup.version !== 'number'
  ) {
    throw new Error(
      'La versione del backup non è valida.',
    )
  }

  if (!isRecord(parsedBackup.data)) {
    throw new Error(
      'I dati contenuti nel backup non sono validi.',
    )
  }

  const data: Record<string, string> = {}

  Object.entries(parsedBackup.data).forEach(
    ([key, value]) => {
      if (
        key.startsWith(STORAGE_KEY_PREFIX) &&
        typeof value === 'string'
      ) {
        data[key] = value
      }
    },
  )

  if (Object.keys(data).length === 0) {
    throw new Error(
      'Il backup non contiene dati di TravelMate.',
    )
  }

  return {
    app: 'TravelMate',
    version: parsedBackup.version,
    createdAt:
      typeof parsedBackup.createdAt ===
      'string'
        ? parsedBackup.createdAt
        : '',
    data,
  }
}

export function exportTravelMateBackup(): void {
  const backup: TravelMateBackup = {
    app: 'TravelMate',
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    data: collectTravelMateData(),
  }

  const fileContent = JSON.stringify(
    backup,
    null,
    2,
  )

  const fileBlob = new Blob([fileContent], {
    type: 'application/json',
  })

  const downloadUrl =
    URL.createObjectURL(fileBlob)

  const downloadLink =
    document.createElement('a')

  downloadLink.href = downloadUrl
  downloadLink.download =
    createBackupFileName()

  document.body.appendChild(downloadLink)
  downloadLink.click()
  downloadLink.remove()

  URL.revokeObjectURL(downloadUrl)
}

export async function importTravelMateBackup(
  file: File,
): Promise<ImportBackupResult> {
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error(
      'Seleziona un file di backup in formato JSON.',
    )
  }

  const fileContent = await file.text()
  const backup = parseBackup(fileContent)

  removeCurrentTravelMateData()

  Object.entries(backup.data).forEach(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
  )

  return {
    importedKeys: Object.keys(
      backup.data,
    ).length,
    createdAt: backup.createdAt || null,
  }
}