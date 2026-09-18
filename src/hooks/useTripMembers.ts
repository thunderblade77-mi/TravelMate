import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../lib/supabase'
import { loadActiveTripId } from '../services/tripStorage'
import type { TripMemberOption } from '../types/tripMember'

export function useTripMembers(tripId?: string) {
  const resolvedTripId = tripId ?? loadActiveTripId() ?? undefined
  const [members, setMembers] = useState<TripMemberOption[]>([])
  const [loading, setLoading] = useState(Boolean(resolvedTripId))
  const [error, setError] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    if (!resolvedTripId) {
      setMembers([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)

    const { data: memberRows, error: membersError } = await supabase
      .from('trip_members')
      .select('user_id,role,joined_at,family_name')
      .eq('trip_id', resolvedTripId)
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('Errore caricamento partecipanti:', membersError)
      setError('Impossibile sincronizzare i partecipanti.')
      setLoading(false)
      return
    }

    const ids = (memberRows ?? []).map((row) => row.user_id)

    if (ids.length === 0) {
      setMembers([])
      setError(null)
      setLoading(false)
      return
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id,display_name')
      .in('id', ids)

    if (profilesError) {
      console.error('Errore caricamento profili partecipanti:', profilesError)
    }

    const names = new Map(
      (profiles ?? []).map((profile) => [
        profile.id,
        profile.display_name?.trim() || 'Viaggiatore',
      ]),
    )

    setMembers(
      (memberRows ?? []).map((row) => ({
        id: row.user_id,
        name: names.get(row.user_id) ?? 'Viaggiatore',
        role: row.role,
        familyName: row.family_name?.trim() || undefined,
      })),
    )
    setError(null)
    setLoading(false)
  }, [resolvedTripId])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  useEffect(() => {
    if (!resolvedTripId) return

    const channel = supabase
      .channel(`travelg-members-${resolvedTripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_members',
          filter: `trip_id=eq.${resolvedTripId}`,
        },
        () => {
          void loadMembers()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          void loadMembers()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [resolvedTripId, loadMembers])

  return members
}
