import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import type { Session } from '@supabase/supabase-js'

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import type { Trip } from './types/travel'
import AssistantPage from './components/assistant/AssistantPage'
import ChecklistPage from './components/checklist/ChecklistPage'
import CreateTripPage from './components/create-trip/CreateTripPage'
import DocumentsPage from './components/documents/DocumentsPage'
import ExpensesPage from './components/expenses/ExpensesPage'
import HomePage from './components/home/HomePage'
import MapPage from './components/map/MapPage'
import ProfilePage from './components/profile/ProfilePage'
import RoadbookPage from './components/roadbook/RoadbookPage'
import TripsPage from './components/trips/TripsPage'
import WeatherPage from './components/weather/WeatherPage'

import { useTrips } from './hooks/useTrips'
import { supabase } from './lib/supabase'
import { geocodeDestination } from './services/geocoding'

import {
  formatCurrency,
  formatDate,
} from './utils/format'

type OAuthProvider = 'github' | 'google'

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-3xl bg-blue-600 text-3xl text-white">
          ✈️
        </div>

        <p className="mt-5 font-semibold text-slate-700">
          Caricamento TravelG…
        </p>
      </div>
    </div>
  )
}

type LoginPageProps = {
  onLogin: (
    provider: OAuthProvider,
  ) => Promise<void>
  loadingProvider: OAuthProvider | null
  error: string | null
}

function LoginPage({
  onLogin,
  loadingProvider,
  error,
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-3xl text-white shadow-lg shadow-blue-200">
            ✈️
          </div>

          <p className="mt-7 text-sm font-semibold text-blue-600">
            TravelG Cloud
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Il viaggio condiviso, finalmente semplice.
          </h1>

          <p className="mt-4 leading-7 text-slate-500">
            Accedi per sincronizzare viaggi, Roadbook,
            prenotazioni e documenti con i tuoi compagni
            di viaggio.
          </p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => {
                void onLogin('github')
              }}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-5 py-4 font-bold text-white transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
            >
              <span className="text-xl">🐙</span>

              {loadingProvider === 'github'
                ? 'Apertura GitHub…'
                : 'Continua con GitHub'}
            </button>

            <button
              type="button"
              onClick={() => {
                void onLogin('google')
              }}
              disabled={loadingProvider !== null}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-4 font-bold text-slate-800 transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
            >
              <span className="text-xl">🌐</span>

              {loadingProvider === 'google'
                ? 'Apertura Google…'
                : 'Continua con Google'}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Accedendo, i dati cloud saranno protetti
            dalle regole di accesso del viaggio.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [session, setSession] =
    useState<Session | null>(null)

  const [authLoading, setAuthLoading] =
    useState(true)

  const [
    loadingProvider,
    setLoadingProvider,
  ] = useState<OAuthProvider | null>(null)

  const [authError, setAuthError] =
    useState<string | null>(null)

  const [isSigningOut, setIsSigningOut] =
    useState(false)

  const {
    trips,
    activeTrip,
    createTrip,
    selectTrip,
    removeTrip,
    reload: reloadTrips,
  } = useTrips()

  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [budget, setBudget] = useState('')

  const [transport, setTransport] =
    useState('Auto')

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession()

      if (!mounted) {
        return
      }

      if (error) {
        setAuthError(
          'Non è stato possibile verificare la sessione.',
        )
      }

      setSession(currentSession)
      setAuthLoading(false)
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) {
          return
        }

        setSession(nextSession)
        setAuthLoading(false)
        setLoadingProvider(null)
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogin(
    provider: OAuthProvider,
  ) {
    setLoadingProvider(provider)
    setAuthError(null)

    const { error } =
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })

    if (error) {
      setAuthError(error.message)
      setLoadingProvider(null)
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true)

    const { error } =
      await supabase.auth.signOut()

    if (error) {
      window.alert(
        `Logout non riuscito: ${error.message}`,
      )

      setIsSigningOut(false)
      return
    }

    navigate('/', {
      replace: true,
    })

    setIsSigningOut(false)
  }

  function resetTripForm() {
    setDestination('')
    setStartDate('')
    setEndDate('')
    setTravelers(1)
    setBudget('')
    setTransport('Auto')
  }

  function openCreateTripPage() {
    navigate('/trips/new')
  }

  function openMapPoint(mapPointId: string) {
    navigate('/map', {
      state: {
        mapPointId,
      },
    })
  }

  async function handleCreateTrip(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const cleanDestination = destination.trim()

    if (
      !cleanDestination ||
      !startDate ||
      !endDate
    ) {
      return
    }

    if (endDate < startDate) {
      return
    }

    const coordinates =
      await geocodeDestination(cleanDestination)

    createTrip({
      destination: cleanDestination,
      startDate,
      endDate,
      travelers,
      budget: Number(budget) || 0,
      transport,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
    })

    resetTripForm()
    navigate('/')
  }

 function handleSelectTrip(tripId: string) {
  selectTrip(tripId)
  navigate('/')
}
async function handleShareTrip(trip: Trip) {
  const { data, error } = await supabase
    .from('trips')
    .select('invite_code')
    .eq('id', trip.id)
    .single()

  if (error || !data?.invite_code) {
    window.alert(
      'Impossibile recuperare il codice invito.',
    )
    return
  }

  await navigator.clipboard.writeText(
    data.invite_code,
  )

  window.alert(
    `Codice copiato!\n\n${data.invite_code}`,
  )
}

