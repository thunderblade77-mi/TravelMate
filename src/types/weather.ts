export type WeatherCondition = {
  code: number
  label: string
  icon: string
}

export type CurrentWeather = {
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  precipitation: number
  weatherCode: number
  isDay: boolean
  time: string
}

export type HourlyWeather = {
  time: string
  temperature: number
  apparentTemperature: number
  precipitationProbability: number
  weatherCode: number
  windSpeed: number
}

export type DailyWeather = {
  date: string
  weatherCode: number
  temperatureMax: number
  temperatureMin: number
  precipitationProbability: number
  sunrise: string
  sunset: string
}

export type WeatherForecast = {
  latitude: number
  longitude: number
  timezone: string
  current: CurrentWeather
  hourly: HourlyWeather[]
  daily: DailyWeather[]
}

export type WeatherAdviceType =
  | 'sun'
  | 'rain'
  | 'heat'
  | 'cold'
  | 'wind'
  | 'storm'
  | 'neutral'

export type WeatherAdvice = {
  type: WeatherAdviceType
  icon: string
  title: string
  message: string
}

export type WeatherApiCurrentResponse = {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  precipitation: number
  weather_code: number
  wind_speed_10m: number
  is_day: number
}

export type WeatherApiHourlyResponse = {
  time: string[]
  temperature_2m: number[]
  apparent_temperature: number[]
  precipitation_probability: number[]
  weather_code: number[]
  wind_speed_10m: number[]
}

export type WeatherApiDailyResponse = {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  precipitation_probability_max: number[]
  sunrise: string[]
  sunset: string[]
}

export type WeatherApiResponse = {
  latitude: number
  longitude: number
  timezone: string
  current: WeatherApiCurrentResponse
  hourly: WeatherApiHourlyResponse
  daily: WeatherApiDailyResponse
}