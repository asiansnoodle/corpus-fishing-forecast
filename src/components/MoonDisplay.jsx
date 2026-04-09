// MoonDisplay.jsx — Moon phase orb with glow + phase info + rise/set times
// Frutiger Aero: glowing orb whose size and intensity scales with illumination

import { formatTime } from '../utils/dateHelpers'

export default function MoonDisplay({ moonData }) {
  const { fraction, phaseName, phaseIcon, rise, set } = moonData

  // Glow intensity scales with illumination (dim crescent → blazing full moon)
  const glowPx     = Math.round(8  + fraction * 32)  // 8–40px blur
  const glowSpread = Math.round(0  + fraction * 8)    // 0–8px spread
  const glowAlpha  = (0.2 + fraction * 0.55).toFixed(2) // 0.2–0.75 opacity

  return (
    <div className="flex items-center gap-5">
      {/* Glowing moon orb */}
      <div className="relative flex-shrink-0">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-4xl"
          style={{
            boxShadow: `0 0 ${glowPx}px ${glowSpread}px rgba(255, 220, 80, ${glowAlpha})`,
            background: `radial-gradient(circle at 40% 40%, rgba(255,240,180,${(fraction * 0.3).toFixed(2)}), transparent 70%)`,
          }}
        >
          {phaseIcon}
        </div>
      </div>

      {/* Phase info */}
      <div className="flex-1">
        <p className="text-white font-semibold text-base">{phaseName}</p>
        <p className="text-white/50 text-sm mt-0.5">
          {Math.round(fraction * 100)}% illuminated
        </p>

        {/* Rise / set times */}
        <div className="flex gap-4 mt-2 text-xs text-white/50">
          {rise ? (
            <span>
              <span className="text-white/30">Rise </span>
              <span className="text-white/70 font-medium">{formatTime(rise)}</span>
            </span>
          ) : (
            <span className="text-white/30">No rise</span>
          )}
          {set ? (
            <span>
              <span className="text-white/30">Set </span>
              <span className="text-white/70 font-medium">{formatTime(set)}</span>
            </span>
          ) : (
            <span className="text-white/30">No set</span>
          )}
        </div>
      </div>
    </div>
  )
}
