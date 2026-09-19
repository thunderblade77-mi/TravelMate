import { useEffect, useMemo, useState } from 'react'

import { supabase } from '../../lib/supabase'
import type { Trip } from '../../types/travel'

type TripMemoriesPanelProps = {
  trip: Trip
}

type Activity = {
  id: string
  title: string
  location: string
  day_id: string
  completed: boolean
}

type Rating = {
  id: string
  user_id: string
  place_key: string
  place_name: string
  score: number
  note: string
}

type Visit = {
  id: string
  place_name: string
  location: string
  source: 'gps' | 'photo' | 'manual'
  visited_at: string
}

type MemoryItem = {
  id: string
  user_id: string
  title: string
  location: string
  photo_url: string | null
  taken_at: string
  favorite: boolean
}

function placeKey(activity: Activity) {
  return activity.id
}

export default function TripMemoriesPanel({ trip }: TripMemoriesPanelProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [open, setOpen] = useState(false)
  const [showMemoryForm, setShowMemoryForm] = useState(false)
  const [memoryTitle, setMemoryTitle] = useState('')
  const [memoryLocation, setMemoryLocation] = useState('')
  const [memoryDate, setMemoryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [savingMemory, setSavingMemory] = useState(false)
  const [memoryError, setMemoryError] = useState<string | null>(null)
  const [memoryPhoto, setMemoryPhoto] = useState<File | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  async function reload() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return
    setUserId(user.id)

    const [activitiesResult, ratingsResult, visitsResult, memoriesResult] = await Promise.all([
      supabase
        .from('roadbook_activities')
        .select('id,title,location,day_id,completed')
        .eq('trip_id', trip.id)
        .eq('completed', true)
        .order('day_id', { ascending: true }),
      supabase
        .from('place_ratings')
        .select('id,user_id,place_key,place_name,score,note')
        .eq('trip_id', trip.id),
      supabase
        .from('place_visits')
        .select('id,place_name,location,source,visited_at')
        .eq('trip_id', trip.id)
        .order('visited_at', { ascending: true }),
      supabase
        .from('memory_items')
        .select('id,user_id,title,location,photo_url,taken_at,favorite')
        .eq('trip_id', trip.id)
        .order('taken_at', { ascending: true }),
    ])

    if (!activitiesResult.error) setActivities((activitiesResult.data ?? []) as Activity[])
    if (!ratingsResult.error) setRatings((ratingsResult.data ?? []) as Rating[])
    if (!visitsResult.error) setVisits((visitsResult.data ?? []) as Visit[])
    if (!memoriesResult.error) {
      const nextMemories = (memoriesResult.data ?? []) as MemoryItem[]
      setMemories(nextMemories)

      const signedEntries = await Promise.all(
        nextMemories
          .filter((memory) => memory.photo_url)
          .map(async (memory) => {
            const { data, error } = await supabase.storage
              .from('travel-attachments')
              .createSignedUrl(memory.photo_url!, 60 * 60)

            return [memory.id, error ? '' : data.signedUrl] as const
          }),
      )

      setPhotoUrls(Object.fromEntries(signedEntries.filter(([, url]) => url)))
    }
  }

  useEffect(() => {
    void reload()

    const channel = supabase
      .channel(`travelg-memories-${trip.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memory_items', filter: `trip_id=eq.${trip.id}` },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'place_ratings', filter: `trip_id=eq.${trip.id}` },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'place_visits', filter: `trip_id=eq.${trip.id}` },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'roadbook_activities', filter: `trip_id=eq.${trip.id}` },
        () => void reload(),
      )
      .subscribe()

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }

    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      void supabase.removeChannel(channel)
    }
  }, [trip.id])

  const myRatings = useMemo(
    () => new Map(ratings.filter((rating) => rating.user_id === userId).map((rating) => [rating.place_key, rating])),
    [ratings, userId],
  )

  const ranking = useMemo(() => {
    const grouped = new Map<string, { name: string; total: number; count: number }>()

    ratings.forEach((rating) => {
      const current = grouped.get(rating.place_key) ?? {
        name: rating.place_name,
        total: 0,
        count: 0,
      }
      current.total += rating.score
      current.count += 1
      grouped.set(rating.place_key, current)
    })

    return Array.from(grouped.entries())
      .map(([key, item]) => ({
        key,
        name: item.name,
        average: item.total / item.count,
        votes: item.count,
      }))
      .sort((a, b) => b.average - a.average)
  }, [ratings])

  async function rate(activity: Activity, score: number) {
    if (!userId) return

    const key = placeKey(activity)
    const existing = myRatings.get(key)

    if (existing) {
      await supabase
        .from('place_ratings')
        .update({ score, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('place_ratings').insert({
        trip_id: trip.id,
        user_id: userId,
        place_key: key,
        place_name: activity.title,
        score,
      })
    }

    await reload()
  }

  async function addMemory() {
    const title = memoryTitle.trim()
    if (!userId || !title || !memoryDate) return

    setSavingMemory(true)
    setMemoryError(null)

    let photoPath: string | null = null

    if (memoryPhoto) {
      if (!memoryPhoto.type.startsWith('image/')) {
        setMemoryError('Puoi allegare solo una foto.')
        setSavingMemory(false)
        return
      }

      if (memoryPhoto.size > 6 * 1024 * 1024) {
        setMemoryError('Per ora usa una foto più piccola di 6 MB.')
        setSavingMemory(false)
        return
      }

      const extension = memoryPhoto.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      photoPath = `${trip.id}/memories/${userId}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('travel-attachments')
        .upload(photoPath, memoryPhoto, {
          cacheControl: '3600',
          contentType: memoryPhoto.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Errore upload foto ricordo:', uploadError)
        setMemoryError('Non sono riuscita a caricare la foto. Riprova.')
        setSavingMemory(false)
        return
      }
    }

    const { error } = await supabase.from('memory_items').insert({
      trip_id: trip.id,
      user_id: userId,
      title,
      location: memoryLocation.trim(),
      photo_url: photoPath,
      taken_at: `${memoryDate}T12:00:00`,
      favorite: false,
    })

    if (error) {
      if (photoPath) {
        await supabase.storage.from('travel-attachments').remove([photoPath])
      }
      console.error('Errore creazione ricordo:', error)
      setMemoryError('Non sono riuscita a salvare il ricordo. Riprova.')
    } else {
      setMemoryTitle('')
      setMemoryLocation('')
      setMemoryPhoto(null)
      setShowMemoryForm(false)
      await reload()
    }

    setSavingMemory(false)
  }

  async function toggleFavorite(memory: MemoryItem) {
    if (memory.user_id !== userId) return

    const { error } = await supabase
      .from('memory_items')
      .update({ favorite: !memory.favorite })
      .eq('id', memory.id)

    if (!error) await reload()
  }

  async function removeMemory(memory: MemoryItem) {
    if (memory.user_id !== userId) return
    if (!window.confirm(`Eliminare il ricordo “${memory.title}”?`)) return

    const { error } = await supabase.from('memory_items').delete().eq('id', memory.id)
    if (!error) {
      if (memory.photo_url) {
        const { error: storageError } = await supabase.storage
          .from('travel-attachments')
          .remove([memory.photo_url])
        if (storageError) console.error('Errore eliminazione foto ricordo:', storageError)
      }
      await reload()
    }
  }

  const storyItems = memories.length > 0
    ? memories.map((memory) => ({
        id: memory.id,
        title: memory.title,
        detail: memory.location,
        date: memory.taken_at.slice(0, 10),
        badge: memory.photo_url ? 'Foto' : 'Ricordo',
        favorite: memory.favorite,
        memory,
      }))
    : visits.length > 0
      ? visits.map((visit) => ({
          id: visit.id,
          title: visit.place_name,
          detail: visit.location,
          date: visit.visited_at.slice(0, 10),
          badge:
            visit.source === 'gps'
              ? 'GPS'
              : visit.source === 'photo'
                ? 'Foto'
                : 'Manuale',
          favorite: false,
          memory: null,
        }))
      : activities.map((activity) => ({
          id: activity.id,
          title: activity.title,
          detail: activity.location,
          date: activity.day_id,
          badge: 'Roadbook',
          favorite: false,
          memory: null,
        }))

  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/60 p-5 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Ricordi & rating</p>
          <h2 className="mt-1 text-xl font-bold">Il diario del viaggio</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ricordi condivisi, classifica dei luoghi e racconto finale.
          </p>
        </div>
        <span className="text-2xl">{open ? '⌃' : '📸'}</span>
      </button>

      {open && (
        <div className="border-t border-amber-100 p-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Memory Story</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tutto il gruppo vede lo stesso diario, sincronizzato in tempo reale.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMemoryForm((value) => !value)}
              className="shrink-0 rounded-2xl bg-amber-500 px-3 py-2 text-sm font-bold text-white shadow-md shadow-amber-100 active:scale-95"
            >
              + Ricordo
            </button>
          </div>

          {showMemoryForm && (
            <div className="mt-4 space-y-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
              <input
                value={memoryTitle}
                onChange={(event) => setMemoryTitle(event.target.value)}
                placeholder="Es. Tramonto a Cabo da Roca"
                className="w-full rounded-xl border border-white bg-white p-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-amber-100"
              />
              <input
                value={memoryLocation}
                onChange={(event) => setMemoryLocation(event.target.value)}
                placeholder="Luogo (facoltativo)"
                className="w-full rounded-xl border border-white bg-white p-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-amber-100"
              />
              <label className="block rounded-xl border border-dashed border-amber-300 bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">
                <span className="block">📷 Aggiungi una foto</span>
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  JPG, PNG o WebP · massimo 6 MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setMemoryPhoto(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:font-bold file:text-amber-800"
                />
                {memoryPhoto && (
                  <span className="mt-2 block truncate text-xs font-medium text-emerald-700">
                    ✓ {memoryPhoto.name}
                  </span>
                )}
              </label>
              <input
                type="date"
                min={trip.startDate}
                max={trip.endDate}
                value={memoryDate}
                onChange={(event) => setMemoryDate(event.target.value)}
                className="w-full rounded-xl border border-white bg-white p-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-amber-100"
              />
              <button
                type="button"
                disabled={savingMemory || !memoryTitle.trim()}
                onClick={() => void addMemory()}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-amber-100 disabled:opacity-50"
              >
                {savingMemory ? 'Salvataggio…' : 'Salva nel diario'}
              </button>
            </div>
          )}

          {memoryError && (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {memoryError}
            </p>
          )}

          {storyItems.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Il diario è vuoto. Aggiungi il primo ricordo del viaggio.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {storyItems.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="text-xl">{item.favorite ? '⭐' : '📸'}</span>
                  <div className="min-w-0 flex-1">
                    {item.memory?.photo_url && photoUrls[item.id] && (
                      <img
                        src={photoUrls[item.id]}
                        alt=""
                        loading="lazy"
                        className="mb-3 h-44 w-full rounded-2xl object-cover shadow-sm"
                      />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.date}{item.detail ? ` · ${item.detail}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
                        {item.badge}
                      </span>
                    </div>

                    {item.memory?.user_id === userId && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void toggleFavorite(item.memory!)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm"
                        >
                          {item.favorite ? '★ Preferito' : '☆ Preferito'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeMemory(item.memory!)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 shadow-sm"
                        >
                          Elimina
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-7 border-t border-slate-100 pt-5">
            <h3 className="font-bold">Valuta le tappe completate</h3>
            {activities.length === 0 ? (
              <p className="mt-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Completa una tappa nel Roadbook per poterla valutare.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {activities.map((activity) => {
                  const selected = myRatings.get(placeKey(activity))?.score
                  return (
                    <article key={activity.id} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{activity.title}</p>
                          {activity.location && (
                            <p className="mt-0.5 truncate text-xs text-slate-500">📍 {activity.location}</p>
                          )}
                        </div>
                        {selected && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                            {selected}/10
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => void rate(activity, score)}
                            className={`rounded-lg px-2 py-2 text-xs font-bold ${
                              selected === score
                                ? 'bg-amber-500 text-white'
                                : 'bg-white text-slate-600 shadow-sm'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="font-bold">Classifica del gruppo</h3>
            {ranking.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Le valutazioni del gruppo appariranno qui.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {ranking.map((item, index) => (
                  <div key={item.key} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-800">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.votes} valutazioni</p>
                    </div>
                    <strong className="text-amber-600">{item.average.toFixed(1)}/10</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-5 rounded-2xl bg-blue-50 p-3 text-xs font-medium leading-5 text-blue-700">
            Le foto del diario sono private al gruppo e salvate nel cloud. La geolocalizzazione automatica verrà collegata al layer nativo iOS e Android.
          </p>
        </div>
      )}
    </section>
  )
}
