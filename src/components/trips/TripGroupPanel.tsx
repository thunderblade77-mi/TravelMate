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
  created_at: string
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

export default function TripGroupPanel({ trip, onShareTrip }: TripGroupPanelProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Viaggiatore')
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [message, setMessage] = useState('')
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState('')
  const [showPollForm, setShowPollForm] = useState(false)
  const [loading, setLoading] = useState(true)

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

    const [messagesResult, pollsResult] = await Promise.all([
      supabase
        .from('trip_messages')
        .select('id,user_id,author_name,message,created_at')
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: true })
        .limit(80),
      supabase
        .from('trip_polls')
        .select('id,created_by,question,options,votes,created_at')
        .eq('trip_id', trip.id)
        .order('created_at', { ascending: false })
        .limit(20),
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
          created_at: row.created_at,
        })),
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    void reload()

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
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [trip.id])

  const memberLabel = useMemo(
    () => `${trip.travelers} ${trip.travelers === 1 ? 'viaggiatore' : 'viaggiatori'}`,
    [trip.travelers],
  )

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
    if (!userId) return

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

  return (
    <section className="mt-6 space-y-5">
      <article className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-5 text-white shadow-xl shadow-blue-200/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
              Gruppo viaggio
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Organizziamoci insieme</h2>
            <p className="mt-2 text-sm text-blue-100">{memberLabel} · chat e sondaggi condivisi</p>
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <AppIcon name="check" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Sondaggi</p>
              <h3 className="mt-0.5 truncate text-lg font-bold">Decidete prima di partire</h3>
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

        <div className="mt-4 space-y-4">
          {polls.length === 0 ? (
            <p className="rounded-2xl bg-slate-50/90 p-4 text-sm text-slate-500">
              Nessun sondaggio ancora. Creane uno per scegliere tappe, ristoranti o attività.
            </p>
          ) : (
            polls.map((poll) => (
              <div key={poll.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
                <p className="font-bold">{poll.question}</p>
                <div className="mt-3 space-y-2">
                  {poll.options.map((option) => {
                    const count = poll.votes[option]?.length ?? 0
                    const selected = Boolean(userId && poll.votes[option]?.includes(userId))
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => void vote(poll, option)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                          selected
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
              </div>
            ))
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
