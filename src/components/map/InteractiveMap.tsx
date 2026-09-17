import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'

import {
  divIcon,
  type LatLngExpression,
  type LatLngTuple,
  type Marker as LeafletMarker,
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

const defaultCenter: LatLngTuple = [41.9028, 12.4964]

function createPlaceIcon(
  emoji: string,
  background: string,
  size = 38,
) {
  return divIcon({
    className: '',
    html: `<div class="travelg-map-pin" style="background:${background};width:${size}px;height:${size}px"><span>${emoji}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 3],
    popupAnchor: [0, -size + 3],
  })
}

const userLocationIcon = divIcon({
  className: '',
  html: `
    <div class="travelg-user-marker">
      <div class="travelg-user-pulse"></div>
      <div class="travelg-user-core">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="3"></circle>
          <path d="M6.5 19.5a5.5 5.5 0 0 1 11 0"></path>
        </svg>
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -22],
})

type ClickMarkerProps = {
  onSelect: (position: LatLngTuple) => void
}

function ClickMarker({ onSelect }: ClickMarkerProps) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng])
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
    if (!point) return

    map.setView([point.latitude, point.longitude], 16, {
      animate: true,
    })

    const popupTimer = window.setTimeout(() => {
      markerRef.current?.openPopup()
    }, 350)

    return () => window.clearTimeout(popupTimer)
  }, [map, markerRef, point])

  return null
}

type UserLocationControllerProps = {
  requestId: number
  onLocationFound: (position: LatLngTuple) => void
  onLocationError: (message: string) => void
}

