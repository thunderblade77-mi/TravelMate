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

  const confidence = Math.max(0, Math.min(1, input.confidence ?? 1))
  const { data, error } = await supabase
    .from('place_visits')
    .insert({
      trip_id: input.tripId,
      user_id: user.id,
      activity_id: input.activityId,
      place_name: input.placeName.trim(),
      location: input.location?.trim() ?? '',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      source: input.source ?? 'manual',
      confidence,
    })
    .select('id')
    .single()

  if (!error) return data.id as string

  // Two devices can complete the same activity almost simultaneously.
  // The database unique index is authoritative, so recover the existing visit.
  if (error.code === '23505') {
    const { data: racedVisit, error: racedVisitError } = await supabase
      .from('place_visits')
      .select('id')
      .eq('user_id', user.id)
      .eq('activity_id', input.activityId)
      .single()

    if (racedVisitError) throw racedVisitError
    return racedVisit.id as string
  }

  throw error
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

  if (!Number.isInteger(input.score) || input.score < 1 || input.score > 10) {
    throw new Error('La valutazione deve essere compresa tra 1 e 10.')
  }

  const { data: existing, error: existingError } = await supabase
    .from('place_ratings')
    .select('id')
    .eq('user_id', user.id)
    .eq('activity_id', input.activityId)
    .maybeSingle()

  if (existingError) throw existingError

  const rating = {
    trip_id: input.tripId,
    user_id: user.id,
    activity_id: input.activityId,
    place_key: input.activityId,
    place_name: input.placeName.trim(),
    score: input.score,
    note: input.note?.trim() ?? '',
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase
      .from('place_ratings')
      .update(rating)
      .eq('id', existing.id)

    if (error) throw error
    return existing.id as string
  }

  const { data, error } = await supabase
    .from('place_ratings')
    .insert(rating)
    .select('id')
    .single()

  if (!error) return data.id as string

  if (error.code === '23505') {
    const { data: racedRating, error: racedRatingError } = await supabase
      .from('place_ratings')
      .select('id')
      .eq('user_id', user.id)
      .eq('activity_id', input.activityId)
      .single()

    if (racedRatingError) throw racedRatingError

    const { error: updateError } = await supabase
      .from('place_ratings')
      .update(rating)
      .eq('id', racedRating.id)

    if (updateError) throw updateError
    return racedRating.id as string
  }

  throw error
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
      title: input.title.trim(),
      location: input.location?.trim() ?? '',
      photo_url: input.photoPath ?? null,
      taken_at: input.takenAt ?? new Date().toISOString(),
      favorite: false,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}
