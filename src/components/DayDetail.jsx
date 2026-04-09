// DayDetail.jsx — Slide-in detail panel for a clicked calendar day
// Mobile: slides up from the bottom (85vh bottom sheet)
// Desktop: slides in from the right (420px side panel)

import ScoreBadge from './ScoreBadge'
import MoonDisplay from './MoonDisplay'
import TidePanel from './TidePanel'
import ConditionRow from './ConditionRow'
import FishingWindows from './FishingWindows'
import { getTideWindows } from '../utils/tideParser'
import { getWeatherCondition, getRainWindows, formatHourLabel } from '../utils/weatherCode'

// Generate a plain-English summary of why the day scored the way it did
function buildSummary(day) {
  const { breakdown, moonData, weather, isPartial, stars } = day
  const { tideScore, moonScore } = breakdown

  const tideDesc = tideScore >= 70 ? 'strong tidal movement'
                 : tideScore >= 40 ? 'moderate tidal movement'
                 : 'slow tide movement during fishing hours'

  const moonDesc = `${moonData.phaseName.toLowerCase()}`

  let summary = `${cap(tideDesc)} with a ${moonDesc}`

  if (!isPartial && weather) {
    const { windScore, precipScore } = breakdown
    const extras = []
    if (windScore < 40) extras.push(`strong winds (${Math.round(weather.windspeedMax)} mph)`)
    if (precipScore < 60) extras.push('rain in the forecast')
    if (extras.length > 0) summary += `, but expect ${extras.join(' and ')}`
  }

  summary += '.'

  if (stars === 4) summary = 'Excellent night to fish. ' + summary
  else if (stars === 3) summary = 'Good conditions overall. ' + summary
  else if (stars === 1) summary = 'Tough conditions tonight. ' + summary

  if (isPartial) {
    summary += ' Score reflects tide and moon only — weather data isn\'t available this far out.'
  }

  return summary
}

function cap(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Chicago',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DayDetail({ day, onClose }) {
  const { date, dayKey, score, stars, label, isPartial, breakdown, tideEvents, moonData, weather } = day
  const summary = buildSummary(day)

  // Compute fishing windows from the full multi-day event context.
  // tideEvents is the per-day slice; we need the window events from the day object.
  // App passes windowEvents on the day object for exactly this purpose.
  const fishingWindows = getTideWindows(day.windowEvents ?? tideEvents, dayKey)

  // Weights differ for full vs partial scores
  const tideWeight = isPartial ? 55 : 30
  const moonWeight = isPartial ? 45 : 25

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel: bottom sheet on mobile, centered modal on desktop */}
      <div
        className={[
          'fixed z-50 overflow-y-auto',
          // Mobile: bottom sheet
          'inset-x-0 bottom-0 h-[85vh] rounded-t-3xl',
          // Desktop: centered modal
          'md:inset-0 md:m-auto md:w-[480px] md:h-auto md:max-h-[85vh] md:rounded-2xl',
          // Glass background
          'bg-gradient-to-b from-slate-900/97 to-slate-800/97 backdrop-blur-xl',
          'border-t border-white/10 md:border',
        ].join(' ')}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-5 border-b border-white/8">
          <div>
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1">
              {formatDate(date)}
            </p>
            <ScoreBadge score={score} stars={stars} label={label} isPartial={isPartial} size="lg" />
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors text-2xl leading-none mt-1 ml-4"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Summary */}
        <div className="px-5 py-4 border-b border-white/8">
          <p className="text-white/70 text-sm leading-relaxed">{summary}</p>
        </div>

        {/* Moon */}
        <section className="px-5 py-4 border-b border-white/8">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Moon</h3>
          <MoonDisplay moonData={moonData} />
          <div className="mt-3">
            <ConditionRow
              icon="🌙"
              label="Moon phase"
              value={moonData.phaseName}
              score={breakdown.moonScore}
              weight={moonWeight}
            />
          </div>
        </section>

        {/* Tides */}
        <section className="px-5 py-4 border-b border-white/8">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Tides</h3>
          <TidePanel tideEvents={tideEvents} dayKey={dayKey} />
          <div className="mt-3">
            <ConditionRow
              icon="🌊"
              label="Tide score"
              value={breakdown.tideScore >= 70 ? 'Strong movement' : breakdown.tideScore >= 40 ? 'Moderate' : 'Slow'}
              score={breakdown.tideScore}
              weight={tideWeight}
            />
          </div>
        </section>

        {/* Fishing Windows */}
        <section className="px-5 py-4 border-b border-white/8">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Fishing Windows
          </h3>
          <FishingWindows windows={fishingWindows} />
        </section>

        {/* Weather — full score days only */}
        {!isPartial && weather && (() => {
          const condition  = getWeatherCondition(weather.weatherCode)
          const rainWindows = condition.isRainy
            ? getRainWindows(weather.hourlyPrecip ?? [])
            : []

          return (
            <section className="px-5 py-4 border-b border-white/8">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Weather</h3>

              {/* Overall condition */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <span className="text-2xl">{condition.icon}</span>
                <span className="text-white font-medium">{condition.label}</span>
              </div>

              {/* Rain timing — only shown on rainy days */}
              {rainWindows.length > 0 && (
                <div className="mb-3 rounded-xl bg-blue-500/10 border border-blue-400/20 px-3 py-2.5">
                  <p className="text-xs font-semibold text-blue-300 mb-1.5">Rain expected:</p>
                  <div className="space-y-1">
                    {rainWindows.map((w, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-white/70">
                          {formatHourLabel(w.startHour)} – {formatHourLabel(w.endHour)}
                        </span>
                        <span className="text-white/40">{w.totalMm} mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ConditionRow
                icon="💨"
                label="Max wind"
                value={`${Math.round(weather.windspeedMax)} mph`}
                score={breakdown.windScore}
                weight={20}
              />
              <ConditionRow
                icon="🌧️"
                label="Precipitation"
                value={weather.precipMm === 0 ? 'None' : `${weather.precipMm.toFixed(1)} mm`}
                score={breakdown.precipScore}
                weight={15}
              />
              <ConditionRow
                icon="🌡️"
                label="Overnight low"
                value={`${Math.round(weather.tempMin)}°F`}
                score={breakdown.tempScore}
                weight={10}
              />
            </section>
          )
        })()}

        {/* Partial score notice */}
        {isPartial && (
          <section className="px-5 py-4">
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-xs text-white/50 leading-relaxed">
                <span className="text-cyan-300 font-semibold">Preview score</span> — Based on tide and
                moon only, discounted for weather uncertainty. Wind, rain, and temperature (45% of the
                full score) are unknown this far out and can only hurt — so this score skews
                optimistic. It will update automatically once this date enters the 16-day forecast window.
              </p>
            </div>
          </section>
        )}

        {/* Bottom safe area padding */}
        <div className="h-8" />
      </div>
    </>
  )
}
