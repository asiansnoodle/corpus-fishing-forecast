// useWeather.js — Fetches and caches Open-Meteo daily + hourly forecast for 16 days
//
// Daily variables: wind, precip total, weather code, temp max/min
// Hourly variables: precipitation per hour (for rain timing)
//
// Both are fetched in a single API call. Hourly data is stored as a 24-entry array
// on each weatherDay object so the detail panel can show rain timing windows.
//
// Returns:
//   weather — Map<"YYYY-MM-DD", WeatherDay> or null while loading
//   loading — boolean
//   error   — Error | null
//
// WeatherDay shape:
//   {
//     windspeedMax:  number    — max wind speed in mph
//     precipMm:      number    — total precipitation in mm
//     weatherCode:   number    — WMO weather code (maps to icon/label via weatherCode.js)
//     tempMax:       number    — daytime high in °F
//     tempMin:       number    — overnight low in °F
//     hourlyPrecip:  number[]  — 24 values (mm/hr), index = CDT hour
//   }

import { useState, useEffect } from 'react'

const LAT = 27.5806
const LNG = -97.2089
const FORECAST_DAYS = 16

function buildWeatherUrl() {
  const params = new URLSearchParams({
    latitude:      LAT,
    longitude:     LNG,
    daily: [
      'windspeed_10m_max',
      'precipitation_sum',
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
    ].join(','),
    hourly:           'precipitation',   // per-hour rain amounts for timing
    timezone:         'America/Chicago', // CDT/CST — matches all other date handling
    forecast_days:    FORECAST_DAYS,
    wind_speed_unit:  'mph',
    temperature_unit: 'fahrenheit',
  })
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`
}

export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchWeather() {
      try {
        const res = await fetch(buildWeatherUrl())
        if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`)

        const json = await res.json()
        if (json.reason) throw new Error(`Open-Meteo API error: ${json.reason}`)

        const byDay = parseWeather(json.daily, json.hourly)
        if (!cancelled) setWeather(byDay)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchWeather()
    return () => { cancelled = true }
  }, [])

  return { weather, loading, error }
}

/**
 * Parse Open-Meteo daily + hourly response into a Map keyed by "YYYY-MM-DD".
 *
 * Daily arrays are parallel (same index = same day).
 * Hourly array has 16 × 24 = 384 entries; each time string is "YYYY-MM-DDTHH:00".
 */
function parseWeather(daily, hourly) {
  // Build per-day hourly precip lookup first
  const hourlyByDay = new Map()

  if (hourly?.time) {
    for (let i = 0; i < hourly.time.length; i++) {
      const t      = hourly.time[i]           // "2026-04-08T14:00"
      const dayKey = t.substring(0, 10)       // "2026-04-08"
      const hour   = parseInt(t.substring(11, 13))
      const precip = hourly.precipitation?.[i] ?? 0

      if (!hourlyByDay.has(dayKey)) hourlyByDay.set(dayKey, Array(24).fill(0))
      hourlyByDay.get(dayKey)[hour] = precip
    }
  }

  // Build per-day weather map
  const byDay = new Map()

  for (let i = 0; i < daily.time.length; i++) {
    const dayKey = daily.time[i] // "YYYY-MM-DD"
    byDay.set(dayKey, {
      windspeedMax:  daily.windspeed_10m_max[i],
      precipMm:      daily.precipitation_sum[i] ?? 0,
      weatherCode:   daily.weathercode[i],
      tempMax:       daily.temperature_2m_max[i],
      tempMin:       daily.temperature_2m_min[i],
      hourlyPrecip:  hourlyByDay.get(dayKey) ?? Array(24).fill(0),
    })
  }

  return byDay
}
