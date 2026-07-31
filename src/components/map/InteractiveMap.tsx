import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'

import type {
  LatLngExpression,
  LatLngTuple,
  Marker as LeafletMarker,
} from 'leaflet'

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import { useMapPoints } from '../../hooks/useMapPoints'

import type {
  MapPoint,
  MapPointType,
} from '../../types/map'

type InteractiveMapProps = {
  center?: LatLngExpression
  zoom?: number
  tripId?: string
  selectedMapPointId?: string | null
}

const defaultCenter: LatLngTuple = [
  41.9028,
  12.4964,
]

type ClickMarkerProps = {
  onSelect: (position: LatLngTuple) => void
}

function ClickMarker({
  onSelect,
}: ClickMarkerProps) {
  useMapEvents({
    click(event) {
      onSelect([
        event.latlng.lat,
        event.latlng.lng,
      ])
    },
  })

  return null
}

type MapPointFocusControllerProps = {
  point: MapPoint | null
  markerRef: React.RefObject<LeafletMarker | null>
}

function MapPointFocusController({
  point,
  markerRef,
}: MapPointFocusControllerProps) {
  const map = useMap()

  useEffect(() => {
    if (!point) {
      return
    }

    map.setView(
      [point.latitude, point.longitude],
      16,
      {
        animate: true,
      },
    )

    const popupTimer = window.setTimeout(() => {
      markerRef.current?.openPopup()
    }, 350)

    return () => {
      window.clearTimeout(popupTimer)
    }
  }, [map, markerRef, point])

  return null
}

type UserLocationControllerProps = {
  requestId: number
  onLocationFound: (
    position: LatLngTuple,
  ) => void
  onLocationError: (message: string) => void
}

function UserLocationController({
  requestId,
  onLocationFound,
  onLocationError,
}: UserLocationControllerProps) {
  const map = useMap()

  useEffect(() => {
    if (!navigator.geolocation) {
      onLocationError(
        'La geolocalizzazione non è supportata da questo dispositivo.',
      )

      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPosition: LatLngTuple = [
          position.coords.latitude,
          position.coords.longitude,
        ]

        onLocationFound(userPosition)

        map.setView(userPosition, 16, {
          animate: true,
        })
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            onLocationError(
              'Permesso di localizzazione negato. Puoi abilitarlo nelle impostazioni di Safari.',
            )
            break

          case error.POSITION_UNAVAILABLE:
            onLocationError(
              'La posizione non è momentaneamente disponibile.',
            )
            break

          case error.TIMEOUT:
            onLocationError(
              'La richiesta della posizione è scaduta. Riprova.',
            )
            break

          default:
            onLocationError(
              'Non è stato possibile determinare la tua posizione.',
            )
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    )
  }, [
    map,
    onLocationError,
    onLocationFound,
    requestId,
  ])

  return null
}

function getPointIcon(type: MapPointType): string {
  switch (type) {
    case 'hotel':
      return '🏨'

    case 'restaurant':
      return '🍽️'

    case 'attraction':
      return '📸'

    case 'transport':
      return '🚆'
  }
}

function getPointTypeLabel(
  type: MapPointType,
): string {
  switch (type) {
    case 'hotel':
      return 'Hotel'

    case 'restaurant':
      return 'Ristorante'

    case 'attraction':
      return 'Attrazione'

    case 'transport':
      return 'Trasporto'
  }
}

