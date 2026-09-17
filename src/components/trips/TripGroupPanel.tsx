import { useEffect, useMemo, useState } from 'react'

import { supabase } from '../../lib/supabase'
import type { Trip } from '../../types/travel'

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

export default function TripGroupPanel({
  trip,
  onShareTrip,
}: TripGroupPanelProps) {
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
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
        {
          event: '*',
          schema: 'public',
          table: 'trip_messages',
          filter: `trip_id=eq.${trip.id}`,
        },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_polls',
          filter: `trip_id=eq.${trip.id}`,
        },
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
      <article className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-5 text-white shadow-lg shadow-blue-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Gruppo viaggio
            </p>
            <h2 className="mt-1 text-xl font-bold">Organizziamoci insieme</h2>
            <p className="mt-2 text-sm text-blue-100">{memberLabel} · chat e sondaggi condivisi</p>
          </div>
          <span className="text-3xl">👥</span>
        </div>

        {onShareTrip && (
          <button
            type="button"
            onClick={() => onShareTrip(trip)}
            className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-700"
          >
            Invita con codice
          </button>
        )}
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Sondaggi</p>
            <h3 className="mt-1 text-lg font-bold">Decidete prima di partire</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowPollForm((value) => !value)}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
          >
            + Sondaggio
          </button>
        </div>

        {showPollForm && (
          <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-3">
            <input
              value={pollQuestion}
              onChange={(event) => setPollQuestion(event.target.value)}
              placeholder="Es. Sintra o Cascais la mattina?"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
            />
            <input
              value={pollOptions}
              onChange={(event) => setPollOptions(event.target.value)}
              placeholder="Opzioni separate da virgola"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
            />
            <button
              type="button"
              onClick={() => void createPoll()}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white"
            >
              Pubblica sondaggio
            </button>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {polls.length === 0 ? (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
              Nessun sondaggio ancora. Creane uno per scegliere tappe, ristoranti o attività.
            </p>
          ) : (
            polls.map((poll) => (
              <div key={poll.id} className="rounded-2xl border border-slate-200 p-4">
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
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50 font-semibold text-indigo-700'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span>{option}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Chat</p>
        <h3 className="mt-1 text-lg font-bold">Messaggi del gruppo</h3>

        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 p-3">
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
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? 'ml-auto bg-blue-600 text-white'
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

        <div className="mt-3 flex gap-2">
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
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3 text-sm"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            className="rounded-xl bg-blue-600 px-4 py-3 font-bold text-white"
          >
            ↑
          </button>
        </div>
      </article>
    </section>
  )
}
