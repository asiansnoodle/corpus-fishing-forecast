// scoring.js — Core fishing score algorithm
// Full score (days 1–16): tide 30% + moon 25% + wind 20% + rain 15% + temp 10%
// Partial score (days 17–60): tide 55% + moon 45%
// Output: { score: 0–100, stars: 1–4, label: string }

/**
 * Score tide movement quality for the 8pm–2am night fishing window.
 * @param {Array} tideEvents - Array of {t: Date, v: number, type: 'H'|'L'} for the day
 * @returns {number} 0–100
 */
export function scoreTide(tideEvents) {
  // TODO: evaluate tidal range and movement during night window
  return 0
}

/**
 * Score moon phase for night fishing. Full/New moons score highest.
 * @param {number} phase - SunCalc phase value 0–1
 * @param {number} fraction - Illumination fraction 0–1
 * @param {Date|null} moonrise - Moonrise time (null if no rise)
 * @returns {number} 0–100
 */
export function scoreMoon(phase, fraction, moonrise) {
  // TODO: map phase to score with bonus for post-6pm full moon rise
  return 0
}

/**
 * Score wind speed. Lower is better for night pier fishing.
 * @param {number} windspeedMax - Max wind speed in mph
 * @returns {number} 0–100
 */
export function scoreWind(windspeedMax) {
  // TODO: 0–10=100, 10–15=70, 15–20=40, 20+=10
  return 0
}

/**
 * Score precipitation. No rain is best.
 * @param {number} precipMm - Total precipitation in mm
 * @returns {number} 0–100
 */
export function scorePrecip(precipMm) {
  // TODO: 0=100, <2=60, 2–10=30, heavy=5
  return 0
}

/**
 * Score overnight temperature for Gulf Coast inshore fishing (optimal 65–85°F).
 * @param {number} tempMinF - Overnight low temperature in °F
 * @returns {number} 0–100
 */
export function scoreTemp(tempMinF) {
  // TODO: scale down outside 65–85°F range
  return 0
}

/**
 * Compute full fishing score using all five factors (days 1–16).
 * @param {object} params
 * @returns {{ score: number, stars: number, label: string }}
 */
export function computeFullScore({ tideEvents, moonPhase, moonFraction, moonrise, windspeedMax, precipMm, tempMinF }) {
  const tideScore  = scoreTide(tideEvents)
  const moonScore  = scoreMoon(moonPhase, moonFraction, moonrise)
  const windScore  = scoreWind(windspeedMax)
  const precipScore = scorePrecip(precipMm)
  const tempScore  = scoreTemp(tempMinF)

  const score = Math.round(
    tideScore  * 0.30 +
    moonScore  * 0.25 +
    windScore  * 0.20 +
    precipScore * 0.15 +
    tempScore  * 0.10
  )

  return { score, ...scoreToStars(score), isPartial: false }
}

/**
 * Compute partial fishing score using tide + moon only (days 17–60).
 * @param {object} params
 * @returns {{ score: number, stars: number, label: string, isPartial: true }}
 */
export function computePartialScore({ tideEvents, moonPhase, moonFraction, moonrise }) {
  const tideScore = scoreTide(tideEvents)
  const moonScore = scoreMoon(moonPhase, moonFraction, moonrise)

  const score = Math.round(
    tideScore * 0.55 +
    moonScore * 0.45
  )

  return { score, ...scoreToStars(score), isPartial: true }
}

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
