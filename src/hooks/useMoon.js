// useMoon.js — Calculates moon phase data via suncalc (no API needed, pure math)
// Returns a function getMoonData(date) that gives phase, illumination, rise/set times

import SunCalc from 'suncalc'

const LAT = 27.5806
const LNG = -97.2089

export function useMoon() {
  // TODO: expose getMoonData(date) that returns phase name, fraction, rise/set
  function getMoonData(date) {
    const illum = SunCalc.getMoonIllumination(date)
    const times = SunCalc.getMoonTimes(date, LAT, LNG)
    return {
      fraction: illum.fraction,
      phase: illum.phase,
      rise: times.rise,
      set: times.set,
    }
  }

  return { getMoonData }
}
