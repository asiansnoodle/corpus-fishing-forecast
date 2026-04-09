// DayCard.jsx — Individual day cell in the 7-column calendar grid
// Frutiger Aero: glassmorphism card with score-based gradient tint and glow

import ScoreBadge from './ScoreBadge'
import { getWeatherCondition } from '../utils/weatherCode'

// Card background + border color based on star rating
const CARD_STYLES = {
  4: 'bg-emerald-500/20 border-emerald-400/25 hover:bg-emerald-500/30 hover:shadow-emerald-400/25',
  3: 'bg-blue-500/20 border-blue-400/25 hover:bg-blue-500/30 hover:shadow-blue-400/20',
  2: 'bg-white/8 border-white/10 hover:bg-white/12',
  1: 'bg-white/5 border-white/8 hover:bg-white/8',
}

const TODAY_RING = 'ring-2 ring-cyan-400/70 ring-offset-1 ring-offset-transparent'

export default function DayCard({ day, isToday, isSelected, onClick }) {
  const { date, score, stars, label, isPartial, moonData, weather } = day

  const dayNum    = date.getDate()
  const cardBase  = CARD_STYLES[stars] ?? CARD_STYLES[1]
  const condition = weather ? getWeatherCondition(weather.weatherCode) : null

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-center justify-between',
        'w-full aspect-[3/4] min-h-[90px] p-1.5 md:p-2',
        'rounded-xl border backdrop-blur-sm',
        'transition-all duration-200 cursor-pointer text-left',
        'hover:shadow-lg hover:scale-[1.03] hover:-translate-y-0.5',
        cardBase,
        isToday    ? TODAY_RING : '',
        isSelected ? 'scale-[1.03] brightness-110' : '',
      ].join(' ')}
    >
      {/* Top row: date number + moon icon */}
      <div className="w-full flex items-start justify-between">
        <span className={`text-sm md:text-base font-bold leading-none ${isToday ? 'text-cyan-300' : 'text-white'}`}>
          {dayNum}
        </span>
        <span className="text-base leading-none" title={moonData.phaseName}>
          {moonData.phaseIcon}
        </span>
      </div>

      {/* Score badge */}
      <div className="flex-1 flex items-center justify-center py-1">
        <ScoreBadge score={score} stars={stars} label={label} isPartial={isPartial} size="sm" />
      </div>

      {/* Bottom row: weather condition (full days) or Preview label (partial days) */}
      <div className="w-full flex items-center justify-between">
        {isPartial ? (
          <span className="text-[9px] md:text-[10px] text-cyan-300/50 font-medium tracking-wide uppercase">
            Preview
          </span>
        ) : condition ? (
          <span
            className="text-sm leading-none"
            title={condition.label}
          >
            {condition.icon}
          </span>
        ) : null}
      </div>
    </button>
  )
}
