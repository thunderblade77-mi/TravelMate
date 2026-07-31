import { useMemo } from 'react'

import { useWeather } from '../../hooks/useWeather'

import {
  formatPercentage,
  formatTemperature,
  formatWeatherDay,
  formatWeatherTime,
  formatWindSpeed,
  getAdditionalWeatherAdvice,
  getPrimaryWeatherAdvice,
  getWeatherCondition,
  isToday,
} from '../../lib/weatherUtils'

import type { Trip } from '../../types/travel'

type WeatherPageProps = {
  activeTrip: Trip | null
}

function WeatherLoadingState() {
  return (
    <div className="mt-7 space-y-4">
      <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />

      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
      </div>

      <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
    </div>
  )
}

export default function WeatherPage({
  activeTrip,
}: WeatherPageProps) {
  const latitude = activeTrip?.latitude
  const longitude = activeTrip?.longitude

  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number'

  const {
    weather,
    loading,
    error,
    refresh,
  } = useWeather(latitude, longitude)

  const upcomingHourlyWeather = useMemo(() => {
    if (!weather) {
      return []
    }

    const currentTime = new Date(
      weather.current.time,
    ).getTime()

    return weather.hourly
      .filter((hour) => {
        const hourTime = new Date(hour.time).getTime()

        return hourTime >= currentTime
      })
      .slice(0, 12)
  }, [weather])

  const todayWeather =
    weather?.daily.find((day) =>
      isToday(day.date),
    ) ??
    weather?.daily[0] ??
    null

  const mainAdvice =
    weather && todayWeather
      ? getPrimaryWeatherAdvice(
          weather.current,
          todayWeather,
        )
      : null

  const additionalAdvice =
    weather && todayWeather
      ? getAdditionalWeatherAdvice(
          weather.current,
          todayWeather,
        )
      : []

  if (!activeTrip) {
    return (
      <section>
        <p className="text-sm font-medium text-blue-600">
          Meteo
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Previsioni di viaggio
        </h1>

        <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="text-5xl">🌦️</span>

          <h2 className="mt-5 text-xl font-bold">
            Nessun viaggio attivo
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Crea o seleziona un viaggio per vedere le
            previsioni meteo della destinazione.
          </p>
        </div>
      </section>
    )
  }

  if (!hasCoordinates) {
    return (
      <section>
        <p className="text-sm font-medium text-blue-600">
          Meteo
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {activeTrip.destination}
        </h1>

        <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-7 text-center">
          <span className="text-5xl">📍</span>

          <h2 className="mt-5 text-xl font-bold text-amber-900">
            Coordinate non disponibili
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Non possiamo caricare il meteo perché questo
            viaggio non possiede coordinate valide.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Meteo
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {activeTrip.destination}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Previsioni aggiornate per il tuo viaggio.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Aggiorno…' : '↻ Aggiorna'}
        </button>
      </div>

      {loading && !weather && (
        <WeatherLoadingState />
      )}

      {error && !weather && (
        <div className="mt-7 rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-bold text-red-800">
            Impossibile caricare il meteo
          </p>

          <p className="mt-2 text-sm leading-6 text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={refresh}
            className="mt-5 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white active:scale-95"
          >
            Riprova
          </button>
        </div>
      )}

      {weather && (
        <>
          {error && (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              I dati mostrati potrebbero non essere
              aggiornati. {error}
            </div>
          )}

          <div className="mt-7 overflow-hidden rounded-3xl bg-blue-600 p-6 text-white shadow-lg shadow-blue-200">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-medium text-blue-100">
                  Adesso
                </p>

                <div className="mt-3 flex items-end gap-3">
                  <strong className="text-6xl font-bold tracking-tight">
                    {formatTemperature(
                      weather.current.temperature,
                    )}
                  </strong>

                  <span className="pb-2 text-5xl">
                    {
                      getWeatherCondition(
                        weather.current.weatherCode,
                        weather.current.isDay,
                      ).icon
                    }
                  </span>
                </div>

                <p className="mt-3 text-lg font-semibold">
                  {
                    getWeatherCondition(
                      weather.current.weatherCode,
                      weather.current.isDay,
                    ).label
                  }
                </p>

                <p className="mt-1 text-sm text-blue-100">
                  Percepiti{' '}
                  {formatTemperature(
                    weather.current
                      .apparentTemperature,
                  )}
                </p>
              </div>

              {todayWeather && (
                <div className="rounded-2xl bg-white/15 px-4 py-3 text-right backdrop-blur">
                  <p className="text-xs font-medium text-blue-100">
                    Oggi
                  </p>

                  <p className="mt-1 font-bold">
                    ↑{' '}
                    {formatTemperature(
                      todayWeather.temperatureMax,
                    )}
                  </p>

                  <p className="mt-1 text-sm text-blue-100">
                    ↓{' '}
                    {formatTemperature(
                      todayWeather.temperatureMin,
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/20 pt-5">
              <div>
                <p className="text-xs text-blue-100">
                  Umidità
                </p>

                <p className="mt-1 font-bold">
                  {formatPercentage(
                    weather.current.humidity,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-blue-100">
                  Vento
                </p>

                <p className="mt-1 font-bold">
                  {formatWindSpeed(
                    weather.current.windSpeed,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-blue-100">
                  Pioggia
                </p>

                <p className="mt-1 font-bold">
                  {weather.current.precipitation.toFixed(
                    1,
                  )}{' '}
                  mm
                </p>
              </div>
            </div>
          </div>

          {mainAdvice && (
            <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  {mainAdvice.icon}
                </span>

                <div>
                  <p className="font-bold text-blue-950">
                    {mainAdvice.title}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    {mainAdvice.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">
                💧 Umidità
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatPercentage(
                  weather.current.humidity,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">
                🌬️ Vento
              </p>

              <p className="mt-2 text-2xl font-bold">
                {formatWindSpeed(
                  weather.current.windSpeed,
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">
                🌅 Alba
              </p>

              <p className="mt-2 text-2xl font-bold">
                {todayWeather
                  ? formatWeatherTime(
                      todayWeather.sunrise,
                    )
                  : '--:--'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">
                🌇 Tramonto
              </p>

              <p className="mt-2 text-2xl font-bold">
                {todayWeather
                  ? formatWeatherTime(
                      todayWeather.sunset,
                    )
                  : '--:--'}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Prossime ore
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Previsione oraria
                </h2>
              </div>
            </div>

            <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-2">
              <div className="flex min-w-max gap-3">
                {upcomingHourlyWeather.map((hour) => {
                  const condition =
                    getWeatherCondition(
                      hour.weatherCode,
                    )

                  return (
                    <div
                      key={hour.time}
                      className="w-24 rounded-2xl border border-slate-200 bg-white p-4 text-center"
                    >
                      <p className="text-xs font-semibold text-slate-500">
                        {formatWeatherTime(hour.time)}
                      </p>

                      <span className="mt-3 block text-3xl">
                        {condition.icon}
                      </span>

                      <p className="mt-3 text-lg font-bold">
                        {formatTemperature(
                          hour.temperature,
                        )}
                      </p>

                      <p className="mt-2 text-xs text-blue-600">
                        💧{' '}
                        {formatPercentage(
                          hour.precipitationProbability,
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Questa settimana
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Previsione 7 giorni
            </h2>

            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {weather.daily.map((day, index) => {
                const condition =
                  getWeatherCondition(
                    day.weatherCode,
                  )

                return (
                  <div
                    key={day.date}
                    className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 ${
                      index <
                      weather.daily.length - 1
                        ? 'border-b border-slate-100'
                        : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold capitalize">
                        {isToday(day.date)
                          ? 'Oggi'
                          : formatWeatherDay(day.date)}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {condition.label}
                      </p>
                    </div>

                    <div className="text-center">
                      <span className="text-2xl">
                        {condition.icon}
                      </span>

                      <p className="mt-1 text-xs text-blue-600">
                        💧{' '}
                        {formatPercentage(
                          day.precipitationProbability,
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        {formatTemperature(
                          day.temperatureMax,
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {formatTemperature(
                          day.temperatureMin,
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {additionalAdvice.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Consigli di viaggio
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Preparati al meglio
              </h2>

              <div className="mt-4 space-y-3">
                {additionalAdvice.map(
                  (advice, index) => (
                    <div
                      key={`${advice.type}-${index}`}
                      className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl">
                        {advice.icon}
                      </span>

                      <div>
                        <p className="font-semibold">
                          {advice.title}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {advice.message}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-slate-400">
            Dati meteo forniti da Open-Meteo · Fuso
            orario: {weather.timezone}
          </p>
        </>
      )}
    </section>
  )
}