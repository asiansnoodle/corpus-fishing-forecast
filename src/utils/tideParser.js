// tideParser.js — Parses NOAA CO-OPS hilo response into a per-day structure
// Input: raw NOAA JSON predictions array
// Output: Map of "YYYY-MM-DD" => Array<{ time: Date, height: number, type: 'H'|'L' }>

/**
 * Parse raw NOAA predictions into a per-day Map.
 * @param {Array} predictions - Array from NOAA predictions response
 * @returns {Map<string, Array>} keyed by "YYYY-MM-DD"
 */
export function parseTidesByDay(predictions) {
  // TODO: group NOAA tide events by local date
  return new Map()
}

/**
 * Determine if the tide is rising or falling at a given time, based on
 * the sequence of high/low events. Between low→high = rising, high→low = falling.
 * @param {Date} time
 * @param {Array} events - Sorted tide events for the day (and adjacent days)
 * @returns {'rising'|'falling'|'unknown'}
 */
export function getTideDirection(time, events) {
  // TODO: find surrounding events and determine direction
  return 'unknown'
}
