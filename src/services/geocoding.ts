export type GeocodingResult = {
  latitude: number
  longitude: number
}

type NominatimResult = {
  lat: string
  lon: string
}

export async function geocodeDestination(
  destination: string,
): Promise<GeocodingResult | null> {
  const query = destination.trim()

  if (!query) {
    return null
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query,
    )}&limit=1`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    return null
  }

  const results =
    (await response.json()) as NominatimResult[]

  if (results.length === 0) {
    return null
  }

  return {
    latitude: Number(results[0].lat),
    longitude: Number(results[0].lon),
  }
}