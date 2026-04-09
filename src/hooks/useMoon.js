// useMoon.js — Calculates moon phase data via suncalc (no API, pure math)
//
// SunCalc computes moon data from date + lat/lng. No network requests.
// This hook exposes a single getMoonData(date) function that the parent
// component calls for each of the 60 calendar days.
//
// getMoonData(date) returns:
//   {
//     fraction:  number   — illumination fraction 0–1 (0 = dark, 1 = full)
//     phase:     number   — SunCalc phase value 0–1 (used for scoring)
//     phaseName: string   — e.g. "Full Moon", "Waxing Crescent"
//     phaseIcon: string   — emoji moon icon
//     rise:      Date|null — moonrise time (null if moon doesn't rise that day)
//     set:       Date|null — moonset time (null if moon doesn't set that day)
//   }

import SunCalc from 'suncalc'
import { getMoonPhaseName } from '../utils/moonPhase'

const LAT = 27.5806
const LNG = -97.2089

export function useMoon() {
  function getMoonData(date) {
    const illum = SunCalc.getMoonIllumination(date)
    const times = SunCalc.getMoonTimes(date, LAT, LNG)
    const { name: phaseName, icon: phaseIcon } = getMoonPhaseName(illum.phase)

    return {
      fraction:  illum.fraction,
      phase:     illum.phase,
      phaseName,
      phaseIcon,
      rise: times.rise  ?? null,
      set:  times.set   ?? null,
    }
  }

  return { getMoonData }
}
