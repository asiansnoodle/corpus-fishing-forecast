// useTides.js — Fetches and caches NOAA CO-OPS tide predictions for 60 days
// Station: 8775870 (Corpus Christi Bay)
// Returns: per-day array of high/low tide events

import { useState, useEffect } from 'react'

export function useTides() {
  const [tides, setTides] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // TODO: fetch NOAA hilo tide predictions and parse into per-day structure
  }, [])

  return { tides, loading, error }
}
