import { supabase } from '../lib/supabase'

export type CompletedVisitInput = {
  tripId: string
  activityId: string
  placeName: string
  location?: string
  latitude?: number | null
  longitude?: number | null
  source?: 'gps' | 'photo' | 'manual'
  confidence?: number
}

export async function recordCompletedVisit(input: CompletedVisitInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessione non disponibile.')

  const { data: existing, error: existingError } = await supabase
    .from('place_visits')
    .select('id')
    .eq('user_id', user.id)
    .eq('activity_id', input.activityId)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing.id as string

  const { data, error } = await supabase
    .from('place_visits')
    .insert({
      trip_id: input.tripId,
      user_id: user.id,
      activity_id: input.activityId,
      place_name: input.placeName,
      location: input.location ?? '',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      source: input.source ?? 'manual',
      confidence: input.confidence ?? 1,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function saveActivityRating(input: {
  tripId: string
  activityId: string
  placeName: string
  score: number
  note?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessione non disponibile.')

  const payload = {
    trip_id: input.tripId,
    user_id: user.id,
    activity_id: input.activityId,
    place_key: input.activityId,
    place_name: input.placeName,
    score: input.score,
    note: input.note ?? '',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('place_ratings')
    .upsert(payload, { onConflict: 'user_id,activity_id' })

  if (error) throw error
}

export async function createMemoryFromActivity(input: {
  tripId: string
  activityId: string
  visitId?: string | null
  title: string
  location?: string
  photoPath?: string | null
  takenAt?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessione non disponibile.')

  const { data, error } = await supabase
    .from('memory_items')
    .insert({
      trip_id: input.tripId,
      user_id: user.id,
      activity_id: input.activityId,
      visit_id: input.visitId ?? null,
      title: input.title,
      location: input.location ?? '',
      photo_url: input.photoPath ?? null,
      taken_at: input.takenAt ?? new Date().toISOString(),
      favorite: false,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}
