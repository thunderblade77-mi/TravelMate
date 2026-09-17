import { useNavigate } from 'react-router-dom'

import { loadTravelPreferences } from '../../services/travelIntelligenceStorage'

export default function PreferenceOnboardingCard() {
  const navigate = useNavigate()
  const preferences = loadTravelPreferences()

  if (preferences.interests.length > 0) {
    return null
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-left shadow-sm"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-violet-600">
          Personalizza TravelG AI
        </p>
        <h3 className="mt-1 font-bold text-slate-900">
          Dicci cosa ti piace in viaggio
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Arte, cibo, nightlife, natura e ritmo del viaggio: bastano pochi tocchi.
        </p>
      </div>
      <span className="text-2xl">→</span>
    </button>
  )
}
