// dateHelpers.js — Date formatting and timezone utilities
// All dates are handled in America/Chicago (CDT/CST) — the Corpus Christi timezone

const TZ = 'America/Chicago'

/**
 * Format a Date as "YYYYMMDD" for NOAA API requests.
 * @param {Date} date
 * @returns {string}
 */
export function toNoaaDate(date) {
  return date.toLocaleDateString('en-CA', { timeZone: TZ }).replace(/-/g, '')
}

/**
 * Format a Date as "YYYY-MM-DD" for use as a Map key.
 * @param {Date} date
 * @returns {string}
 */
export function toDayKey(date) {
  return date.toLocaleDateString('en-CA', { timeZone: TZ })
}

/**
 * Format a Date to a short time string like "6:30 PM".
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format a Date to a display string like "Wed, Apr 9".
 * @param {Date} date
 * @returns {string}
 */
export function formatDayLabel(date) {
  return date.toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Generate an array of Date objects for the next N days starting from today.
 * @param {number} days
 * @returns {Date[]}
 */
export function getNextDays(days) {
  const result = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    result.push(d)
  }
  return result
}
