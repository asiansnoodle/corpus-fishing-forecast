# Corpus Christi Fishing Forecast

A web-based fishing forecast calendar for anglers planning trips to the Corpus Christi, TX area — including Port Aransas, Padre Island, and Rockport.

Built for people who live away from Corpus and need to plan fishing trips in advance. Check whether a future date will be a good day to fish before committing to the trip.

**Primary use case:** Inshore pier night fishing — Redfish, Speckled Trout, and Flounder.

## Live App

[corpus-fishing-forecast.vercel.app](https://corpus-fishing-forecast.vercel.app)

## How It Works

Each day receives a fishing score (0–100) and a star rating (1–4 stars) based on:

| Factor | Weight (full) | Weight (preview) |
|---|---|---|
| Tide movement (8pm–2am window) | 30% | 55% |
| Moon phase | 25% | 45% |
| Wind speed | 20% | — |
| Precipitation | 15% | — |
| Overnight temperature | 10% | — |

Days within the 16-day weather forecast window receive a **full score** using all five factors. Days beyond 16 days receive a **preview score** based on tide and moon only, with an uncertainty discount applied since weather is unknown.

Clicking any day opens a detail panel with:
- Full score breakdown by factor
- Optimal fishing time windows ranked by tide direction and time of day
- Tide schedule with rising/falling annotations and night window summary
- Moon phase, illumination %, moonrise and moonset times
- Weather condition, wind, rain timing, and overnight temperature (16-day window only)

## Data Sources

| Data | Source | Cost |
|---|---|---|
| Tides | [NOAA CO-OPS API](https://tidesandcurrents.noaa.gov/) — Station 8775870 | Free, no key |
| Weather | [Open-Meteo](https://open-meteo.com/) | Free, no key |
| Moon phase | [suncalc](https://github.com/mourner/suncalc) (local math) | Free, no key |

No backend. No database. No API keys required.

## Tech Stack

- React + Vite
- Tailwind CSS
- suncalc

## Local Development

```bash
npm install
npm run dev
```

## Built By

[asiansnoodle](https://github.com/asiansnoodle)
