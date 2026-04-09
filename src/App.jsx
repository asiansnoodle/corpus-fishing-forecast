// App.jsx — Root component
// Orchestrates data from all three hooks, computes 60-day scored array,
// and manages which day (if any) is open in the detail panel.

import { useState, useMemo } from 'react'
import Calendar from './components/Calendar'
import DayDetail from './components/DayDetail'
import { useTides } from './hooks/useTides'
import { useWeather } from './hooks/useWeather'
import { useMoon } from './hooks/useMoon'
import { computeFullScore, computePartialScore } from './utils/scoring'
import { getEventsForWindow } from './utils/tideParser'
import { getNextDays, toDayKey } from './utils/dateHelpers'

export default function App() {
  const { tides, loading: tidesLoading, error: tidesError } = useTides()
  const { weather } = useWeather()
  const { getMoonData } = useMoon()
  const [selectedDayKey, setSelectedDayKey] = useState(null)

  // Build a scored day object for each of the 60 calendar days.
  // Recomputes only when tides or weather data changes.
  const days = useMemo(() => {
    if (!tides) return null

    return getNextDays(60).map((date) => {
      const dayKey      = toDayKey(date)
      const moonData    = getMoonData(date)
      const tideEvents  = tides.get(dayKey) ?? []
      const windowEvents = getEventsForWindow(dayKey, tides)
      const weatherDay  = weather?.get(dayKey) ?? null
      const isPartial   = !weatherDay

      const commonInput = {
        windowEvents,
        dayKey,
        moonPhase:    moonData.phase,
        moonFraction: moonData.fraction,
        moonrise:     moonData.rise,
      }

      const scoreResult = isPartial
        ? computePartialScore(commonInput)
        : computeFullScore({
            ...commonInput,
            windspeedMax: weatherDay.windspeedMax,
            precipMm:     weatherDay.precipMm,
            tempMinF:     weatherDay.tempMin,
          })

      return {
        date,
        dayKey,
        ...scoreResult,   // score, stars, label, isPartial, breakdown
        tideEvents,
        windowEvents,     // multi-day event array used for fishing window calculation
        moonData,
        weather: isPartial ? null : weatherDay,
      }
    })
  }, [tides, weather, getMoonData])

  const selectedDay = selectedDayKey && days
    ? days.find(d => d.dayKey === selectedDayKey) ?? null
    : null

  return (
    <div className="min-h-screen">
      <header className="text-center pt-8 pb-6 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg tracking-tight">
          Corpus Christi Fishing Forecast
        </h1>
        <p className="text-cyan-200 mt-2 text-sm">
          Inshore pier night fishing · Redfish · Speckled Trout · Flounder
        </p>
      </header>

      {tidesError ? (
        <div className="flex items-center justify-center py-20 px-4">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center max-w-sm">
            <p className="text-white text-lg font-medium">Unable to load tide data</p>
            <p className="text-cyan-200 text-sm mt-2">Check your connection and refresh the page.</p>
          </div>
        </div>
      ) : tidesLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cyan-200 text-sm">Loading forecast data...</p>
          </div>
        </div>
      ) : (
        <Calendar days={days} onDayClick={setSelectedDayKey} selectedDayKey={selectedDayKey} />
      )}

      {selectedDay && (
        <DayDetail day={selectedDay} onClose={() => setSelectedDayKey(null)} />
      )}
    </div>
  )
}
