// useTides.js — Fetches and caches NOAA CO-OPS tide predictions for 60 days
//
// API: https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
// Station: 8775870 (Bob Hall Pier / Corpus Christi Bay)
// Product: hilo predictions (high/low events only, not hourly)
// Units: English (feet), local time (CDT/CST)
//
// Returns:
//   tides   — Map<"YYYY-MM-DD", TideEvent[]> or null while loading
//   loading — boolean
//   error   — Error | null

import { useState, useEffect } from 'react'
import { parseTidesByDay } from '../utils/tideParser'
import { toNoaaDate } from '../utils/dateHelpers'

const STATION = '8775870'
const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter'

function buildNoaaUrl(beginDate, endDate) {
  const params = new URLSearchParams({
    begin_date: beginDate,
    end_date: endDate,
    station: STATION,
    product: 'predictions',
    datum: 'MLLW',
    time_zone: 'lst_ldt',   // returns times in local CDT/CST — no tz math needed
    interval: 'hilo',        // high/low events only
    units: 'english',        // feet
    application: 'fishing_forecast',
    format: 'json',
  })
  return `${NOAA_BASE}?${params.toString()}`
}

export function useTides() {
  const [tides, setTides] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchTides() {
      try {
        const today = new Date()
        const end = new Date(today)
        end.setDate(today.getDate() + 60)

        const url = buildNoaaUrl(toNoaaDate(today), toNoaaDate(end))
        const res = await fetch(url)

        if (!res.ok) throw new Error(`NOAA request failed: ${res.status}`)

        const json = await res.json()

        // NOAA returns { error: { message: "..." } } on API-level failures
        if (json.error) throw new Error(`NOAA API error: ${json.error.message}`)

        const byDay = parseTidesByDay(json.predictions)

        if (!cancelled) setTides(byDay)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTides()
    return () => { cancelled = true }
  }, [])

  return { tides, loading, error }
}
