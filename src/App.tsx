import {
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
import AssistantPage from './components/assistant/AssistantPage'
import { useTrips } from './hooks/useTrips'
import { geocodeDestination } from './services/geocoding'
import {
  formatCurrency,
  formatDate,
} from './utils/format'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    trips,
    activeTrip,
    createTrip,
    selectTrip,
  } = useTrips()

  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelers, setTravelers] = useState(1)
  const [budget, setBudget] = useState('')
  const [transport, setTransport] =
    useState('Auto')

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
                  onCreateTrip={openCreateTripPage}
                  onSelectTrip={handleSelectTrip}
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

        <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate('/assistant')}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isHomeRoute
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">
              🏠
            </span>
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
            <span className="text-xl">
              🧳
            </span>
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
            <span className="text-xl">
              📍
            </span>
            Mappa
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('/weather')
            }
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
              isWeatherRoute
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="text-xl">
              🌦️
            </span>
            Meteo
          </button>

<button
  type="button"
  onClick={() => navigate('/assistant')}
  className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
    isAssistantRoute
      ? 'text-blue-600'
      : 'text-slate-500 hover:text-slate-900'
  }`}
>
  <span className="text-xl">
    ✨
  </span>
  Assistente
</button>
        </nav>
      </div>
    </div>
  )
}