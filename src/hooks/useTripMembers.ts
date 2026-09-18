import { useEffect, useState } from 'react'

import { supabase } from '../lib/supabase'
import { loadActiveTripId } from '../services/tripStorage'
import type { TripMemberOption } from '../types/tripMember'

export function useTripMembers(tripId?: string) {
  const resolvedTripId = tripId ?? loadActiveTripId() ?? undefined
  const [members, setMembers] = useState<TripMemberOption[]>([])

  useEffect(() => {
    let active = true

    async function loadMembers() {
      if (!resolvedTripId) {
        setMembers([])
        return
      }

      const { data: memberRows, error } = await supabase
        .from('trip_members')
        .select('user_id,role,joined_at')
        .eq('trip_id', resolvedTripId)
        .order('joined_at', { ascending: true })

      if (error || !active) return

      const ids = (memberRows ?? []).map((row) => row.user_id)
      if (ids.length === 0) {
        setMembers([])
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,display_name')
        .in('id', ids)

      if (!active) return

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
        })),
      )
    }

    void loadMembers()
    return () => {
      active = false
    }
  }, [resolvedTripId])

  return members
}
