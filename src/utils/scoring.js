// scoring.js — Core fishing score algorithm
//
// Full score  (days 1–16):  tide 30% + moon 25% + wind 20% + rain 15% + temp 10%
// Partial score (days 17–60): tide 55% + moon 45%
//
// All factor functions return 0–100. computeFullScore / computePartialScore
// return { score, stars, label, isPartial, breakdown } where breakdown holds
// each factor's raw score for display in the detail panel.

// ---------------------------------------------------------------------------
// Tide scoring
// ---------------------------------------------------------------------------

// Night fishing window: 8pm (hour 20) to 2am next day (hour 2).
// We treat this as hours [20, 21, 22, 23, 0, 1, 2] in CDT.
const NIGHT_START = 20  // 8pm CDT
const NIGHT_END   = 2   // 2am CDT (next calendar day)

/**
 * Return true if a CDT hour falls within the 8pm–2am night fishing window.
 * @param {number} hour — CDT hour 0–23
 */
function isNightHour(hour) {
  return hour >= NIGHT_START || hour <= NIGHT_END
}

/**
 * Score tide movement quality for the 8pm–2am night fishing window.
 *
 * Strategy:
 *   1. Find all tide events that fall within the night window, plus the
 *      bracketing events immediately before and after it.
 *   2. Compute tidal range = max height − min height among those events.
 *      Corpus Christi is a microtidal area — typical range is 0.5–2.5 ft.
 *      We scale: ≥1.5 ft = full score, ≤0.3 ft = zero.
 *   3. Penalize slack: if the nearest event to the middle of the window
 *      (11pm) is a High or Low (i.e. we're sitting right at slack), cut score.
 *   4. Bonus if tide is actively transitioning (L→H or H→L) through the window.
 *
 * @param {Array} windowEvents — sorted TideEvents spanning prev+today+next day
 *                               (output of getEventsForWindow from tideParser)
 * @param {string} dayKey      — "YYYY-MM-DD" of the day being scored
 * @returns {number} 0–100
 */