async function handleJoinTrip() {
  const inviteCode = window.prompt(
    'Inserisci il codice invito del viaggio',
  )

  if (!inviteCode?.trim()) {
    return
  }

  const { data, error } = await supabase.rpc(
    'join_trip_by_code',
    {
      invitation_code: inviteCode.trim(),
    },
  )

  if (error) {
    window.alert(error.message)
    return
  }

  if (data) {
  await reloadTrips()
  selectTrip(data)
  navigate('/trips')

  window.alert(
    '🎉 Viaggio aggiunto con successo!',
  )
}
}

if (authLoading) {
  return <AuthLoadingScreen />
}

  if (!session) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loadingProvider={loadingProvider}
        error={authError}
      />
    )
  }

  const isHomeRoute = location.pathname === '/'

  const isTripsRoute =
    location.pathname === '/trips' ||
    location.pathname === '/trips/new'

  const isMapRoute =
    location.pathname === '/map'

  const isWeatherRoute =
    location.pathname === '/weather'

  const isAssistantRoute =
    location.pathname === '/assistant'

  const userName =
    session.user.user_metadata.full_name ??
    session.user.user_metadata.name ??
    session.user.email ??
    'Viaggiatore'

  const userAvatar =
    typeof session.user.user_metadata.avatar_url ===
    'string'
      ? session.user.user_metadata.avatar_url
      : null

  return (
    <div className="min-h-screen bg-[#f6f1e9] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f6f1e9]">
        <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[#fffdf9]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="min-w-0 text-left"
            >
              <p className="text-xl font-black tracking-tight text-slate-950">
                TravelG
              </p>

              <p className="truncate text-xs text-slate-500">
                {userName}
              </p>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg"
                aria-label="Apri profilo"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  '👤'
                )}
              </button>

              <button
                type="button"
                onClick={openCreateTripPage}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#c99a43] to-[#98701f] text-2xl font-light text-white shadow-sm transition active:scale-95"
                aria-label="Crea un nuovo viaggio"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleSignOut()
                }}
                disabled={isSigningOut}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-600 transition active:scale-95 disabled:cursor-wait disabled:opacity-50"
                aria-label="Esci da TravelG"
                title="Esci"
              >
                {isSigningOut ? '…' : '↪'}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 pb-28 pt-6">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  activeTrip={activeTrip}
                  onCreateTrip={openCreateTripPage}
                  onOpenRoadbook={() =>
                    navigate('/roadbook')
                  }
                  onOpenMap={() =>
                    navigate('/map')
                  }
                  onOpenChecklist={() =>
                    navigate('/checklist')
                  }
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
              }
            />

            <Route
              path="/trips/new"
              element={
                <CreateTripPage
                  destination={destination}
                  startDate={startDate}
                  endDate={endDate}
                  travelers={travelers}
                  budget={budget}
                  transport={transport}
                  onDestinationChange={
                    setDestination
                  }
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onTravelersChange={setTravelers}
                  onBudgetChange={setBudget}
                  onTransportChange={setTransport}
                  onBack={() => navigate('/')}
                  onSubmit={handleCreateTrip}
                />
              }
            />

            <Route
              path="/trips"
              element={
                <TripsPage
                  trips={trips}
                  activeTrip={activeTrip}
                  onJoinTrip={handleJoinTrip}
                  onCreateTrip={openCreateTripPage}
                  onSelectTrip={handleSelectTrip}
                  onShareTrip={handleShareTrip}
                  onRemoveTrip={removeTrip}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                />
              }
            />

            <Route
              path="/roadbook"
              element={
                <RoadbookPage
                  activeTrip={activeTrip}
                  onBack={() => navigate('/')}
                  onOpenMapPoint={openMapPoint}
                />
              }
            />

            <Route
              path="/map"
              element={
                <MapPage
                  activeTrip={activeTrip}
                />
              }
            />

            <Route
              path="/weather"
              element={
                <WeatherPage
                  activeTrip={activeTrip}
                />
              }
            />

            <Route
              path="/checklist"
              element={
                <ChecklistPage
                  activeTrip={activeTrip}
                />
              }
            />

            <Route
              path="/documents"
              element={
                <DocumentsPage
                  activeTrip={activeTrip}
                />
              }
            />

            <Route
              path="/expenses"
              element={
                <ExpensesPage
                  activeTrip={activeTrip}
                  formatCurrency={formatCurrency}
                />
              }
            />

            <Route
              path="/profile"
              element={
                <ProfilePage trips={trips} />
              }
            />

            <Route
              path="/assistant"
              element={
                <AssistantPage
                  activeTrip={activeTrip}
                />
              }
            />

            <Route
              path="*"
              element={
                <Navigate to="/" replace />
              }
            />
          </Routes>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-stone-200 bg-[#fffdf9]/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isHomeRoute
                ? 'text-[#a47724]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">🏠</span>
            Home
          </button>

          <button
            type="button"
            onClick={() => navigate('/trips')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isTripsRoute
                ? 'text-[#a47724]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">🧳</span>
            Viaggi
          </button>

          <button
            type="button"
            onClick={() => navigate('/map')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isMapRoute
                ? 'text-[#a47724]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">📍</span>
            Mappa
          </button>

          <button
            type="button"
            onClick={() => navigate('/weather')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isWeatherRoute
                ? 'text-[#a47724]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">🌦️</span>
            Meteo
          </button>

          <button
            type="button"
            onClick={() => navigate('/assistant')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isAssistantRoute
                ? 'text-[#a47724]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">✨</span>
            Assistente
          </button>
        </nav>
      </div>
    </div>
  )
}