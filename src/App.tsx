import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import CreateTripPage from './components/create-trip/CreateTripPage'
import HomePage from './components/home/HomePage'
import MapPage from './components/map/MapPage'
import ProfilePage from './components/profile/ProfilePage'
import RoadbookPage from './components/roadbook/RoadbookPage'
import TripsPage from './components/trips/TripsPage'

import type { Trip } from './types/travel'

const TRIPS_STORAGE_KEY = 'travelmate-trips'
const ACTIVE_TRIP_STORAGE_KEY = 'travelmate-active-trip-id'

function loadTrips(): Trip[] {
  try {
    const savedTrips = localStorage.getItem(TRIPS_STORAGE_KEY)

    if (!savedTrips) {
      return []
    }

    const parsedTrips: unknown = JSON.parse(savedTrips)

    return Array.isArray(parsedTrips)
      ? (parsedTrips as Trip[])
      : []
  } catch {
    return []
  }
}

function loadActiveTripId(): string | null {
  try {
    return localStorage.getItem(
      ACTIVE_TRIP_STORAGE_KEY,
    )
  } catch {
    return null
  }
}

function formatDate(date: string): string {
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [trips, setTrips] = useState<Trip[]>(loadTrips)

  const [activeTripId, setActiveTripId] = useState<
    string | null
  >(loadActiveTripId)

  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [budget, setBudget] = useState('')
  const [transport, setTransport] = useState('Auto')

  useEffect(() => {
    try {
      localStorage.setItem(
        TRIPS_STORAGE_KEY,
        JSON.stringify(trips),
      )
    } catch {
      // L'app continua a funzionare anche senza localStorage.
    }
  }, [trips])

  useEffect(() => {
    try {
      if (activeTripId) {
        localStorage.setItem(
          ACTIVE_TRIP_STORAGE_KEY,
          activeTripId,
        )
      } else {
        localStorage.removeItem(
          ACTIVE_TRIP_STORAGE_KEY,
        )
      }
    } catch {
      // L'app continua a funzionare anche senza localStorage.
    }
  }, [activeTripId])

  useEffect(() => {
    if (trips.length === 0) {
      if (activeTripId !== null) {
        setActiveTripId(null)
      }

      return
    }

    const activeTripExists = trips.some(
      (trip) => trip.id === activeTripId,
    )

    if (!activeTripExists) {
      setActiveTripId(trips[0].id)
    }
  }, [trips, activeTripId])

  const activeTrip =
    trips.find((trip) => trip.id === activeTripId) ??
    trips[0] ??
    null

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

  function createTrip(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const cleanDestination = destination.trim()

    if (!cleanDestination || !startDate || !endDate) {
      return
    }

    if (endDate < startDate) {
      return
    }

    const newTrip: Trip = {
      id: crypto.randomUUID(),
      destination: cleanDestination,
      startDate,
      endDate,
      travelers: Math.max(1, travelers),
      budget: Math.max(0, Number(budget) || 0),
      transport,
    }

    setTrips((currentTrips) => [
      newTrip,
      ...currentTrips,
    ])

    setActiveTripId(newTrip.id)
    resetTripForm()
    navigate('/')
  }

  function selectTrip(tripId: string) {
    setActiveTripId(tripId)
    navigate('/')
  }

  const isHomeRoute = location.pathname === '/'

  const isTripsRoute =
    location.pathname === '/trips' ||
    location.pathname === '/trips/new'

  const isMapRoute = location.pathname === '/map'

  const isProfileRoute =
    location.pathname === '/profile'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-50">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-left"
            >
              <p className="text-xl font-bold tracking-tight">
                TravelMate
              </p>

              <p className="text-xs text-slate-500">
                Il tuo viaggio, tutto in un posto
              </p>
            </button>

            <button
              type="button"
              onClick={openCreateTripPage}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-2xl font-light text-white shadow-sm transition active:scale-95"
              aria-label="Crea un nuovo viaggio"
            >
              +
            </button>
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
                  onOpenMap={() => navigate('/map')}
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
                  onDestinationChange={setDestination}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onTravelersChange={setTravelers}
                  onBudgetChange={setBudget}
                  onTransportChange={setTransport}
                  onBack={() => navigate('/')}
                  onSubmit={createTrip}
                />
              }
            />

            <Route
              path="/trips"
              element={
                <TripsPage
                  trips={trips}
                  activeTrip={activeTrip}
                  onCreateTrip={openCreateTripPage}
                  onSelectTrip={selectTrip}
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
                />
              }
            />

            <Route
              path="/map"
              element={<MapPage />}
            />

            <Route
              path="/profile"
              element={<ProfilePage trips={trips} />}
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isHomeRoute
                ? 'text-blue-600'
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
                ? 'text-blue-600'
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
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">📍</span>
            Mappa
          </button>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isProfileRoute
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">👤</span>
            Profilo
          </button>
        </nav>
      </div>
    </div>
  )
}