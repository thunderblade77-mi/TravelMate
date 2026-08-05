import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

import type {
  ChecklistItem,
  CreateChecklistItemInput,
} from '../types/checklist'

type CloudChecklistRow = {
  id: string
  trip_id: string
  created_by: string
  label: string
  completed: boolean
  created_at: string
}

function mapCloudItem(
  row: CloudChecklistRow,
): ChecklistItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    label: row.label,
    completed: row.completed,
    createdAt: row.created_at,
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
  const [items, setItems] =
    useState<ChecklistItem[]>([])

  const [userId, setUserId] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(Boolean(tripId))

  const [error, setError] =
    useState<string | null>(null)

  const loadItems = useCallback(async () => {
    if (!tripId) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setUserId(null)
        setItems([])
        setError(
          'Devi effettuare il login.',
        )
        return
      }

      setUserId(user.id)

      const {
        data,
        error: itemsError,
      } = await supabase
        .from('checklist_items')
        .select(
          `
            id,
            trip_id,
            created_by,
            label,
            completed,
            created_at
          `,
        )
        .eq('trip_id', tripId)
        .order('created_at', {
          ascending: true,
        })

      if (itemsError) {
        throw itemsError
      }

      setItems(
        (data ?? []).map((row) =>
          mapCloudItem(
            row as CloudChecklistRow,
          ),
        ),
      )

      setError(null)
    } catch (loadError) {
      console.error(
        'Errore caricamento checklist:',
        loadError,
      )

      setItems([])
      setError(
        'Impossibile caricare la checklist.',
      )
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!tripId) {
      return
    }

    const channel = supabase
      .channel(
        `travelg-checklist-${tripId}`,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checklist_items',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void loadItems()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tripId, loadItems])

  const tripItems = useMemo(
    () =>
      [...items].sort(
        (firstItem, secondItem) =>
          firstItem.createdAt.localeCompare(
            secondItem.createdAt,
          ),
      ),
    [items],
  )

  const completedCount = useMemo(
    () =>
      tripItems.filter(
        (item) => item.completed,
      ).length,
    [tripItems],
  )

  const totalCount = tripItems.length

  const progress =
    totalCount === 0
      ? 0
      : Math.round(
          (completedCount / totalCount) *
            100,
        )

  function addItem(
    input: CreateChecklistItemInput,
  ): ChecklistItem | null {
    const cleanLabel = input.label.trim()

    if (!cleanLabel || !userId) {
      return null
    }

    const newItem: ChecklistItem = {
      id: createChecklistId(),
      tripId: input.tripId,
      label: cleanLabel,
      completed: false,
      createdAt:
        new Date().toISOString(),
    }

    setItems((currentItems) => [
      ...currentItems,
      newItem,
    ])

    void supabase
      .from('checklist_items')
      .insert({
        id: newItem.id,
        trip_id: newItem.tripId,
        created_by: userId,
        label: newItem.label,
        completed: false,
        created_at: newItem.createdAt,
      })
      .then(({ error: insertError }) => {
        if (!insertError) {
          setError(null)
          return
        }

        console.error(
          'Errore aggiunta checklist:',
          insertError,
        )

        setItems((currentItems) =>
          currentItems.filter(
            (item) =>
              item.id !== newItem.id,
          ),
        )

        setError(
          'Impossibile aggiungere la voce.',
        )
      })

    return newItem
  }

  function toggleItem(itemId: string) {
    const currentItem = items.find(
      (item) => item.id === itemId,
    )

    if (!currentItem) {
      return
    }

    const nextCompleted =
      !currentItem.completed

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: nextCompleted,
            }
          : item,
      ),
    )

    void supabase
      .from('checklist_items')
      .update({
        completed: nextCompleted,
      })
      .eq('id', itemId)
      .then(({ error: updateError }) => {
        if (!updateError) {
          setError(null)
          return
        }

        console.error(
          'Errore aggiornamento checklist:',
          updateError,
        )

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === itemId
              ? currentItem
              : item,
          ),
        )

        setError(
          'Impossibile aggiornare la voce.',
        )
      })
  }

  function deleteItem(itemId: string) {
    const deletedItem = items.find(
      (item) => item.id === itemId,
    )

    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.id !== itemId,
      ),
    )

    void supabase
      .from('checklist_items')
      .delete()
      .eq('id', itemId)
      .then(({ error: deleteError }) => {
        if (!deleteError) {
          setError(null)
          return
        }

        console.error(
          'Errore eliminazione checklist:',
          deleteError,
        )

        if (deletedItem) {
          setItems((currentItems) => [
            ...currentItems,
            deletedItem,
          ])
        }

        setError(
          'Impossibile eliminare la voce.',
        )
      })
  }

  function clearCompleted() {
    if (!tripId) {
      return
    }

    const completedItems =
      items.filter(
        (item) => item.completed,
      )

    if (completedItems.length === 0) {
      return
    }

    const completedIds =
      completedItems.map(
        (item) => item.id,
      )

    setItems((currentItems) =>
      currentItems.filter(
        (item) => !item.completed,
      ),
    )

    void supabase
      .from('checklist_items')
      .delete()
      .in('id', completedIds)
      .then(({ error: deleteError }) => {
        if (!deleteError) {
          setError(null)
          return
        }

        console.error(
          'Errore pulizia checklist:',
          deleteError,
        )

        void loadItems()

        setError(
          'Impossibile eliminare le voci completate.',
        )
      })
  }

  function addDefaultItems() {
    if (!tripId || !userId) {
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

    const existingLabels = new Set(
      items.map((item) =>
        item.label
          .trim()
          .toLocaleLowerCase('it-IT'),
      ),
    )

    const newItems = defaultLabels
      .filter(
        (label) =>
          !existingLabels.has(
            label.toLocaleLowerCase(
              'it-IT',
            ),
          ),
      )
      .map<ChecklistItem>((label) => ({
        id: createChecklistId(),
        tripId,
        label,
        completed: false,
        createdAt:
          new Date().toISOString(),
      }))

    if (newItems.length === 0) {
      return
    }

    setItems((currentItems) => [
      ...currentItems,
      ...newItems,
    ])

    void supabase
      .from('checklist_items')
      .insert(
        newItems.map((item) => ({
          id: item.id,
          trip_id: item.tripId,
          created_by: userId,
          label: item.label,
          completed: false,
          created_at: item.createdAt,
        })),
      )
      .then(({ error: insertError }) => {
        if (!insertError) {
          setError(null)
          return
        }

        console.error(
          'Errore aggiunta elementi predefiniti:',
          insertError,
        )

        void loadItems()

        setError(
          'Impossibile aggiungere la checklist predefinita.',
        )
      })
  }

  return {
    items: tripItems,
    completedCount,
    totalCount,
    progress,
    loading,
    error,
    addItem,
    toggleItem,
    deleteItem,
    clearCompleted,
    addDefaultItems,
    reload: loadItems,
  }
}