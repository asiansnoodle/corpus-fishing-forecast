# CLAUDE.md — Corpus Christi Fishing Forecast App

## What This Project Is

A web-based fishing forecast calendar app for anglers planning trips to the Corpus Christi, TX
area (including Port Aransas, Padre Island, and Rockport). Built for people who live away from
Corpus and need to plan fishing trips in advance — checking whether a future date will be a good
day to go fishing before committing to the trip.

The primary use case is **inshore pier night fishing** — targeting Redfish, Speckled Trout, and
Flounder. All scoring and condition weighting should reflect this context.

---

## Tech Stack

| Layer            | Technology                        |
|------------------|-----------------------------------|
| Framework        | React + Vite                      |
| Styling          | Tailwind CSS                      |
| Moon math        | suncalc (npm package)             |
| Tides data       | NOAA CO-OPS API (free, no key)    |
| Weather data     | Open-Meteo API (free, no key)     |
| Hosting          | Vercel (free tier, via GitHub)    |

**No backend. No database. No API keys required.** All data is fetched client-side directly
from NOAA and Open-Meteo. Keep the architecture as simple as possible.

---

## Target Location

All data is fetched for a single hardcoded coordinate. Do not build location switching — the
app is intentionally scoped to the Corpus Christi area.

- **Name:** Corpus Christi Bay / Bob Hall Pier area, Texas
- **Latitude:** 27.5806
- **Longitude:** -97.2089
- **NOAA Tide Station ID:** 8775870
- **Timezone:** America/Chicago (CDT/CST)

---

## Data Sources

### Tides — NOAA CO-OPS API

- **Base URL:** `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`
- **Product:** `predictions` with `interval=hilo` (returns high and low tide events only)
- **Station:** `8775870`
- **Format:** JSON
- **Fetch range:** 60 days at a time — NOAA supports years of tide predictions ahead
- **What we get:** A list of high/low tide events with timestamps and heights (in feet)
- **Rising vs falling:** Derived from the sequence of highs and lows — between a low and the
  next high, the tide is rising. Between a high and the next low, it is falling.

Example request:
```
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter
  ?begin_date=20260408
  &end_date=20260607
  &station=8775870
  &product=predictions
  &datum=MLLW
  &time_zone=lst_ldt
  &interval=hilo
  &units=english
  &application=fishing_forecast
  &format=json
```

### Weather — Open-Meteo Forecast API

- **Base URL:** `https://api.open-meteo.com/v1/forecast`
- **Coordinates:** 27.5806, -97.2089
- **Daily variables to request:**
  - `windspeed_10m_max` — max wind speed for the day in mph
  - `precipitation_sum` — total rainfall in mm
  - `weathercode` — WMO weather code (used to determine rain/clear/cloudy)
  - `temperature_2m_max` — daytime high air temp
  - `temperature_2m_min` — overnight low air temp
- **Reliable forecast range:** 16 days
- **Beyond 16 days:** Weather data is not available or reliable. Days 17–60 show partial
  scores only (tide + moon). Do not display weather fields for those days.

### Moon Phase — SunCalc (no API, pure math)

- **Package:** `suncalc` (install via npm)
- **What to calculate per day:**
  - `SunCalc.getMoonIllumination(date)` → gives `fraction` (0–1) and `phase` (0–1)
  - `SunCalc.getMoonTimes(date, lat, lng)` → gives moonrise and moonset times
- **Phase name mapping** (from `phase` value 0–1):
  - 0–0.0625 or 0.9375–1.0 → New Moon
  - 0.0625–0.1875 → Waxing Crescent
  - 0.1875–0.3125 → First Quarter
  - 0.3125–0.4375 → Waxing Gibbous
  - 0.4375–0.5625 → Full Moon
  - 0.5625–0.6875 → Waning Gibbous
  - 0.6875–0.8125 → Last Quarter
  - 0.8125–0.9375 → Waning Crescent
