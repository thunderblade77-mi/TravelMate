import type { LatLngTuple } from 'leaflet'
import { useLocation } from 'react-router-dom'

import type { Trip } from '../../types/travel'
import AppIcon from '../ui/AppIcon'
import InteractiveMap from './InteractiveMap'

type MapPageProps = {
  activeTrip: Trip | null
}

type MapLocationState = {
  mapPointId?: string
}

export default function MapPage({
  activeTrip,
}: MapPageProps) {
  const location = useLocation()
  const navigationState = location.state as MapLocationState | null
  const selectedMapPointId = navigationState?.mapPointId ?? null

  const latitude = activeTrip?.latitude
  const longitude = activeTrip?.longitude
  const hasCoordinates =
    typeof latitude === 'number' && typeof longitude === 'number'

  const mapCenter: LatLngTuple | undefined = hasCoordinates
    ? [latitude, longitude]
    : undefined

  return (
    <section>
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-5 text-white shadow-[0_22px_55px_rgba(30,64,175,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-200">
              Esplora
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Mappa viaggio</h1>
            <p className="mt-2 text-sm leading-6 text-blue-100/80">
              {activeTrip
                ? selectedMapPointId
                  ? `Punto selezionato a ${activeTrip.destination}`
                  : `Luoghi, tappe e posizione live a ${activeTrip.destination}`
                : 'Seleziona un viaggio per iniziare a esplorare.'}
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <AppIcon name="map" className="h-6 w-6" />
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-blue-50">
          <span className="rounded-full bg-white/10 px-3 py-1.5">● Posizione live</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5">🏛️ Attrazioni</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5">🍽️ Ristoranti</span>
        </div>
      </div>

      <div className="mt-5">
        <InteractiveMap
          center={mapCenter}
          zoom={hasCoordinates ? 12 : 13}
          tripId={activeTrip?.id}
          selectedMapPointId={selectedMapPointId}
        />
      </div>

      {activeTrip && !hasCoordinates && (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
          Non sono disponibili coordinate per questo viaggio. La mappa mostra la posizione predefinita.
        </p>
      )}
    </section>
  )
}
