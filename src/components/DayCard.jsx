// DayCard.jsx — Individual day cell in the calendar grid
// Shows: date number, star rating, score, color indicator, moon icon, preview label

export default function DayCard({ date, score, isPartial, onClick }) {
  return (
    <div onClick={onClick}>
      {/* TODO: render day card with score badge and moon icon */}
      <p className="text-white text-xs">DayCard placeholder</p>
    </div>
  )
}
