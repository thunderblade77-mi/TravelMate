import type {
  DailyWeather,
  HourlyWeather,
  WeatherApiResponse,
  WeatherForecast,
} from '../types/weather'

const WEATHER_API_URL =
  'https://api.open-meteo.com/v1/forecast'

function buildWeatherUrl(
  latitude: number,
  longitude: number,
): string {
  const parameters = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),

    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'is_day',
    ].join(','),

    hourly: [
      'temperature_2m',
      'apparent_temperature',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
    ].join(','),

    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'sunrise',
      'sunset',
    ].join(','),

    timezone: 'auto',
    forecast_days: '7',
  })

  return `${WEATHER_API_URL}?${parameters.toString()}`
}

function parseHourlyWeather(
  response: WeatherApiResponse,
): HourlyWeather[] {
  return response.hourly.time.map(
    (time, index) => ({
      time,
      temperature:
        response.hourly.temperature_2m[index],
      apparentTemperature:
        response.hourly.apparent_temperature[index],
      precipitationProbability:
        response.hourly
          .precipitation_probability[index],
      weatherCode:
        response.hourly.weather_code[index],
      windSpeed:
        response.hourly.wind_speed_10m[index],
    }),
  )
}

function parseDailyWeather(
  response: WeatherApiResponse,
): DailyWeather[] {
  return response.daily.time.map(
    (date, index) => ({
      date,
      weatherCode:
        response.daily.weather_code[index],
      temperatureMax:
        response.daily.temperature_2m_max[index],
      temperatureMin:
        response.daily.temperature_2m_min[index],
      precipitationProbability:
        response.daily
          .precipitation_probability_max[index],
      sunrise:
        response.daily.sunrise[index],
      sunset:
        response.daily.sunset[index],
    }),
  )
}

function validateCoordinates(
  latitude: number,
  longitude: number,
) {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error('Latitudine non valida.')
  }

  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Longitudine non valida.')
  }
}

export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherForecast> {
  validateCoordinates(latitude, longitude)

  const response = await fetch(
    buildWeatherUrl(latitude, longitude),
    {
      signal,
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `Impossibile caricare il meteo (${response.status}).`,
    )
  }

  const data =
    (await response.json()) as WeatherApiResponse

  if (
    !data.current ||
    !data.hourly ||
    !data.daily
  ) {
    throw new Error(
      'La risposta del servizio meteo non è completa.',
    )
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,

    current: {
      time: data.current.time,
      temperature:
        data.current.temperature_2m,
      apparentTemperature:
        data.current.apparent_temperature,
      humidity:
        data.current.relative_humidity_2m,
      precipitation:
        data.current.precipitation,
      weatherCode:
        data.current.weather_code,
      windSpeed:
        data.current.wind_speed_10m,
      isDay: data.current.is_day === 1,
    },

    hourly: parseHourlyWeather(data),
    daily: parseDailyWeather(data),
  }
}