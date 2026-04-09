// tideParser.js — Parses NOAA CO-OPS hilo response into a per-day structure
//
// NOAA returns timestamps in CDT/CST (local time) when time_zone=lst_ldt is requested,
// so we extract the date key and hour/minute directly from the string — no timezone
// conversion needed.
//
// Input:  raw NOAA predictions array, e.g. [{ t: "2026-04-08 06:42", v: "1.23", type: "H" }, ...]
// Output: Map<"YYYY-MM-DD", Array<TideEvent>>
//
// TideEvent shape:
//   {
//     t:      string  — raw NOAA timestamp "YYYY-MM-DD HH:MM" (CDT/CST)
//     height: number  — tide height in feet
//     type:   'H'|'L' — high or low
//     hour:   number  — CDT/CST hour (0–23), used for night window scoring
//     minute: number  — CDT/CST minute
//   }

/**
 * Parse raw NOAA hilo predictions into a Map keyed by "YYYY-MM-DD".
 * Events within each day are sorted chronologically.
 * @param {Array} predictions
 * @returns {Map<string, Array>}
 */
export function parseTidesByDay(predictions) {
  const byDay = new Map()

  for (const p of predictions) {
    // t is already in local CDT/CST: "YYYY-MM-DD HH:MM"
    const dayKey = p.t.substring(0, 10)
    const timePart = p.t.substring(11) // "HH:MM"
    const [hour, minute] = timePart.split(':').map(Number)

    const event = {
      t: p.t,
      height: parseFloat(p.v),
      type: p.type,  // 'H' or 'L'
      hour,
      minute,
    }

    if (!byDay.has(dayKey)) byDay.set(dayKey, [])
    byDay.get(dayKey).push(event)
  }

  // Each day's events arrive in order from NOAA, but sort defensively
  for (const events of byDay.values()) {
    events.sort((a, b) => a.t.localeCompare(b.t))
  }

  return byDay
}

/**
 * Determine if the tide is rising or falling at a given CDT hour.
 *
 * Strategy: find the tide event immediately before and after the given hour.
 * Between a Low and the next High → rising.
 * Between a High and the next Low → falling.
 *
 * Pass a combined array of events that spans the surrounding days (e.g. previous
 * day's last event + today's events + tomorrow's first event) for accurate results
 * at day boundaries.
 *
 * @param {number} cdtHour     — hour in CDT/CST (0–23) to evaluate
 * @param {string} dayKey      — "YYYY-MM-DD" of the day being evaluated
 * @param {Array}  allEvents   — sorted TideEvents spanning multiple days
 * @returns {'rising'|'falling'|'unknown'}
 */
export function getTideDirection(cdtHour, dayKey, allEvents) {
  // Build a comparable timestamp string for the query time
  const queryT = `${dayKey} ${String(cdtHour).padStart(2, '0')}:00`

  // Find the last event before queryT and the first event after
  let before = null
  let after = null

  for (const event of allEvents) {
    if (event.t <= queryT) {
      before = event
    } else if (after === null) {
      after = event
      break
    }
  }

  if (!before && !after) return 'unknown'
  if (!before) return after.type === 'H' ? 'rising' : 'falling'
  if (!after)  return before.type === 'H' ? 'falling' : 'rising'

  // Between before and after: if before is L and after is H → rising
  if (before.type === 'L' && after.type === 'H') return 'rising'
  if (before.type === 'H' && after.type === 'L') return 'falling'

  return 'unknown'
}

/**
 * Convert a NOAA timestamp string to minutes since midnight of a reference day.
 * Works across day boundaries: events from the previous day return negative values,
 * events from the next day return values > 1440.
 * @param {string} t      — "YYYY-MM-DD HH:MM"
 * @param {string} dayKey — "YYYY-MM-DD" reference day
 * @returns {number} minutes since midnight of dayKey
 */
function toMinsFromMidnight(t, dayKey) {
  const tDate   = t.substring(0, 10)
  const tHour   = parseInt(t.substring(11, 13))
  const tMin    = parseInt(t.substring(14, 16))
  const [dy, dm, dd] = dayKey.split('-').map(Number)
  const [ty, tm, td] = tDate.split('-').map(Number)
  const dayOffset = Math.round(
    (new Date(ty, tm - 1, td) - new Date(dy, dm - 1, dd)) / 86400000
  )
  return dayOffset * 1440 + tHour * 60 + tMin
}