- **Why this matters:** Moon phase is the single most important factor for night pier fishing.
  Full and new moons drive stronger fish activity and feeding windows.

---

## Fishing Score Algorithm

Every day receives a score from **0 to 100** and a **star rating from 1 to 4**.

Days 1–16 (within the weather window) receive a **Full Score** using all five factors.
Days 17–60 (outside the weather window) receive a **Partial Score** using tide and moon only.
Always label partial score days clearly so users know the difference.

### Full Score — Factor Weights

| Factor         | Weight | Scoring Logic                                                                 |
|----------------|--------|-------------------------------------------------------------------------------|
| Tide movement  | 30%    | Strong moving tide during night hours = 100. Slack tide = 0. Score based on  |
|                |        | tidal range and whether tide is actively moving during 8pm–2am window.       |
| Moon phase     | 25%    | Full moon = 100, New moon = 85, Waning/Waxing Gibbous = 70,                  |
|                |        | Quarter moons = 50, Crescent = 30. Bonus: full moon with moonrise after 6pm. |
| Wind speed     | 20%    | 0–10 mph = 100, 10–15 mph = 70, 15–20 mph = 40, 20+ mph = 10                |
| Precipitation  | 15%    | No rain = 100, Light rain (<2mm) = 60, Moderate (2–10mm) = 30, Heavy = 5    |
| Temperature    | 10%    | Optimal Gulf Coast inshore range is 65–85°F overnight. Score scales down     |
|                |        | outside this range. Use min temp (overnight low) for night fishing context.  |

### Partial Score — Factor Weights (days 17–60)

| Factor        | Weight |
|---------------|--------|
| Tide movement | 55%    |
| Moon phase    | 45%    |

### Score to Star Mapping

| Score   | Stars | Label     |
|---------|-------|-----------|
| 85–100  | ★★★★  | Excellent |
| 70–84   | ★★★☆  | Good      |
| 50–69   | ★★☆☆  | Fair      |
| 0–49    | ★☆☆☆  | Poor      |

---

## App Structure

```
src/
├── components/
│   ├── Calendar.jsx        # Main calendar grid — 7-column week layout
│   ├── DayCard.jsx         # Individual day cell with score badge
│   ├── DayDetail.jsx       # Slide-in or modal detail view for a clicked day
│   ├── ScoreBadge.jsx      # Reusable star rating + score display
│   ├── MoonDisplay.jsx     # Moon phase icon + illumination % + rise/set times
│   ├── TidePanel.jsx       # Lists high/low tide events for the day
│   └── ConditionRow.jsx    # Single condition row (wind, rain, temp, etc.)
├── hooks/
│   ├── useTides.js         # Fetches and caches NOAA tide data for 60 days
│   ├── useWeather.js       # Fetches and caches Open-Meteo data for 16 days
│   └── useMoon.js          # Calculates moon data via suncalc for any date
├── utils/
│   ├── scoring.js          # Core fishing score algorithm — full and partial
│   ├── tideParser.js       # Parses NOAA hilo response into per-day structure
│   ├── moonPhase.js        # Maps suncalc phase value to name and icon
│   └── dateHelpers.js      # Date formatting, timezone helpers
├── App.jsx                 # Root component, data orchestration
└── main.jsx                # Vite entry point
```

---

## Calendar Behavior

- Display a **standard 7-column calendar grid** (Sun–Sat), starting from today
- Show **60 days total** — approximately 2 months
- Each day cell shows:
  - Date number
  - Star rating (★★★★ style)
  - Score number (e.g. 82)
  - A subtle color indicator (green = excellent, yellow = good, gray = fair/poor)
  - Small moon phase icon
  - A "Preview" label on days 17–60 to indicate partial score
- Clicking a day opens a **detail panel** with:
  - Full score breakdown by factor
  - Tide schedule (all high/low events for that day with times and heights)
  - Tide state description ("Rising tide from 6:00 PM to 11:30 PM — good night window")
  - Moon phase name, illumination %, moonrise and moonset times
  - Wind speed (full score days only)
  - Rain forecast (full score days only)
  - Overnight temperature (full score days only)
  - Plain-English summary explaining why the day scored the way it did

