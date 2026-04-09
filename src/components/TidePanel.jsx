// TidePanel.jsx — List of high/low tide events for a given day

// Format "YYYY-MM-DD HH:MM" (CDT from NOAA) → "8:30 PM"
function formatTideTime(t) {
  const timePart = t.substring(11) // "HH:MM"
  const [h, m] = timePart.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

// Determine tide direction label between consecutive events
function getDirectionBetween(prev, next) {
  if (!prev || !next) return null
  return prev.type === 'L' && next.type === 'H' ? 'rising'
       : prev.type === 'H' && next.type === 'L' ? 'falling'
       : null
}

export default function TidePanel({ tideEvents, dayKey }) {
  if (!tideEvents || tideEvents.length === 0) {
    return (
      <p className="text-sm text-white/40 italic py-2">No tide events for this day.</p>
    )
  }

  // Find events specifically on this day (not adjacent days from the window)
  const dayEvents = tideEvents.filter(e => e.t.startsWith(dayKey))

  // Describe the night fishing window (8pm–2am)
  const nightEvents = tideEvents.filter(e => {
    const isToday    = e.t.startsWith(dayKey) && e.hour >= 20
    const [y, mo, d] = dayKey.split('-').map(Number)
    const nextDate   = new Date(y, mo - 1, d + 1)
    const nextKey    = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
    const isNextDay  = e.t.startsWith(nextKey) && e.hour <= 2
    return isToday || isNextDay
  })

  let nightDesc = 'No tide changes during night window (8 PM – 2 AM).'
  if (nightEvents.length > 0) {
    const first = nightEvents[0]
    const last  = nightEvents[nightEvents.length - 1]
    if (first.type === 'L') {
      nightDesc = `Rising tide from ${formatTideTime(first.t)} — good movement during fishing hours.`
    } else if (first.type === 'H') {
      nightDesc = `Falling tide from ${formatTideTime(first.t)} — active current during fishing hours.`
    }
    if (nightEvents.length > 1 && last !== first) {
      nightDesc += ` Turns at ${formatTideTime(last.t)}.`
    }
  }

  return (
    <div>
      {/* All-day tide events */}
      <div className="space-y-1 mb-3">
        {dayEvents.map((event, i) => {
          const prev = dayEvents[i - 1] ?? null
          const dirBefore = getDirectionBetween(prev, event)

          return (
            <div key={event.t}>
              {/* Directional arrow between events */}
              {dirBefore && (
                <div className="flex items-center gap-2 py-0.5 px-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">
                    {dirBefore === 'rising' ? '↑ rising' : '↓ falling'}
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}

              {/* Tide event row */}
              <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${event.type === 'H' ? 'text-blue-300' : 'text-cyan-300'}`}>
                    {event.type === 'H' ? '▲' : '▼'}
                  </span>
                  <div>
                    <span className="text-white text-sm font-medium">
                      {event.type === 'H' ? 'High' : 'Low'} Tide
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white text-sm font-semibold">{event.height.toFixed(1)} ft</div>
                  <div className="text-white/50 text-xs">{formatTideTime(event.t)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Night window description */}
      <div className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 px-3 py-2">
        <p className="text-xs text-cyan-200/80 leading-relaxed">
          <span className="font-semibold text-cyan-300">Night window: </span>
          {nightDesc}
        </p>
      </div>
    </div>
  )
}