function UserLocationController({
  requestId,
  onLocationFound,
  onLocationError,
}: UserLocationControllerProps) {
  const map = useMap()

  useEffect(() => {
    if (requestId === 0) return

    if (!window.isSecureContext) {
      onLocationError('La posizione richiede una connessione sicura HTTPS.')
      return
    }

    if (!navigator.geolocation) {
      onLocationError('La geolocalizzazione non è supportata da questo dispositivo.')
      return
    }

    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return

        const userPosition: LatLngTuple = [
          position.coords.latitude,
          position.coords.longitude,
        ]

        onLocationFound(userPosition)
        map.setView(userPosition, 16, { animate: true })
      },
      (error) => {
        if (cancelled) return

        switch (error.code) {
          case error.PERMISSION_DENIED:
            onLocationError(
              'Permesso di localizzazione negato. Su iPhone apri Impostazioni → Privacy e sicurezza → Localizzazione → Safari Websites e scegli “Mentre usi l’app”, con “Posizione esatta” attiva.',
            )
            break
          case error.POSITION_UNAVAILABLE:
            onLocationError('La posizione non è momentaneamente disponibile. Attiva il GPS e riprova.')
            break
          case error.TIMEOUT:
            onLocationError('La richiesta della posizione è scaduta. Riprova all’aperto o con una connessione migliore.')
            break
          default:
            onLocationError('Non è stato possibile determinare la tua posizione.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    )

    return () => {
      cancelled = true
    }
  }, [map, onLocationError, onLocationFound, requestId])

  return null
}

function getPointIcon(type: MapPointType): string {
  switch (type) {
    case 'hotel':
      return '🏨'
    case 'restaurant':
      return '🍽️'
    case 'attraction':
      return '🏛️'
    case 'transport':
      return '🚆'
  }
}

function getPointColor(type: MapPointType): string {
  switch (type) {
    case 'hotel':
      return 'linear-gradient(145deg,#7c3aed,#4f46e5)'
    case 'restaurant':
      return 'linear-gradient(145deg,#f97316,#ea580c)'
    case 'attraction':
      return 'linear-gradient(145deg,#0ea5e9,#2563eb)'
    case 'transport':
      return 'linear-gradient(145deg,#10b981,#059669)'
  }
}

function getPointTypeLabel(type: MapPointType): string {
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

  const focusedMarkerRef = useRef<LeafletMarker | null>(null)

  const [selectedPoint, setSelectedPoint] = useState<LatLngTuple | null>(null)
  const [pointName, setPointName] = useState('')
  const [pointLocation, setPointLocation] = useState('')
  const [pointType, setPointType] = useState<MapPointType>('attraction')
  const [userPosition, setUserPosition] = useState<LatLngTuple | null>(null)
  const [locationRequestId, setLocationRequestId] = useState(0)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const tripMapPoints = tripId ? getTripMapPoints(tripId) : []

  const focusedMapPoint =
    tripMapPoints.find((point) => point.id === selectedMapPointId) ?? null

  const destinationIcon = useMemo(
    () => createPlaceIcon('✈️', 'linear-gradient(145deg,#111827,#334155)', 42),
    [],
  )

  const newPointIcon = useMemo(
    () => createPlaceIcon('+', 'linear-gradient(145deg,#64748b,#475569)', 36),
    [],
  )

  const handleSelectPoint = useCallback((position: LatLngTuple) => {
    setSelectedPoint(position)
    setPointName('')
    setPointLocation('')
    setPointType('attraction')
  }, [])

  const handleLocationFound = useCallback((position: LatLngTuple) => {
    setUserPosition(position)
    setLocationError(null)
    setIsLocating(false)
  }, [])

  const handleLocationError = useCallback((message: string) => {
    setLocationError(message)
    setIsLocating(false)
  }, [])

  function handleRequestLocation() {
    setIsLocating(true)
    setLocationError(null)
    setLocationRequestId((currentRequestId) => currentRequestId + 1)
  }

  function handleSavePoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanName = pointName.trim()

    if (!tripId || !selectedPoint || !cleanName) return

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
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.14)]">
      <div className="relative">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          className="h-[31rem] w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickMarker onSelect={handleSelectPoint} />

          <MapPointFocusController
            point={focusedMapPoint}
            markerRef={focusedMarkerRef}
          />

          <UserLocationController
            requestId={locationRequestId}
            onLocationFound={handleLocationFound}
            onLocationError={handleLocationError}
          />

          <Marker position={center} icon={destinationIcon}>
            <Popup>
              <div className="min-w-36">
                <strong className="text-base">✈️ Destinazione</strong>
                <p className="mt-1 text-sm text-slate-500">Centro del viaggio</p>
              </div>
            </Popup>
          </Marker>

          {userPosition && (
            <Marker position={userPosition} icon={userLocationIcon}>
              <Popup>
                <div className="min-w-36">
                  <strong className="text-base text-blue-700">Sei qui</strong>
                  <p className="mt-1 text-sm text-slate-500">Posizione GPS attuale</p>
                </div>
              </Popup>
            </Marker>
          )}

          {tripMapPoints.map((point) => {
            const isFocused = point.id === selectedMapPointId
            const icon = createPlaceIcon(
              getPointIcon(point.type),
              getPointColor(point.type),
              isFocused ? 44 : 38,
            )

            return (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude]}
                icon={icon}
                ref={isFocused ? focusedMarkerRef : undefined}
              >
                <Popup>
                  <div className="min-w-44">
                    <strong className="block text-base">
                      {getPointIcon(point.type)} {point.name}
                    </strong>

                    {point.location && (
                      <p className="mt-1 text-sm text-slate-500">📍 {point.location}</p>
                    )}

                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-blue-600">
                      {getPointTypeLabel(point.type)}
                    </p>

                    {isFocused && (
                      <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                        Selezionato dal Roadbook
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => removeMapPoint(point.id)}
                      className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                    >
                      Elimina
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {selectedPoint && (
            <Marker position={selectedPoint} icon={newPointIcon}>
              <Popup>
                <form onSubmit={handleSavePoint} className="min-w-52 space-y-3">
                  <strong className="block text-base">Nuovo punto</strong>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold">Nome</span>
                    <input
                      type="text"
                      value={pointName}
                      onChange={(event) => setPointName(event.target.value)}
                      placeholder="Es. Museo del Louvre"
                      required
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold">Indirizzo</span>
                    <input
                      type="text"
                      value={pointLocation}
                      onChange={(event) => setPointLocation(event.target.value)}
                      placeholder="Es. Parigi"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold">Tipo</span>
                    <select
                      value={pointType}
                      onChange={(event) => setPointType(event.target.value as MapPointType)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                    >
                      <option value="hotel">🏨 Hotel</option>
                      <option value="restaurant">🍽️ Ristorante</option>
                      <option value="attraction">🏛️ Attrazione</option>
                      <option value="transport">🚆 Trasporto</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={!tripId}
                    className="w-full rounded-xl bg-blue-600 px-3 py-2 font-semibold text-white disabled:bg-slate-300"
                  >
                    Salva punto
                  </button>
                </form>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        <div className="absolute left-4 top-4 z-[1000] rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Mappa live</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-700">
            Tocca la mappa per aggiungere un luogo
          </p>
        </div>

        <button
          type="button"
          onClick={handleRequestLocation}
          disabled={isLocating}
          className="absolute bottom-4 right-4 z-[1000] flex items-center gap-2 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 text-sm font-bold text-slate-800 shadow-xl backdrop-blur disabled:cursor-wait disabled:text-slate-400"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
            {isLocating ? '…' : '➤'}
          </span>
          {isLocating
            ? 'Localizzazione...'
            : userPosition
              ? 'Ricentra su di me'
              : 'La mia posizione'}
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
