import { useEffect, useState } from 'react'

import { fetchWeatherForecast } from '../services/weatherService'

import type { WeatherForecast } from '../types/weather'

type UseWeatherResult = {
  weather: WeatherForecast | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useWeather(
  latitude?: number,
  longitude?: number,
): UseWeatherResult {
  const [weather, setWeather] =
    useState<WeatherForecast | null>(null)

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [refreshIndex, setRefreshIndex] =
    useState(0)

  useEffect(() => {
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number'
    ) {
      setWeather(null)
      setLoading(false)
      setError(null)

      return
    }

    const validLatitude = latitude
    const validLongitude = longitude

    const controller = new AbortController()

    async function loadWeather() {
      try {
        setLoading(true)
        setError(null)

        const result =
          await fetchWeatherForecast(
            validLatitude,
            validLongitude,
            controller.signal,
          )

        setWeather(result)
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === 'AbortError'
        ) {
          return
        }

        setWeather(null)

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Errore durante il caricamento del meteo.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadWeather()

    return () => {
      controller.abort()
    }
  }, [latitude, longitude, refreshIndex])

  function refresh() {
    setRefreshIndex((value) => value + 1)
  }

  return {
    weather,
    loading,
    error,
    refresh,
  }
}