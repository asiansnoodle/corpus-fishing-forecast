// Calendar.jsx — 7-column Sun–Sat calendar grid for 60 days
//
// Rendering strategy:
//   - Group days by calendar month
//   - Render each month as its own bordered card with its own 7-column grid
//   - Each month's grid has independent leading blanks based on its first day's weekday
//   - This keeps May 1 in May, April 30 in April — no cross-month bleed

import DayCard from './DayCard'

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

/** Group a flat days array into month buckets */
function groupByMonth(days) {
  const months = []
  let current = null

  for (const day of days) {
    const month = day.date.getMonth()
    const year  = day.date.getFullYear()
    const key   = `${year}-${month}`

    if (!current || current.key !== key) {
      current = { key, month, year, days: [] }
      months.push(current)
    }
    current.days.push(day)
  }

  return months
}

/** Build week rows for a single month's days, with leading nulls for alignment */
function buildWeeks(monthDays) {
  const leadingBlanks = monthDays[0].date.getDay() // 0=Sun … 6=Sat
  const padded = [...Array(leadingBlanks).fill(null), ...monthDays]

  const weeks = []
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7))
  }
  return weeks
}

export default function Calendar({ days, onDayClick, selectedDayKey }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = today.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })

  const months = groupByMonth(days ?? [])

  return (
    <div className="px-2 md:px-4 pb-8 max-w-4xl mx-auto space-y-4">
      {months.map(({ key, month, year, days: monthDays }) => {
        const weeks = buildWeeks(monthDays)

        return (
          <div
            key={key}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
          >
            {/* Month header */}
            <div className="px-4 pt-4 pb-3 border-b border-white/8">
              <h2 className="text-base font-semibold text-white/80 tracking-wide">
                {MONTH_NAMES[month]} {year}
              </h2>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1 px-2 pt-2">
              {WEEKDAY_HEADERS.map(d => (
                <div
                  key={d}
                  className="text-center text-[10px] md:text-xs font-semibold text-cyan-200/50 uppercase tracking-wider py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="px-2 pb-3 space-y-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((day, di) =>
                    day === null ? (
                      <div key={`blank-${wi}-${di}`} />
                    ) : (
                      <DayCard
                        key={day.dayKey}
                        day={day}
                        isToday={day.dayKey === todayKey}
                        isSelected={day.dayKey === selectedDayKey}
                        onClick={() => onDayClick(day.dayKey)}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
