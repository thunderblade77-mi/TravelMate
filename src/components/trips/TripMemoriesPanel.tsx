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

function placeKey(activity: Activity) {
  return activity.id
}

export default function TripMemoriesPanel({ trip }: TripMemoriesPanelProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [open, setOpen] = useState(false)

  async function reload() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return
    setUserId(user.id)

    const [activitiesResult, ratingsResult, visitsResult] = await Promise.all([
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
    ])

    if (!activitiesResult.error) setActivities((activitiesResult.data ?? []) as Activity[])
    if (!ratingsResult.error) setRatings((ratingsResult.data ?? []) as Rating[])
    if (!visitsResult.error) setVisits((visitsResult.data ?? []) as Visit[])
  }

  useEffect(() => {
    void reload()
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

  const storyItems = visits.length > 0
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
      }))
    : activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        detail: activity.location,
        date: activity.day_id,
        badge: 'Roadbook',
      }))

  return (
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-600">Ricordi & rating</p>
          <h2 className="mt-1 text-xl font-bold">La classifica del viaggio</h2>
          <p className="mt-1 text-sm text-slate-500">
            Valuta i luoghi da 1 a 10 e costruisci il racconto finale.
          </p>
        </div>
        <span className="text-2xl">{open ? '⌃' : '⭐'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 pt-4">
          <div>
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
                        {[2, 4, 6, 8, 10].map((score) => (
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
            <h3 className="font-bold">Classifica finale</h3>
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

          <div className="mt-6">
            <h3 className="font-bold">Memory Story</h3>
            <p className="mt-1 text-sm text-slate-500">
              TravelG ordina automaticamente i luoghi visitati. Le foto con geolocalizzazione verranno agganciate nella fase mobile avanzata.
            </p>

            {storyItems.length > 0 && (
              <div className="mt-3 space-y-2">
                {storyItems.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className="text-xl">📸</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold">{item.title}</p>
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
                          {item.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.date}{item.detail ? ` · ${item.detail}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