export function scoreTide(windowEvents, dayKey) {
  if (!windowEvents || windowEvents.length === 0) return 0

  // Collect events that fall within the night window for this dayKey.
  // The window spans two calendar days: dayKey evening + next day early morning.
  const [year, month, day] = dayKey.split('-').map(Number)
  const nextDay = new Date(year, month - 1, day + 1)
  const nextDayKey = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`

  const inWindow = windowEvents.filter(e => {
    if (e.t.startsWith(dayKey)     && e.hour >= NIGHT_START) return true
    if (e.t.startsWith(nextDayKey) && e.hour <= NIGHT_END)   return true
    return false
  })

  // Also grab the last event before the window and first event after,
  // so we can measure the full transition even if no events fall inside.
  const beforeWindow = windowEvents.filter(e => e.t.startsWith(dayKey) && e.hour < NIGHT_START)
  const afterWindow  = windowEvents.filter(e => e.t.startsWith(nextDayKey) && e.hour > NIGHT_END)

  const relevant = [
    ...(beforeWindow.length ? [beforeWindow[beforeWindow.length - 1]] : []),
    ...inWindow,
    ...(afterWindow.length  ? [afterWindow[0]] : []),
  ]

  if (relevant.length === 0) return 0

  // Tidal range among relevant events
  const heights = relevant.map(e => e.height)
  const range = Math.max(...heights) - Math.min(...heights)

  // Scale range: 0.3 ft = 0, 1.5 ft = 100 (linear, clamped)
  const RANGE_MIN = 0.3
  const RANGE_MAX = 1.5
  const rangeScore = Math.min(100, Math.max(0,
    ((range - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)) * 100
  ))

  // Movement bonus: does the tide transition through the window (L→H or H→L)?
  // If relevant events contain both an H and an L, the tide is moving through.
  const hasHigh = relevant.some(e => e.type === 'H')
  const hasLow  = relevant.some(e => e.type === 'L')
  const isTransitioning = hasHigh && hasLow

  // Slack penalty: if the only event inside the window is a turning point
  // (slack tide), the action happens before/after the fishing hours.
  const windowEventsOnly = inWindow
  const isSlack = windowEventsOnly.length === 1 && !isTransitioning

  let score = rangeScore
  if (isTransitioning) score = Math.min(100, score * 1.15)  // +15% bonus
  if (isSlack)         score = score * 0.6                  // −40% slack penalty

  return Math.round(score)
}

// ---------------------------------------------------------------------------
// Moon scoring
// ---------------------------------------------------------------------------

/**
 * Score moon phase for night pier fishing.
 * Full and New moons drive the strongest fish activity and bait movement.
 *
 * Phase scores per CLAUDE.md spec:
 *   Full Moon (0.4375–0.5625)       → 100
 *   New Moon  (<0.0625 or ≥0.9375)  → 85
 *   Waning/Waxing Gibbous           → 70
 *   Quarter moons                   → 50
 *   Crescent moons                  → 30
 *
 * Bonus: +10 if it's a full moon AND moonrise is after 6pm CDT (moon is up
 * during the prime fishing hours). Capped at 100.
 *
 * @param {number}    phase    — SunCalc phase 0–1
 * @param {number}    fraction — illumination fraction 0–1 (unused in base score, kept for future use)
 * @param {Date|null} moonrise — moonrise time as a Date (or null)
 * @returns {number} 0–100
 */
export function scoreMoon(phase, fraction, moonrise) {
  let base

  if (phase < 0.0625 || phase >= 0.9375) {
    base = 85 // New Moon
  } else if (phase < 0.1875 || (phase >= 0.8125 && phase < 0.9375)) {
    base = 30 // Crescent (waxing or waning)
  } else if (phase < 0.3125 || (phase >= 0.6875 && phase < 0.8125)) {
    base = 50 // Quarter moons
  } else if (phase < 0.4375 || (phase >= 0.5625 && phase < 0.6875)) {
    base = 70 // Gibbous (waxing or waning)
  } else {
    base = 100 // Full Moon (0.4375–0.5625)
  }

  // Full moon bonus: moon rises after 6pm CDT → it's up during the fishing window
  const isFullMoon = phase >= 0.4375 && phase < 0.5625
  if (isFullMoon && moonrise) {
    // moonrise is a Date object; extract CDT hour
    const riseHourCDT = new Date(moonrise).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      hour12: false,
    })
    if (parseInt(riseHourCDT, 10) >= 18) {
      base = Math.min(100, base + 10)
    }
  }

  return base
}

// ---------------------------------------------------------------------------
// Wind scoring
// ---------------------------------------------------------------------------

/**
 * Score wind speed for night pier fishing. Calmer = better.
 * Uses linear interpolation within each band for smooth transitions.
 *
 *  0–10 mph  → 100–70  (great to good)
 * 10–15 mph  → 70–40   (getting rough)
 * 15–20 mph  → 40–10   (difficult)
 * 20+ mph    → 10       (poor, not zero — you can still fish, barely)
 *
 * @param {number} windspeedMax — max wind speed in mph
 * @returns {number} 0–100
 */
export function scoreWind(windspeedMax) {
  if (windspeedMax === null || windspeedMax === undefined) return 50 // no data, neutral
  if (windspeedMax <= 10)  return Math.round(lerp(100, 70, windspeedMax / 10))
  if (windspeedMax <= 15)  return Math.round(lerp(70,  40, (windspeedMax - 10) / 5))
  if (windspeedMax <= 20)  return Math.round(lerp(40,  10, (windspeedMax - 15) / 5))
  return 10
}

// ---------------------------------------------------------------------------
// Precipitation scoring
// ---------------------------------------------------------------------------

/**
 * Score precipitation. No rain is best; heavy rain makes fishing miserable.
 *
 *  0 mm        → 100
 *  0–2 mm      → 100–60  (light drizzle, fishable)
 *  2–10 mm     → 60–30   (moderate rain)
 *  10+ mm      → 5        (heavy rain, stay home)
 *
 * @param {number} precipMm — total precipitation in mm
 * @returns {number} 0–100
 */
export function scorePrecip(precipMm) {
  if (precipMm === null || precipMm === undefined) return 100
  if (precipMm === 0)    return 100
  if (precipMm <= 2)     return Math.round(lerp(100, 60, precipMm / 2))
  if (precipMm <= 10)    return Math.round(lerp(60,  30, (precipMm - 2) / 8))
  return 5
}

// ---------------------------------------------------------------------------
// Temperature scoring
// ---------------------------------------------------------------------------

/**
 * Score overnight low temperature for Gulf Coast inshore fishing.
 * Optimal range: 65–85°F. Fish activity drops significantly outside this range.
 *
 *  <45°F       → 0    (too cold, fish sluggish/gone)
 *  45–65°F     → 0–70 (cool, fish slowing down)
 *  65–85°F     → 100  (prime range, linear peak)
 *  85–95°F     → 100–50 (warm, still fishable but less active at night)
 *  >95°F       → 20   (very hot, fish deep or nocturnal but stressed)
 *
 * @param {number} tempMinF — overnight low temperature in °F
 * @returns {number} 0–100
 */
export function scoreTemp(tempMinF) {
  if (tempMinF === null || tempMinF === undefined) return 50 // no data, neutral
  if (tempMinF < 45)   return 0
  if (tempMinF < 65)   return Math.round(lerp(0,   70,  (tempMinF - 45) / 20))
  if (tempMinF <= 85)  return 100
  if (tempMinF <= 95)  return Math.round(lerp(100, 50,  (tempMinF - 85) / 10))
  return 20
}

// ---------------------------------------------------------------------------
// Composite score functions
// ---------------------------------------------------------------------------

/**
 * Compute full fishing score using all five factors (days 1–16).
 *
 * @param {object} params
 * @param {Array}       params.windowEvents  — tide events from getEventsForWindow()
 * @param {string}      params.dayKey        — "YYYY-MM-DD"
 * @param {number}      params.moonPhase     — SunCalc phase 0–1
 * @param {number}      params.moonFraction  — illumination fraction 0–1
 * @param {Date|null}   params.moonrise      — moonrise time
 * @param {number}      params.windspeedMax  — mph
 * @param {number}      params.precipMm      — mm
 * @param {number}      params.tempMinF      — °F overnight low
 *
 * @returns {{ score, stars, label, isPartial, breakdown }}
 */
export function computeFullScore({ windowEvents, dayKey, moonPhase, moonFraction, moonrise, windspeedMax, precipMm, tempMinF }) {
  const tideScore  = scoreTide(windowEvents, dayKey)
  const moonScore  = scoreMoon(moonPhase, moonFraction, moonrise)
  const windScore  = scoreWind(windspeedMax)
  const precipScore = scorePrecip(precipMm)
  const tempScore  = scoreTemp(tempMinF)

  const score = Math.round(
    tideScore   * 0.30 +
    moonScore   * 0.25 +
    windScore   * 0.20 +
    precipScore * 0.15 +
    tempScore   * 0.10
  )

  return {
    score,
    ...scoreToStars(score),
    isPartial: false,
    breakdown: { tideScore, moonScore, windScore, precipScore, tempScore },
  }
}

/**
 * Compute partial fishing score using tide + moon only (days 17–60).
 * Weather data is not reliable beyond 16 days.
 *
 * @param {object} params
 * @param {Array}     params.windowEvents — tide events from getEventsForWindow()
 * @param {string}    params.dayKey       — "YYYY-MM-DD"
 * @param {number}    params.moonPhase    — SunCalc phase 0–1
 * @param {number}    params.moonFraction — illumination fraction 0–1
 * @param {Date|null} params.moonrise     — moonrise time
 *
 * @returns {{ score, stars, label, isPartial, breakdown }}
 */
// Uncertainty discount applied to all partial scores.
// Weather (wind, rain, temp) accounts for 45% of a full score and can only
// hurt — bad weather never helps. Since we have no weather data beyond 16 days,
// we discount partial scores to reflect that unknown downside risk.
const PARTIAL_UNCERTAINTY_DISCOUNT = 0.90

export function computePartialScore({ windowEvents, dayKey, moonPhase, moonFraction, moonrise }) {
  const tideScore = scoreTide(windowEvents, dayKey)
  const moonScore = scoreMoon(moonPhase, moonFraction, moonrise)

  const rawScore = tideScore * 0.55 + moonScore * 0.45
  const score    = Math.round(rawScore * PARTIAL_UNCERTAINTY_DISCOUNT)

  return {
    score,
    ...scoreToStars(score),
    isPartial: true,
    breakdown: { tideScore, moonScore },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a numeric score to star count and label.
 * @param {number} score
 * @returns {{ stars: number, label: string }}
 */
function scoreToStars(score) {
  if (score >= 85) return { stars: 4, label: 'Excellent' }
  if (score >= 70) return { stars: 3, label: 'Good' }
  if (score >= 50) return { stars: 2, label: 'Fair' }
  return { stars: 1, label: 'Poor' }
}

/**
 * Linear interpolation between a and b at position t (0–1).
 * Used to smooth score transitions within each band.
 */
function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}
