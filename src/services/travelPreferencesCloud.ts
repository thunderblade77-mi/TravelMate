import { supabase } from '../lib/supabase'
import type {
  TravelInterest,
  TravelPace,
  TravelPreferences,
} from '../types/travelIntelligence'
import {
  loadTravelPreferences,
  saveTravelPreferences,
} from './travelIntelligenceStorage'

type TravelPreferencesRow = {
  user_id: string
  interests: unknown
  pace: string
  avoid_crowds: boolean
  local_food: boolean
  hidden_gems: boolean
  updated_at: string
}

function isTravelInterest(value: unknown): value is TravelInterest {
  return [
    'arte',
    'monumenti',
    'storia',
    'cibo',
    'nightlife',
    'natura',
    'mare',
    'shopping',
    'famiglia',
    'avventura',
    'relax',
    'fotografia',
  ].includes(String(value))
}

function normalizePace(value: string): TravelPace {
  return value === 'slow' || value === 'intense'
    ? value
    : 'balanced'
}

function fromRow(row: TravelPreferencesRow): TravelPreferences {
  return {
    interests: Array.isArray(row.interests)
      ? row.interests.filter(isTravelInterest)
      : [],
    pace: normalizePace(row.pace),
    avoidCrowds: Boolean(row.avoid_crowds),
    localFood: Boolean(row.local_food),
    hiddenGems: Boolean(row.hidden_gems),
    updatedAt: row.updated_at,
  }
}

export async function loadCloudTravelPreferences(): Promise<TravelPreferences | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('travel_preferences')
    .select(
      'user_id,interests,pace,avoid_crowds,local_food,hidden_gems,updated_at',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return fromRow(data as TravelPreferencesRow)
}

export async function saveCloudTravelPreferences(
  preferences: Omit<TravelPreferences, 'updatedAt'>,
): Promise<TravelPreferences> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return saveTravelPreferences(preferences)
  }

  const updatedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('travel_preferences')
    .upsert(
      {
        user_id: user.id,
        interests: preferences.interests,
        pace: preferences.pace,
        avoid_crowds: preferences.avoidCrowds,
        local_food: preferences.localFood,
        hidden_gems: preferences.hiddenGems,
        updated_at: updatedAt,
      },
      { onConflict: 'user_id' },
    )
    .select(
      'user_id,interests,pace,avoid_crowds,local_food,hidden_gems,updated_at',
    )
    .single()

  if (error || !data) {
    throw error ?? new Error('Preferenze cloud non disponibili')
  }

  const synced = fromRow(data as TravelPreferencesRow)
  saveTravelPreferences({
    interests: synced.interests,
    pace: synced.pace,
    avoidCrowds: synced.avoidCrowds,
    localFood: synced.localFood,
    hiddenGems: synced.hiddenGems,
  })

  return synced
}

export async function loadSyncedTravelPreferences(): Promise<TravelPreferences> {
  const local = loadTravelPreferences()
  const cloud = await loadCloudTravelPreferences()

  if (!cloud) {
    const hasLocalChoices =
      local.interests.length > 0 ||
      local.updatedAt !== new Date(0).toISOString()

    if (hasLocalChoices) {
      try {
        return await saveCloudTravelPreferences({
          interests: local.interests,
          pace: local.pace,
          avoidCrowds: local.avoidCrowds,
          localFood: local.localFood,
          hiddenGems: local.hiddenGems,
        })
      } catch {
        return local
      }
    }

    return local
  }

  const cloudIsNewer =
    new Date(cloud.updatedAt).getTime() >=
    new Date(local.updatedAt).getTime()

  if (cloudIsNewer) {
    saveTravelPreferences({
      interests: cloud.interests,
      pace: cloud.pace,
      avoidCrowds: cloud.avoidCrowds,
      localFood: cloud.localFood,
      hiddenGems: cloud.hiddenGems,
    })
    return cloud
  }

  try {
    return await saveCloudTravelPreferences({
      interests: local.interests,
      pace: local.pace,
      avoidCrowds: local.avoidCrowds,
      localFood: local.localFood,
      hiddenGems: local.hiddenGems,
    })
  } catch {
    return local
  }
}
