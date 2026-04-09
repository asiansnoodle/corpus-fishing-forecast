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