---

## Design Style — Frutiger Aero

The visual aesthetic is **Frutiger Aero** — the early 2010s design language known for glassy,
glossy UI with lush nature-inspired colors. Think Windows Vista, early iOS, aqua gradients, and
soft glowing elements. This style fits the ocean/fishing theme naturally.

### Key Visual Principles

- **Color palette:** Deep oceanic blues, aqua teals, and seafoam greens as the dominant tones
- **Glassmorphism cards:** Use `backdrop-filter: blur()` with semi-transparent backgrounds for
  cards and panels — the "frosted glass" look is core to this aesthetic
- **Gradients:** Use deep ocean-to-sky gradients for backgrounds (e.g. deep navy → aqua → light
  sky blue). Apply gradient tints to score cards based on rating (green gradient = excellent).
- **Glowing effects:** Subtle `box-shadow` glows on key elements like the moon display, the
  active day, and excellent-rated score badges
- **Typography:** Clean, modern sans-serif. White or light text on dark/glass backgrounds.
  Use font weight to create hierarchy — bold for scores, regular for labels.
- **Moon display:** The moon phase visualization should feel special — a glowing orb with
  soft radial glow matching illumination percentage
- **Smooth transitions:** Use CSS transitions for day card hover states and detail panel open/close

### Tailwind Implementation Notes

- Use Tailwind's `backdrop-blur`, `bg-white/10`, `bg-white/20` utilities for glass cards
- Custom gradient backgrounds should go in `index.css` as CSS custom properties or utility classes
- The app background should be a rich ocean gradient — not flat white
- Score colors: excellent = teal/green glow, good = blue glow, fair = muted gray, poor = dim

---

## Key Rules for Claude Code

1. **Explain before implementing.** Before writing any non-trivial code, briefly explain the
   approach you're taking and why. This helps the developer understand and learn.

2. **Keep components small and focused.** Each component should do one thing. If a component
   is getting large, split it.

3. **All API calls go in custom hooks.** Never fetch data inside a component directly.
   useTides, useWeather, and useMoon are the only places data is fetched.

4. **Cache API responses.** NOAA and Open-Meteo data should be fetched once on app load and
   stored in state. Do not re-fetch on every render or every calendar interaction.

5. **Handle loading and error states.** Every data-dependent component should handle: loading
   (skeleton or spinner), error (friendly message), and empty states gracefully.

6. **The score algorithm lives in one place.** All scoring logic lives in `utils/scoring.js`.
   No scoring calculations should happen inside components.

7. **Mobile-first layout.** Build the calendar and detail panel to work on mobile screens first,
   then enhance for desktop. On mobile, the detail view should be a bottom sheet or full-screen
   overlay. On desktop, it can be a side panel.

8. **No TypeScript for now.** Keep it plain JavaScript to move fast. Types can be added later.

9. **Comment the scoring algorithm generously.** The math in scoring.js should be well-commented
   so future changes are easy to reason about.

10. **Do not add dependencies without a reason.** The only approved external dependencies are:
    `suncalc`, and whatever Tailwind/Vite tooling is scaffolded by default. Ask before adding more.

---

## Deployment (Vercel)

- The app deploys to Vercel via GitHub integration
- Push to `main` branch triggers automatic deployment
- No environment variables required (no API keys)
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite

---

## Future Ideas (Do Not Build Yet)

These are out of scope for v1 but noted for later:

- Push notifications or email alerts for high-scoring upcoming days
- User accounts with saved favorite dates
- Solunar major/minor time windows overlaid on the calendar
- Multi-location support (Port Aransas, Rockport as separate views)
- Barometric pressure tracking as an additional score factor
- Species-specific scoring modes (Redfish vs Trout vs Flounder)
EOF