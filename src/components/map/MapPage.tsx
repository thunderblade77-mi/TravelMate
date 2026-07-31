import type { LatLngTuple } from 'leaflet'
import { useLocation } from 'react-router-dom'

import type { Trip } from '../../types/travel'
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

  const navigationState =
    location.state as MapLocationState | null

  const selectedMapPointId =
    navigationState?.mapPointId ?? null

  const latitude = activeTrip?.latitude
  const longitude = activeTrip?.longitude

  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number'

  const mapCenter: LatLngTuple | undefined =
    hasCoordinates
      ? [latitude, longitude]
      : undefined

  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">
        Mappa
      </h1>

      <p className="mt-2 text-slate-500">
        {activeTrip
          ? selectedMapPointId
            ? `Visualizza il punto selezionato del viaggio a ${activeTrip.destination}.`
            : `Visualizza ${activeTrip.destination} sulla mappa.`
          : 'Crea o seleziona un viaggio per visualizzarlo sulla mappa.'}
      </p>

      <div className="mt-7">
        <InteractiveMap
          center={mapCenter}
          zoom={hasCoordinates ? 12 : 13}
          tripId={activeTrip?.id}
          selectedMapPointId={selectedMapPointId}
        />
      </div>

      {activeTrip && !hasCoordinates && (
        <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Non sono disponibili coordinate per questo
          viaggio. La mappa mostra la posizione
          predefinita.
        </p>
      )}
    </section>
  )
}