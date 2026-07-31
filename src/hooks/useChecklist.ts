import { useEffect, useMemo, useState } from 'react'

import type {
  ChecklistItem,
  CreateChecklistItemInput,
} from '../types/checklist'

const STORAGE_KEY = 'travelmate-checklist'

function readChecklistItems(): ChecklistItem[] {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY)

    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(
      (item): item is ChecklistItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.tripId === 'string' &&
        typeof item.label === 'string' &&
        typeof item.completed === 'boolean' &&
        typeof item.createdAt === 'string',
    )
  } catch {
    return []
  }
}

function createChecklistId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function useChecklist(tripId?: string) {
  const [items, setItems] = useState<ChecklistItem[]>(
    readChecklistItems,
  )

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items),
    )
  }, [items])

  const tripItems = useMemo(() => {
    if (!tripId) {
      return []
    }

    return items
      .filter((item) => item.tripId === tripId)
      .sort((firstItem, secondItem) =>
        firstItem.createdAt.localeCompare(
          secondItem.createdAt,
        ),
      )
  }, [items, tripId])

  const completedCount = useMemo(
    () =>
      tripItems.filter((item) => item.completed)
        .length,
    [tripItems],
  )

  const totalCount = tripItems.length

  const progress =
    totalCount === 0
      ? 0
      : Math.round(
          (completedCount / totalCount) * 100,
        )

  function addItem(
    input: CreateChecklistItemInput,
  ): ChecklistItem | null {
    const cleanLabel = input.label.trim()

    if (!cleanLabel) {
      return null
    }

    const newItem: ChecklistItem = {
      id: createChecklistId(),
      tripId: input.tripId,
      label: cleanLabel,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setItems((currentItems) => [
      ...currentItems,
      newItem,
    ])

    return newItem
  }

  function toggleItem(itemId: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
            }
          : item,
      ),
    )
  }

  function deleteItem(itemId: string) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== itemId,
      ),
    )
  }

  function clearCompleted() {
    if (!tripId) {
      return
    }

    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.tripId !== tripId ||
          !item.completed,
      ),
    )
  }

  function addDefaultItems() {
    if (!tripId) {
      return
    }

    const defaultLabels = [
      'Carta d’identità o passaporto',
      'Biglietti e prenotazioni',
      'Caricabatterie',
      'Farmaci personali',
      'Abbigliamento adatto',
      'Prodotti per l’igiene',
    ]

    setItems((currentItems) => {
      const existingLabels = new Set(
        currentItems
          .filter((item) => item.tripId === tripId)
          .map((item) =>
            item.label.trim().toLocaleLowerCase(
              'it-IT',
            ),
          ),
      )

      const newItems = defaultLabels
        .filter(
          (label) =>
            !existingLabels.has(
              label.toLocaleLowerCase('it-IT'),
            ),
        )
        .map<ChecklistItem>((label) => ({
          id: createChecklistId(),
          tripId,
          label,
          completed: false,
          createdAt: new Date().toISOString(),
        }))

      return [...currentItems, ...newItems]
    })
  }

  return {
    items: tripItems,
    completedCount,
    totalCount,
    progress,
    addItem,
    toggleItem,
    deleteItem,
    clearCompleted,
    addDefaultItems,
  }
}