// App.jsx — Root component: orchestrates data fetching and renders the calendar
import Calendar from './components/Calendar'
import { useTides } from './hooks/useTides'
import { useWeather } from './hooks/useWeather'
import { useMoon } from './hooks/useMoon'

export default function App() {
  const { tides, loading: tidesLoading, error: tidesError } = useTides()
  const { weather, loading: weatherLoading, error: weatherError } = useWeather()
  const { getMoonData } = useMoon()

  // TODO: combine data sources, compute scores, pass to Calendar

  return (
    <div className="min-h-screen p-4">
      <header className="text-center py-8">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          Corpus Christi Fishing Forecast
        </h1>
        <p className="text-cyan-200 mt-2 text-sm">
          Inshore pier night fishing · Redfish · Speckled Trout · Flounder
        </p>
      </header>

      {/* TODO: replace with real Calendar once data hooks are implemented */}
      <Calendar />
    </div>
  )
}
