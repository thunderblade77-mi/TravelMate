import { useEffect, useMemo, useState } from 'react'

import { supabase } from '../../lib/supabase'
import type { Trip } from '../../types/travel'
import AppIcon from '../ui/AppIcon'

type TripGroupPanelProps = {
  trip: Trip
  onShareTrip?: (trip: Trip) => void
}

type GroupMessage = {
  id: string
  user_id: string
  author_name: string
  message: string
  created_at: string
}

type Poll = {
  id: string
  created_by: string
  question: string
  options: string[]
  votes: Record<string, string[]>
  selected_option: string | null
  scheduled_day_id: string | null
  roadbook_activity_id: string | null
  created_at: string
}

type GroupMember = {
  userId: string
  role: string
  joinedAt: string
  displayName: string
}

type PollPlan = {
  option: string
  dayId: string
  time: string
}

function safeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function safeVotes(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, voters]) => [
      key,
      Array.isArray(voters)
        ? voters.filter((voter): voter is string => typeof voter === 'string')
        : [],
    ]),
  )
}

function createTripDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return []
  }

  const days: { id: string; label: string }[] = []
  const current = new Date(start)
  let index = 1

  while (current <= end) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    const day = String(current.getDate()).padStart(2, '0')
    const id = `${year}-${month}-${day}`

    days.push({
      id,
      label: `Giorno ${index} · ${new Intl.DateTimeFormat('it-IT', {
        day: 'numeric',
        month: 'short',
      }).format(current)}`,
    })

    current.setDate(current.getDate() + 1)
    index += 1
  }

  return days
}

function getLeadingOption(poll: Poll): string {
  return [...poll.options].sort(
    (first, second) =>
      (poll.votes[second]?.length ?? 0) - (poll.votes[first]?.length ?? 0),
  )[0] ?? ''
}

