import {
  formatTemperature,
  getWeatherCondition,
} from '../../lib/weatherUtils'

type WeatherCardProps = {
  loading: boolean
  weather: any
  destination: string
  onOpenWeather: () => void
}

export default function WeatherCard({
  loading,
  weather,
  destination,
  onOpenWeather,
}: WeatherCardProps) {
  const weatherCondition = weather
    ? getWeatherCondition(
        weather.current.weatherCode,
        weather.current.isDay,
      )
    : null

  return (
    <button
      type="button"
      onClick={onOpenWeather}
      className="mt-5 flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
    >
      {loading && !weather ? (
        <>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />

            <div>
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
            </div>
          </div>

          <div className="h-8 w-14 animate-pulse rounded bg-slate-200" />
        </>
      ) : weather && weatherCondition ? (
        <>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl">
              {weatherCondition.icon}
            </span>

            <div className="min-w-0">
              <p className="font-semibold">Meteo oggi</p>

              <p className="truncate text-sm text-slate-500">
                {weatherCondition.label} · {destination}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold">
              {formatTemperature(weather.current.temperature)}
            </p>

            <p className="text-xs font-medium text-blue-600">
              Dettagli →
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-2xl">
              🌦️
            </span>

            <div>
              <p className="font-semibold">Meteo</p>

              <p className="text-sm text-slate-500">
                Apri le previsioni
              </p>
            </div>
          </div>

          <span className="text-blue-600">→</span>
        </>
      )}
    </button>
  )
}