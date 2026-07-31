import type {
  CurrentWeather,
  DailyWeather,
  WeatherAdvice,
  WeatherCondition,
} from '../types/weather'

export function getWeatherCondition(
  code: number,
  isDay = true,
): WeatherCondition {
  if (code === 0) {
    return {
      code,
      label: 'Sereno',
      icon: isDay ? '☀️' : '🌙',
    }
  }

  if (code === 1) {
    return {
      code,
      label: 'Prevalentemente sereno',
      icon: isDay ? '🌤️' : '🌙',
    }
  }

  if (code === 2) {
    return {
      code,
      label: 'Parzialmente nuvoloso',
      icon: '⛅',
    }
  }

  if (code === 3) {
    return {
      code,
      label: 'Coperto',
      icon: '☁️',
    }
  }

  if (code === 45 || code === 48) {
    return {
      code,
      label: 'Nebbia',
      icon: '🌫️',
    }
  }

  if (code === 51 || code === 53 || code === 55) {
    return {
      code,
      label: 'Pioggerella',
      icon: '🌦️',
    }
  }

  if (code === 56 || code === 57) {
    return {
      code,
      label: 'Pioggerella gelata',
      icon: '🌧️',
    }
  }

  if (code === 61 || code === 63 || code === 65) {
    return {
      code,
      label: 'Pioggia',
      icon: '🌧️',
    }
  }

  if (code === 66 || code === 67) {
    return {
      code,
      label: 'Pioggia gelata',
      icon: '🌧️',
    }
  }

  if (code === 71 || code === 73 || code === 75) {
    return {
      code,
      label: 'Neve',
      icon: '❄️',
    }
  }

  if (code === 77) {
    return {
      code,
      label: 'Granelli di neve',
      icon: '🌨️',
    }
  }

  if (code === 80 || code === 81 || code === 82) {
    return {
      code,
      label: 'Rovesci',
      icon: '🌦️',
    }
  }

  if (code === 85 || code === 86) {
    return {
      code,
      label: 'Rovesci di neve',
      icon: '🌨️',
    }
  }

  if (code === 95) {
    return {
      code,
      label: 'Temporale',
      icon: '⛈️',
    }
  }

  if (code === 96 || code === 99) {
    return {
      code,
      label: 'Temporale con grandine',
      icon: '⛈️',
    }
  }

  return {
    code,
    label: 'Condizioni variabili',
    icon: '🌤️',
  }
}

export function formatTemperature(
  temperature: number,
): string {
  return `${Math.round(temperature)}°`
}

export function formatPercentage(
  value: number,
): string {
  return `${Math.round(value)}%`
}

export function formatWindSpeed(
  value: number,
): string {
  return `${Math.round(value)} km/h`
}

export function formatWeatherTime(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatWeatherDay(
  value: string,
): string {
  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

export function isToday(value: string): boolean {
  const inputDate = new Date(`${value}T12:00:00`)
  const today = new Date()

  return (
    inputDate.getFullYear() === today.getFullYear() &&
    inputDate.getMonth() === today.getMonth() &&
    inputDate.getDate() === today.getDate()
  )
}

export function getPrimaryWeatherAdvice(
  current: CurrentWeather,
  today?: DailyWeather,
): WeatherAdvice {
  const condition = getWeatherCondition(
    current.weatherCode,
    current.isDay,
  )

  const precipitationProbability =
    today?.precipitationProbability ?? 0

  if (
    current.weatherCode >= 95 ||
    condition.label.includes('Temporale')
  ) {
    return {
      type: 'storm',
      icon: '⛈️',
      title: 'Attenzione ai temporali',
      message:
        'Meglio programmare attività al coperto e controllare gli aggiornamenti prima di uscire.',
    }
  }

  if (
    current.weatherCode >= 51 &&
    current.weatherCode <= 82
  ) {
    return {
      type: 'rain',
      icon: '☔',
      title: 'Porta un ombrello',
      message:
        'Sono previste precipitazioni. Tieni a portata di mano una giacca impermeabile.',
    }
  }

  if (precipitationProbability >= 60) {
    return {
      type: 'rain',
      icon: '🌧️',
      title: 'Pioggia probabile',
      message:
        'La probabilità di pioggia è elevata. Considera una visita al coperto.',
    }
  }

  if (current.apparentTemperature >= 32) {
    return {
      type: 'heat',
      icon: '🥵',
      title: 'Fa molto caldo',
      message:
        'Porta acqua, usa protezione solare e programma pause nelle ore più calde.',
    }
  }

  if (current.apparentTemperature <= 5) {
    return {
      type: 'cold',
      icon: '🧥',
      title: 'Fa freddo',
      message:
        'Meglio vestirsi a strati e prevedere soste in luoghi riscaldati.',
    }
  }

  if (current.windSpeed >= 35) {
    return {
      type: 'wind',
      icon: '🌬️',
      title: 'Vento sostenuto',
      message:
        'Fai attenzione durante attività all’aperto e negli spostamenti.',
    }
  }

  if (
    current.weatherCode === 0 ||
    current.weatherCode === 1
  ) {
    return {
      type: 'sun',
      icon: '☀️',
      title: 'Ottima giornata per esplorare',
      message:
        'Le condizioni sono favorevoli per visite, passeggiate e attività all’aperto.',
    }
  }

  return {
    type: 'neutral',
    icon: condition.icon,
    title: 'Condizioni abbastanza stabili',
    message:
      'Il meteo non sembra critico. Porta comunque uno strato leggero per sicurezza.',
  }
}

export function getAdditionalWeatherAdvice(
  current: CurrentWeather,
  today?: DailyWeather,
): WeatherAdvice[] {
  const advice: WeatherAdvice[] = []

  if (current.humidity >= 80) {
    advice.push({
      type: 'neutral',
      icon: '💧',
      title: 'Umidità elevata',
      message:
        'Potresti percepire una temperatura più intensa del previsto.',
    })
  }

  if (
    today &&
    today.precipitationProbability >= 40
  ) {
    advice.push({
      type: 'rain',
      icon: '🌂',
      title: 'Pioggia possibile',
      message:
        'Controlla la previsione oraria prima di organizzare attività all’aperto.',
    })
  }

  if (
    current.temperature >= 25 &&
    current.isDay
  ) {
    advice.push({
      type: 'sun',
      icon: '🧴',
      title: 'Protezione solare',
      message:
        'Ricorda crema solare, cappello e una borraccia.',
    })
  }

  if (current.windSpeed >= 25) {
    advice.push({
      type: 'wind',
      icon: '🧣',
      title: 'Aria ventosa',
      message:
        'Porta una giacca antivento, soprattutto per le ore serali.',
    })
  }

  return advice.slice(0, 3)
}