export default function TripGroupPanel({ trip, onShareTrip }: TripGroupPanelProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Viaggiatore')
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [message, setMessage] = useState('')
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState('')
  const [showPollForm, setShowPollForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [planningPollId, setPlanningPollId] = useState<string | null>(null)
  const [pollPlans, setPollPlans] = useState<Record<string, PollPlan>>({})
  const [planningError, setPlanningError] = useState<string | null>(null)

  const tripDays = useMemo(
    () => createTripDays(trip.startDate, trip.endDate),
    [trip.startDate, trip.endDate],
  )

  async function reload() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)
    setUserName(
      user.user_metadata.full_name ??
        user.user_metadata.name ??
        user.email ??
        'Viaggiatore',
    )

    const [messagesResult, pollsResult, membersResult] = await Promise.all([
      supabase
        .from('trip_messages')
        .select('id,user_id,author_name,message,created_at')
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: true })
        .limit(80),
      supabase
        .from('trip_polls')
        .select(
          'id,created_by,question,options,votes,selected_option,scheduled_day_id,roadbook_activity_id,created_at',
        )
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('trip_members')
        .select('user_id,role,joined_at')
        .eq('trip_id', trip.id)
        .order('joined_at', { ascending: true }),
    ])

    if (!messagesResult.error) {
      setMessages((messagesResult.data ?? []) as GroupMessage[])
    }

    if (!pollsResult.error) {
      setPolls(
        (pollsResult.data ?? []).map((row) => ({
          id: row.id,
          created_by: row.created_by,
          question: row.question,
          options: safeOptions(row.options),
          votes: safeVotes(row.votes),
          selected_option: row.selected_option ?? null,
          scheduled_day_id: row.scheduled_day_id ?? null,
          roadbook_activity_id: row.roadbook_activity_id ?? null,
          created_at: row.created_at,
        })),
      )
    }

    if (!membersResult.error) {
      const memberRows = membersResult.data ?? []
      const ids = memberRows.map((row) => row.user_id)

      let names = new Map<string, string>()

      if (ids.length > 0) {
        const profilesResult = await supabase
          .from('profiles')
          .select('id,display_name')
          .in('id', ids)

        if (!profilesResult.error) {
          names = new Map(
            (profilesResult.data ?? []).map((profile) => [
              profile.id,
              profile.display_name?.trim() || 'Viaggiatore',
            ]),
          )
        }
      }

      setMembers(
        memberRows.map((row) => ({
          userId: row.user_id,
          role: row.role,
          joinedAt: row.joined_at,
          displayName:
            names.get(row.user_id) ??
            (row.user_id === user.id ? userName : 'Viaggiatore'),
        })),
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    void reload()

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        void reload()
      }
    }

    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    const channel = supabase
      .channel(`travelg-group-${trip.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_messages', filter: `trip_id=eq.${trip.id}` },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_polls', filter: `trip_id=eq.${trip.id}` },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${trip.id}` },
        () => void reload(),
      )
      .subscribe()

    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      void supabase.removeChannel(channel)
    }
  }, [trip.id])

  const memberLabel = useMemo(() => {
    const count = members.length || trip.travelers
    return `${count} ${count === 1 ? 'viaggiatore' : 'viaggiatori'}`
  }, [members.length, trip.travelers])

  function getPollPlan(poll: Poll): PollPlan {
    return pollPlans[poll.id] ?? {
      option: getLeadingOption(poll),
      dayId: tripDays[0]?.id ?? trip.startDate,
      time: '09:00',
    }
  }

  function updatePollPlan(poll: Poll, patch: Partial<PollPlan>) {
    const current = getPollPlan(poll)
    setPollPlans((plans) => ({
      ...plans,
      [poll.id]: {
        ...current,
        ...patch,
      },
    }))
  }

  async function sendMessage() {
    const clean = message.trim()
    if (!clean || !userId) return

    const { error } = await supabase.from('trip_messages').insert({
      trip_id: trip.id,
      user_id: userId,
      author_name: userName,
      message: clean,
    })

    if (!error) {
      setMessage('')
      await reload()
    }
  }

  async function createPoll() {
    if (!userId) return

    const question = pollQuestion.trim()
    const options = pollOptions
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean)
      .slice(0, 8)

    if (!question || options.length < 2) return

    const votes = Object.fromEntries(options.map((option) => [option, []]))
    const { error } = await supabase.from('trip_polls').insert({
      trip_id: trip.id,
      created_by: userId,
      question,
      options,
      votes,
    })

    if (!error) {
      setPollQuestion('')
      setPollOptions('')
      setShowPollForm(false)
      await reload()
    }
  }

  async function vote(poll: Poll, option: string) {
    if (!userId || poll.roadbook_activity_id) return

    const nextVotes: Record<string, string[]> = {}
    poll.options.forEach((pollOption) => {
      nextVotes[pollOption] = (poll.votes[pollOption] ?? []).filter(
        (voter) => voter !== userId,
      )
    })
    nextVotes[option] = [...(nextVotes[option] ?? []), userId]

    const { error } = await supabase
      .from('trip_polls')
      .update({ votes: nextVotes })
      .eq('id', poll.id)

    if (!error) await reload()
  }

  async function addPollChoiceToRoadbook(poll: Poll) {
    if (!userId || poll.roadbook_activity_id) return

    const plan = getPollPlan(poll)
    if (!plan.option || !plan.dayId) return

    setPlanningPollId(poll.id)
    setPlanningError(null)

    try {
      const { data: dayActivities, error: dayActivitiesError } = await supabase
        .from('roadbook_activities')
        .select('activity_order')
        .eq('trip_id', trip.id)
        .eq('day_id', plan.dayId)

      if (dayActivitiesError) throw dayActivitiesError

      const nextOrder =
        (dayActivities ?? []).reduce(
          (highest, activity) =>
            Math.max(highest, Number(activity.activity_order) || 0),
          -1,
        ) + 1

      const activityId = crypto.randomUUID()
      const { error: insertError } = await supabase
        .from('roadbook_activities')
        .insert({
          id: activityId,
          trip_id: trip.id,
          created_by: userId,
          day_id: plan.dayId,
          activity_time: plan.time || '09:00',
          title: plan.option,
          location: '',
          notes: `Scelto dal gruppo · ${poll.question}`,
          category: 'altro',
          transport_type: null,
          activity_order: nextOrder,
          completed: false,
          map_point_id: null,
          created_at: new Date().toISOString(),
        })

      if (insertError) throw insertError

      const { error: pollError } = await supabase
        .from('trip_polls')
        .update({
          selected_option: plan.option,
          scheduled_day_id: plan.dayId,
          roadbook_activity_id: activityId,
        })
        .eq('id', poll.id)

      if (pollError) {
        const { error: rollbackError } = await supabase
          .from('roadbook_activities')
          .delete()
          .eq('id', activityId)

        if (rollbackError) {
          console.error('Errore rollback attività da sondaggio:', rollbackError)
        }
        throw pollError
      }

      await supabase.from('trip_messages').insert({
        trip_id: trip.id,
        user_id: userId,
        author_name: 'TravelG',
        message: `✓ “${plan.option}” è stato aggiunto al Roadbook dal sondaggio “${poll.question}”.`,
      })

      await reload()
    } catch (error) {
      console.error('Errore pianificazione sondaggio:', error)
      setPlanningError('Non sono riuscita ad aggiungere la scelta al Roadbook. Riprova.')
    } finally {
      setPlanningPollId(null)
    }
  }

  return (
    <section className="mt-6 space-y-5">
      <article className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-5 text-white shadow-xl shadow-blue-200/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
              Gruppo viaggio
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Organizziamoci insieme</h2>
            <p className="mt-2 text-sm text-blue-100">{memberLabel} · chat, sondaggi e Roadbook condivisi</p>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur">
            <AppIcon name="users" className="h-7 w-7" strokeWidth={1.7} />
          </span>
        </div>

        {onShareTrip && (
          <button
            type="button"
            onClick={() => onShareTrip(trip)}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 text-sm font-bold text-blue-700 shadow-lg shadow-blue-950/10 transition active:scale-95"
          >
            <AppIcon name="users" className="h-4 w-4" />
            Invita con codice
          </button>
        )}
      </article>

      <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-200/55 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
            <AppIcon name="users" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Partecipanti reali</p>
            <h3 className="mt-0.5 text-lg font-bold">Chi è nel viaggio</h3>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {members.length === 0 ? (
            <p className="text-sm text-slate-500">I partecipanti compariranno qui dopo aver accettato l’invito.</p>
          ) : (
            members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-sm"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <AppIcon name="user" className="h-4 w-4" />
                </span>
                <div>
                  <p className="max-w-40 truncate text-sm font-bold text-slate-800">
                    {member.displayName}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {member.role === 'owner' ? 'Organizzatore' : 'Partecipante'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </article>

      <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-200/55 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <AppIcon name="check" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Sondaggi</p>
              <h3 className="mt-0.5 truncate text-lg font-bold">Decidete e pianificate</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPollForm((value) => !value)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition active:scale-95"
            aria-label="Nuovo sondaggio"
          >
            <AppIcon name="plus" className="h-5 w-5" />
          </button>
        </div>

        {showPollForm && (
          <div className="mt-4 space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
            <input
              value={pollQuestion}
              onChange={(event) => setPollQuestion(event.target.value)}
              placeholder="Es. Sintra o Cascais la mattina?"
              className="w-full rounded-xl border border-white bg-white/90 p-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-indigo-100"
            />
            <input
              value={pollOptions}
              onChange={(event) => setPollOptions(event.target.value)}
              placeholder="Opzioni separate da virgola"
              className="w-full rounded-xl border border-white bg-white/90 p-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => void createPoll()}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition active:scale-[0.99]"
            >
              Pubblica sondaggio
            </button>
          </div>
        )}

        {planningError && (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {planningError}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {polls.length === 0 ? (
            <p className="rounded-2xl bg-slate-50/90 p-4 text-sm text-slate-500">
              Nessun sondaggio ancora. Creane uno per scegliere tappe, ristoranti o attività.
            </p>
          ) : (
            polls.map((poll) => {
              const plan = getPollPlan(poll)

              return (
                <div key={poll.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold">{poll.question}</p>
                    {poll.roadbook_activity_id && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        Nel Roadbook
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {poll.options.map((option) => {
                      const count = poll.votes[option]?.length ?? 0
                      const selected = Boolean(userId && poll.votes[option]?.includes(userId))
                      const chosen = poll.selected_option === option

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={Boolean(poll.roadbook_activity_id)}
                          onClick={() => void vote(poll, option)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-default ${
                            chosen
                              ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800'
                              : selected
                                ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-blue-50 font-semibold text-indigo-700 shadow-sm'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span>{option}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{count}</span>
                        </button>
                      )
                    })}
                  </div>

                  {poll.roadbook_activity_id ? (
                    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm text-emerald-800">
                      <strong>{poll.selected_option}</strong>
                      <span className="block text-xs text-emerald-700">
                        Pianificato per {poll.scheduled_day_id}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/55 p-3">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-600">
                        Porta la decisione nel Roadbook
                      </p>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <select
                          value={plan.option}
                          onChange={(event) =>
                            updatePollPlan(poll, { option: event.target.value })
                          }
                          className="rounded-xl border border-white bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
                        >
                          {poll.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>

                        <select
                          value={plan.dayId}
                          onChange={(event) =>
                            updatePollPlan(poll, { dayId: event.target.value })
                          }
                          className="rounded-xl border border-white bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
                        >
                          {tripDays.map((day) => (
                            <option key={day.id} value={day.id}>{day.label}</option>
                          ))}
                        </select>

                        <input
                          type="time"
                          value={plan.time}
                          onChange={(event) =>
                            updatePollPlan(poll, { time: event.target.value })
                          }
                          className="rounded-xl border border-white bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={planningPollId !== null}
                        onClick={() => void addPollChoiceToRoadbook(poll)}
                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition active:scale-[0.99] disabled:opacity-50"
                      >
                        <AppIcon name="book" className="h-4 w-4" />
                        {planningPollId === poll.id
                          ? 'Aggiungo al Roadbook…'
                          : 'Aggiungi al Roadbook'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </article>

      <article className="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-lg shadow-slate-200/55 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <AppIcon name="users" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Chat</p>
            <h3 className="mt-0.5 text-lg font-bold">Messaggi del gruppo</h3>
          </div>
        </div>

        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-white/80 bg-slate-50/75 p-3 shadow-inner">
          {loading ? (
            <p className="text-sm text-slate-500">Caricamento…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500">Scrivi il primo messaggio del viaggio.</p>
          ) : (
            messages.map((item) => {
              const mine = item.user_id === userId
              return (
                <div
                  key={item.id}
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    mine
                      ? 'ml-auto bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-slate-700 shadow-sm'
                  }`}
                >
                  {!mine && (
                    <p className="mb-1 text-[11px] font-bold text-slate-500">{item.author_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{item.message}</p>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-3 flex gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-sm">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void sendMessage()
              }
            }}
            placeholder="Messaggio al gruppo…"
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 transition active:scale-95"
            aria-label="Invia messaggio"
          >
            <AppIcon name="navigation" className="h-5 w-5" />
          </button>
        </div>
      </article>
    </section>
  )
}
