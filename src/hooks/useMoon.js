// useMoon.js — Calculates moon phase data via suncalc (no API, pure math)
//
// useCallback ensures getMoonData has a stable reference so App.jsx's
// useMemo dependency array doesn't trigger unnecessary recomputes.

import { useCallback } from 'react'
import SunCalc from 'suncalc'
import { getMoonPhaseName } from '../utils/moonPhase'

const LAT = 27.5806
const LNG = -97.2089

export function useMoon() {
  const getMoonData = useCallback((date) => {
    const illum = SunCalc.getMoonIllumination(date)
    const times = SunCalc.getMoonTimes(date, LAT, LNG)
    const { name: phaseName, icon: phaseIcon } = getMoonPhaseName(illum.phase)

    return {
      fraction:  illum.fraction,
      phase:     illum.phase,
      phaseName,
      phaseIcon,
      rise: times.rise ?? null,
      set:  times.set  ?? null,
    }
  }, [])

  return { getMoonData }
}