export default function InteractiveMap({
  center = defaultCenter,
  zoom = 13,
  tripId,
  selectedMapPointId = null,
}: InteractiveMapProps) {
  const {
    addMapPoint,
    removeMapPoint,
    getTripMapPoints,
  } = useMapPoints()

  const focusedMarkerRef =
    useRef<LeafletMarker | null>(null)

  const [selectedPoint, setSelectedPoint] =
    useState<LatLngTuple | null>(null)

  const [pointName, setPointName] = useState('')

  const [pointLocation, setPointLocation] =
    useState('')

  const [pointType, setPointType] =
    useState<MapPointType>('attraction')

  const [userPosition, setUserPosition] =
    useState<LatLngTuple | null>(null)

  const [locationRequestId, setLocationRequestId] =
    useState(0)

  const [isLocating, setIsLocating] =
    useState(true)

  const [locationError, setLocationError] =
    useState<string | null>(null)

  const tripMapPoints = tripId
    ? getTripMapPoints(tripId)
    : []

  const focusedMapPoint =
    tripMapPoints.find(
      (point) => point.id === selectedMapPointId,
    ) ?? null

  function handleSelectPoint(
    position: LatLngTuple,
  ) {
    setSelectedPoint(position)
    setPointName('')
    setPointLocation('')
    setPointType('attraction')
  }

  function handleLocationFound(
    position: LatLngTuple,
  ) {
    setUserPosition(position)
    setLocationError(null)
    setIsLocating(false)
  }

  function handleLocationError(
    message: string,
  ) {
    setLocationError(message)
    setIsLocating(false)
  }

  function handleRequestLocation() {
    setIsLocating(true)
    setLocationError(null)

    setLocationRequestId(
      (currentRequestId) =>
        currentRequestId + 1,
    )
  }

  function handleSavePoint(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const cleanName = pointName.trim()

    if (!tripId || !selectedPoint || !cleanName) {
      return
    }

    addMapPoint({
      tripId,
      name: cleanName,
      location: pointLocation.trim(),
      latitude: selectedPoint[0],
      longitude: selectedPoint[1],
      type: pointType,
    })

    setSelectedPoint(null)
    setPointName('')
    setPointLocation('')
    setPointType('attraction')
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className="h-[28rem] w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickMarker
            onSelect={handleSelectPoint}
          />

          <MapPointFocusController
            point={focusedMapPoint}
            markerRef={focusedMarkerRef}
          />

          <UserLocationController
            requestId={locationRequestId}
            onLocationFound={
              handleLocationFound
            }
            onLocationError={
              handleLocationError
            }
          />

          <Marker position={center}>
            <Popup>
              Destinazione del viaggio
            </Popup>
          </Marker>

          {userPosition && (
            <Marker position={userPosition}>
              <Popup>
                <strong>📍 Sei qui</strong>
              </Popup>
            </Marker>
          )}

          {tripMapPoints.map((point) => {
            const isFocused =
              point.id === selectedMapPointId

            return (
              <Marker
                key={point.id}
                position={[
                  point.latitude,
                  point.longitude,
                ]}
                ref={
                  isFocused
                    ? focusedMarkerRef
                    : undefined
                }
              >
                <Popup>
                  <div className="min-w-40">
                    <strong className="block text-base">
                      {getPointIcon(point.type)}{' '}
                      {point.name}
                    </strong>

                    {point.location && (
                      <p className="mt-1 text-sm text-slate-500">
                        📍 {point.location}
                      </p>
                    )}

                    <p className="mt-1 text-sm">
                      {getPointTypeLabel(
                        point.type,
                      )}
                    </p>

                    {isFocused && (
                      <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                        Selezionato dal Roadbook
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeMapPoint(point.id)
                      }
                      className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                    >
                      Elimina
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {selectedPoint && (
            <Marker position={selectedPoint}>
              <Popup>
                <form
                  onSubmit={handleSavePoint}
                  className="min-w-52 space-y-3"
                >
                  <strong className="block text-base">
                    📍 Nuovo punto
                  </strong>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold">
                      Nome
                    </span>

                    <input
                      type="text"
                      value={pointName}
                      onChange={(event) =>
                        setPointName(
                          event.target.value,
                        )
                      }
                      placeholder="Es. Museo del Louvre"
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold">
                      Indirizzo
                    </span>

                    <input
                      type="text"
                      value={pointLocation}
                      onChange={(event) =>
                        setPointLocation(
                          event.target.value,
                        )
                      }
                      placeholder="Es. Parigi"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold">
                      Tipo
                    </span>

                    <select
                      value={pointType}
                      onChange={(event) =>
                        setPointType(
                          event.target
                            .value as MapPointType,
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none"
                    >
                      <option value="hotel">
                        🏨 Hotel
                      </option>

                      <option value="restaurant">
                        🍽️ Ristorante
                      </option>

                      <option value="attraction">
                        📸 Attrazione
                      </option>

                      <option value="transport">
                        🚆 Trasporto
                      </option>
                    </select>
                  </label>

                  <p className="text-xs text-slate-500">
                    Lat:{' '}
                    {selectedPoint[0].toFixed(5)}
                    <br />
                    Lng:{' '}
                    {selectedPoint[1].toFixed(5)}
                  </p>

                  <button
                    type="submit"
                    disabled={!tripId}
                    className="w-full rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Salva punto
                  </button>

                  {!tripId && (
                    <p className="text-xs text-amber-700">
                      Seleziona prima un viaggio.
                    </p>
                  )}
                </form>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        <button
          type="button"
          onClick={handleRequestLocation}
          disabled={isLocating}
          className="absolute bottom-4 right-4 z-[1000] rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg disabled:cursor-wait disabled:text-slate-400"
        >
          {isLocating
            ? 'Localizzazione...'
            : '◎ La mia posizione'}
        </button>
      </div>

      {locationError && (
        <p className="border-t border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {locationError}
        </p>
      )}
    </div>
  )
}