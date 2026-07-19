export function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours()

  if (hour < 12) return 'Buongiorno'
  if (hour < 18) return 'Buon pomeriggio'
  return 'Buonasera'
}

export function getPersonalizedGreeting(firstName: string, date = new Date()): string {
  return `${getTimeGreeting(date)} ${firstName}`
}