/** Format minutes-since-midnight to a 12h time string like "8:30 PM" */
function minsToTimeLabel(mins) {
  const normalised = ((mins % 1440) + 1440) % 1440
  const h = Math.floor(normalised / 60)
  const m = normalised % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour   = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Calculate fishing quality windows for a day by examining every tide transition
 * (Low→High = rising, High→Low = falling) that overlaps with the day.
 *
 * Each window is scored on:
 *   - Tide direction: rising = better (bait and fish move with incoming water)
 *   - Time of day overlap: night 8pm–2am (+25), dawn 5–9am (+15), dusk 4–7pm (+15)
 *   - Tidal range: larger swing = more water movement = more fish activity (+0–15)
 *
 * @param {Array}  windowEvents — sorted events from getEventsForWindow()
 * @param {string} dayKey       — "YYYY-MM-DD"
 * @returns {Array} windows sorted best-first, each shaped:
 *   {
 *     startLabel: string   — "8:00 PM"
 *     endLabel:   string   — "2:30 AM"
 *     spansNextDay: bool   — true if window crosses midnight into next day
 *     isRising:   bool
 *     fromHeight: number   — starting tide height (ft)
 *     toHeight:   number   — ending tide height (ft)
 *     range:      number   — tidal range (ft)
 *     quality:    number   — 0–100
 *     timeOfDay:  string   — dominant time zone label
 *   }
 */
export function getTideWindows(windowEvents, dayKey) {
  if (!windowEvents || windowEvents.length < 2) return []

  // Time-of-day zones in minutes from midnight, with fishing quality bonuses
  const zones = [
    { label: 'Night',   start: 0,    end: 120,  bonus: 25 }, // midnight–2am
    { label: 'Morning', start: 300,  end: 540,  bonus: 15 }, // 5am–9am
    { label: 'Day',     start: 540,  end: 960,  bonus: 0  }, // 9am–4pm
    { label: 'Evening', start: 960,  end: 1140, bonus: 15 }, // 4pm–7pm
    { label: 'Night',   start: 1200, end: 1560, bonus: 25 }, // 8pm–2am (next day)
  ]

  const windows = []

  for (let i = 0; i < windowEvents.length - 1; i++) {
    const from = windowEvents[i]
    const to   = windowEvents[i + 1]

    const startMins = toMinsFromMidnight(from.t, dayKey)
    const endMins   = toMinsFromMidnight(to.t,   dayKey)

    // Only include windows that overlap with the calendar day (0–1440 mins)
    if (endMins <= 0 || startMins >= 1440) continue

    const isRising = from.type === 'L'
    const range    = Math.abs(to.height - from.height)

    // Score time-of-day overlap: find the zone with most effective overlap
    let bestBonus    = 0
    let bestZoneLabel = 'Day'
    const windowDur  = endMins - startMins

    for (const zone of zones) {
      const overlapStart = Math.max(startMins, zone.start)
      const overlapEnd   = Math.min(endMins,   zone.end)
      if (overlapEnd <= overlapStart) continue
      const fraction       = (overlapEnd - overlapStart) / windowDur
      const effectiveBonus = zone.bonus * fraction
      if (effectiveBonus > bestBonus) {
        bestBonus      = effectiveBonus
        bestZoneLabel  = zone.label
      }
    }

    const rangeBonus = Math.min(15, range * 10)
    const quality    = Math.round((isRising ? 60 : 35) + bestBonus + rangeBonus)

    windows.push({
      startLabel:   minsToTimeLabel(startMins),
      endLabel:     minsToTimeLabel(endMins),
      spansNextDay: endMins > 1440,
      isRising,
      fromHeight:   from.height,
      toHeight:     to.height,
      range:        parseFloat(range.toFixed(2)),
      quality,
      timeOfDay:    bestZoneLabel,
    })
  }

  return windows.sort((a, b) => b.quality - a.quality)
}

/**
 * Build a flat sorted array of tide events spanning the day before, the target day,
 * and the day after — used to accurately resolve tide direction at day boundaries.
 * @param {string} dayKey        — "YYYY-MM-DD"
 * @param {Map}    tidesByDay    — full Map from parseTidesByDay
 * @returns {Array}
 */
export function getEventsForWindow(dayKey, tidesByDay) {
  const [year, month, day] = dayKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const prevDate = new Date(date); prevDate.setDate(date.getDate() - 1)
  const nextDate = new Date(date); nextDate.setDate(date.getDate() + 1)

  const toKey = d =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const events = [
    ...(tidesByDay.get(toKey(prevDate)) ?? []),
    ...(tidesByDay.get(dayKey)          ?? []),
    ...(tidesByDay.get(toKey(nextDate)) ?? []),
  ]

  return events.sort((a, b) => a.t.localeCompare(b.t))
}
