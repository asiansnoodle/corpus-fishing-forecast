// useWeather.js — Fetches and caches Open-Meteo forecast data for 16 days
// Coordinates: 27.5806, -97.2089 (Corpus Christi Bay)
// Returns: per-day weather object with wind, rain, temp, and weather code

import { useState, useEffect } from 'react'

export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // TODO: fetch Open-Meteo daily forecast and store per-day weather data
  }, [])

  return { weather, loading, error }
}
