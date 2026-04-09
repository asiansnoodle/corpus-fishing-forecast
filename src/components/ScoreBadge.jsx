// ScoreBadge.jsx — Reusable star rating + numeric score display
// Stars: 1–4 based on score range. Label: Excellent / Good / Fair / Poor

export default function ScoreBadge({ score, isPartial }) {
  return (
    <div>
      {/* TODO: render star rating and score number */}
      <span className="text-white text-xs">Score: {score ?? '—'}</span>
    </div>
  )
}
