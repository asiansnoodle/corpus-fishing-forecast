// useWeather.js — Fetches and caches Open-Meteo daily forecast data for 16 days
//
// API: https://api.open-meteo.com/v1/forecast
// Coordinates: 27.5806, -97.2089 (Corpus Christi Bay)
// Reliable forecast window: 16 days. Days 17–60 will have no weather data.
//
// Returns:
//   weather — Map<"YYYY-MM-DD", WeatherDay> or null while loading
//   loading — boolean
//   error   — Error | null
//
// WeatherDay shape:
//   {
//     windspeedMax: number   — max wind speed in mph
//     precipMm:    number   — total precipitation in mm
//     weatherCode: number   — WMO weather code
//     tempMax:     number   — daytime high in °F
//     tempMin:     number   — overnight low in °F (used for night fishing temp score)
//   }

import { useState, useEffect } from 'react'

const LAT = 27.5806
const LNG = -97.2089
const FORECAST_DAYS = 16

const OPEN_METEO_URL = new URL('https://api.open-meteo.com/v1/forecast')

function buildWeatherUrl() {
  const params = new URLSearchParams({
    latitude: LAT,
    longitude: LNG,
    daily: [
      'windspeed_10m_max',
      'precipitation_sum',
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
    ].join(','),
    timezone: 'America/Chicago',  // matches CDT/CST used throughout the app
    forecast_days: FORECAST_DAYS,
    wind_speed_unit: 'mph',
    temperature_unit: 'fahrenheit',
  })
  return `${OPEN_METEO_URL}?${params.toString()}`
}

export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchWeather() {
      try {
        const res = await fetch(buildWeatherUrl())
        if (!res.ok) throw new Error(`Open-Meteo request failed: ${res.status}`)

        const json = await res.json()

        // Open-Meteo returns { reason: "..." } on API-level errors
        if (json.reason) throw new Error(`Open-Meteo API error: ${json.reason}`)

        const byDay = parseWeatherByDay(json.daily)

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
 * Transform Open-Meteo's parallel arrays into a Map keyed by "YYYY-MM-DD".
 * Open-Meteo returns { time: [...], windspeed_10m_max: [...], ... } where
 * each index corresponds to the same day across all arrays.
 * @param {object} daily — Open-Meteo daily response object
 * @returns {Map<string, object>}
 */
function parseWeatherByDay(daily) {
  const byDay = new Map()

  for (let i = 0; i < daily.time.length; i++) {
    const dayKey = daily.time[i] // already "YYYY-MM-DD"
    byDay.set(dayKey, {
      windspeedMax: daily.windspeed_10m_max[i],
      precipMm:    daily.precipitation_sum[i] ?? 0,
      weatherCode: daily.weathercode[i],
      tempMax:     daily.temperature_2m_max[i],
      tempMin:     daily.temperature_2m_min[i],
    })
  }

  return byDay
}
