// ConditionRow.jsx — Single condition row in the detail panel
// Used for: wind speed, rainfall, temperature, etc.

export default function ConditionRow({ label, value, score }) {
  return (
    <div>
      {/* TODO: render label + value + score contribution */}
      <p className="text-white text-xs">{label}: {value}</p>
    </div>
  )
}
