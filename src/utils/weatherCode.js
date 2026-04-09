// weatherCode.js — WMO weather code interpretation and rain timing helpers
//
// Open-Meteo returns WMO weather codes for daily and hourly conditions.
// Reference: https://open-meteo.com/en/docs (weathercode section)

/**
 * Map a WMO weather code to a human-readable condition.
 * @param {number} code
 * @returns {{ icon: string, label: string, isRainy: boolean }}
 */
export function getWeatherCondition(code) {
  if (code === 0)           return { icon: '☀️',  label: 'Clear',           isRainy: false }
  if (code === 1)           return { icon: '🌤️',  label: 'Mostly Clear',    isRainy: false }
  if (code === 2)           return { icon: '⛅',  label: 'Partly Cloudy',   isRainy: false }
  if (code === 3)           return { icon: '☁️',  label: 'Overcast',        isRainy: false }
  if (code <= 48)           return { icon: '🌫️',  label: 'Foggy',           isRainy: false }
  if (code <= 55)           return { icon: '🌦️',  label: 'Drizzle',         isRainy: true  }
  if (code === 61)          return { icon: '🌧️',  label: 'Light Rain',      isRainy: true  }
  if (code === 63)          return { icon: '🌧️',  label: 'Moderate Rain',   isRainy: true  }
  if (code === 65)          return { icon: '🌧️',  label: 'Heavy Rain',      isRainy: true  }
  if (code <= 75)           return { icon: '🌨️',  label: 'Snow',            isRainy: false }
  if (code <= 82)           return { icon: '🌧️',  label: 'Rain Showers',    isRainy: true  }
  if (code <= 99)           return { icon: '⛈️',  label: 'Thunderstorm',    isRainy: true  }
  return                           { icon: '🌥️',  label: 'Cloudy',          isRainy: false }
}

/**
 * Find consecutive rainy hours within a 24-entry hourly precipitation array.
 * Groups hours with precip >= threshold into contiguous windows.
 *
 * @param {number[]} hourlyPrecip — 24 values (mm/hr), index = hour of day
 * @param {number}   threshold   — min mm/hr to count as rain (default 0.1)
 * @returns {Array<{ startHour: number, endHour: number, totalMm: number }>}
 */
export function getRainWindows(hourlyPrecip, threshold = 0.1) {
  const windows = []
  let start = null
  let totalMm = 0

  for (let h = 0; h < 24; h++) {
    const precip = hourlyPrecip[h] ?? 0
    const rainy  = precip >= threshold

    if (rainy && start === null) {
      start   = h
      totalMm = 0
    }
    if (rainy) totalMm += precip

    if (!rainy && start !== null) {
      windows.push({ startHour: start, endHour: h, totalMm: parseFloat(totalMm.toFixed(1)) })
      start   = null
      totalMm = 0
    }
  }

  // Close any window still open at midnight
  if (start !== null) {
    windows.push({ startHour: start, endHour: 24, totalMm: parseFloat(totalMm.toFixed(1)) })
  }

  return windows
}

/**
 * Format an hour number (0–24) to a short 12h label like "2 PM" or "12 AM".
 * Hour 24 is treated as midnight (end of day).
 * @param {number} h
 * @returns {string}
 */
export function formatHourLabel(h) {
  const norm = h % 24
  if (norm === 0)  return '12 AM'
  if (norm === 12) return '12 PM'
  return norm < 12 ? `${norm} AM` : `${norm - 12} PM`
}
