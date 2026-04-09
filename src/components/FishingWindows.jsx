// FishingWindows.jsx — Shows optimal fishing time windows for a given day
// Based on tide direction, tidal range, and time-of-day quality

const TIME_OF_DAY_ICONS = {
  Night:   '🌙',
  Morning: '🌅',
  Evening: '🌆',
  Day:     '☀️',
}

const qualityLabel = (q) => {
  if (q >= 80) return { text: 'Excellent',  color: 'text-emerald-300', bar: 'bg-emerald-400' }
  if (q >= 65) return { text: 'Good',       color: 'text-blue-300',    bar: 'bg-blue-400'    }
  if (q >= 50) return { text: 'Fair',       color: 'text-amber-300',   bar: 'bg-amber-400'   }
  return              { text: 'Poor',        color: 'text-slate-400',   bar: 'bg-slate-500'   }
}

export default function FishingWindows({ windows }) {
  if (!windows || windows.length === 0) {
    return <p className="text-sm text-white/40 italic py-2">No tide windows available.</p>
  }

  return (
    <div className="space-y-2">
      {windows.map((w, i) => {
        const { text, color, bar } = qualityLabel(w.quality)
        const isBest = i === 0
        const icon   = TIME_OF_DAY_ICONS[w.timeOfDay] ?? '🎣'

        return (
          <div
            key={i}
            className={[
              'rounded-xl border px-3 py-2.5 transition-colors',
              isBest
                ? 'bg-emerald-500/10 border-emerald-400/25'
                : 'bg-white/5 border-white/8',
            ].join(' ')}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                {/* Best badge */}
                {isBest && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full">
                    Best
                  </span>
                )}
                {/* Time of day icon + time range */}
                <span className="text-sm">{icon}</span>
                <span className="text-white font-semibold text-sm">
                  {w.startLabel} – {w.endLabel}
                  {w.spansNextDay && (
                    <span className="text-white/40 text-xs font-normal ml-1">(+1)</span>
                  )}
                </span>
              </div>

              {/* Quality label */}
              <span className={`text-xs font-semibold ${color}`}>{text}</span>
            </div>

            {/* Details row */}
            <div className="flex items-center gap-3 text-xs text-white/50">
              <span>
                {w.isRising ? '↑ Rising' : '↓ Falling'} tide
              </span>
              <span>·</span>
              <span>{w.range} ft swing</span>
              <span>·</span>
              <span>{w.timeOfDay}</span>
            </div>

            {/* Quality bar */}
            <div className="mt-2 h-1 rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${bar}`}
                style={{ width: `${w.quality}%` }}
              />
            </div>
          </div>
        )
      })}

      <p className="text-[10px] text-white/30 pt-1 leading-relaxed">
        Windows ranked by tide direction, tidal range, and time of day.
        Rising tide during night or dawn hours scores highest for inshore fishing.
      </p>
    </div>
  )
}
