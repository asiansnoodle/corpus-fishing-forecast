// moonPhase.js — Maps SunCalc phase value (0–1) to a phase name and emoji icon

/**
 * Map a SunCalc phase value to a human-readable name and icon.
 * @param {number} phase - SunCalc phase value 0–1
 * @returns {{ name: string, icon: string }}
 */
export function getMoonPhaseName(phase) {
  if (phase < 0.0625 || phase >= 0.9375) return { name: 'New Moon',        icon: '🌑' }
  if (phase < 0.1875)                    return { name: 'Waxing Crescent',  icon: '🌒' }
  if (phase < 0.3125)                    return { name: 'First Quarter',    icon: '🌓' }
  if (phase < 0.4375)                    return { name: 'Waxing Gibbous',   icon: '🌔' }
  if (phase < 0.5625)                    return { name: 'Full Moon',        icon: '🌕' }
  if (phase < 0.6875)                    return { name: 'Waning Gibbous',   icon: '🌖' }
  if (phase < 0.8125)                    return { name: 'Last Quarter',     icon: '🌗' }
  return                                        { name: 'Waning Crescent',  icon: '🌘' }
}
