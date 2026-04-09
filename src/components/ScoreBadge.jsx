// ScoreBadge.jsx — Star rating + numeric score display
// Used in DayCard (compact) and DayDetail (larger)

const STAR_COLORS = {
  4: 'text-emerald-300',
  3: 'text-blue-300',
  2: 'text-amber-300',
  1: 'text-slate-400',
}

const LABEL_COLORS = {
  4: 'text-emerald-300',
  3: 'text-blue-300',
  2: 'text-amber-300',
  1: 'text-slate-400',
}

export default function ScoreBadge({ score, stars, label, isPartial, size = 'sm' }) {
  const filled   = '★'.repeat(stars)
  const empty    = '☆'.repeat(4 - stars)
  const starColor = STAR_COLORS[stars] ?? 'text-slate-400'
  const labelColor = LABEL_COLORS[stars] ?? 'text-slate-400'

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className={`text-3xl leading-none tracking-wider ${starColor}`}>
          {filled}<span className="opacity-30">{empty}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-white text-4xl font-bold leading-none">{score}</span>
          <span className={`text-sm font-medium ${labelColor}`}>{label}</span>
        </div>
        {isPartial && (
          <span className="text-xs text-cyan-300/60 mt-1">Tide &amp; moon only</span>
        )}
      </div>
    )
  }

  // Default: compact for DayCard
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`text-xs leading-none tracking-wider ${starColor}`}>
        {filled}<span className="opacity-30">{empty}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-white text-sm font-bold leading-none">{score}</span>
      </div>
    </div>
  )
}
