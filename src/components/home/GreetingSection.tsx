import { getPersonalizedGreeting } from '../../lib/greeting'

type GreetingSectionProps = {
  firstName: string
  tripTitle: string
}

export function GreetingSection({ firstName, tripTitle }: GreetingSectionProps) {
  const greeting = getPersonalizedGreeting(firstName)

  return (
    <section className="pb-8">
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-slate-900">
        {greeting}
      </h1>
      <p className="mt-1.5 text-base text-slate-500">{tripTitle}</p>
    </section>
  )
}
