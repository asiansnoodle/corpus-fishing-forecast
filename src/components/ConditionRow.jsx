// ConditionRow.jsx — Single weather condition row in the DayDetail panel
// Shows: icon + label + value + score contribution bar

const scoreColor = (score) => {
  if (score >= 70) return '#10b981'  // emerald
  if (score >= 50) return '#3b82f6'  // blue
  if (score >= 30) return '#f59e0b'  // amber
  return '#ef4444'                    // red
}

export default function ConditionRow({ icon, label, value, score, weight }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
      {/* Icon */}
      <span className="text-lg w-6 text-center flex-shrink-0 mt-0.5">{icon}</span>

      {/* Label + value */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-white/60">{label}</span>
          <span className="text-sm font-semibold text-white whitespace-nowrap">{value}</span>
        </div>

        {/* Score bar */}
        <div className="mt-1.5 h-1 rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${score}%`,
              background: scoreColor(score),
            }}
          />
        </div>

        {/* Score + weight label */}
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-white/30">{weight}% of score</span>
          <span className="text-[10px] text-white/40">{score}/100</span>
        </div>
      </div>
    </div>
  )
}
