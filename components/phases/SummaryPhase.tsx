'use client'

import { useRouter } from 'next/navigation'
import { Game } from '@/types/game'
import { SPECTRUMS } from '@/lib/spectrums'
import { getZone, ZONE_COLORS } from '@/lib/scoring'

interface Props {
  game: Game
  userEmail: string
  isHost: boolean
  onRefresh: () => void
}

export function SummaryPhase({ game }: Props) {
  const router = useRouter()
  const pct = Math.round((game.totalScore / game.maxPossibleScore) * 100)

  const emoji =
    pct >= 85 ? '🎯' :
    pct >= 65 ? '🔥' :
    pct >= 45 ? '👍' : '😅'

  const message =
    pct >= 85 ? "You're on the same wavelength!" :
    pct >= 65 ? 'Pretty close!' :
    pct >= 45 ? 'Getting there!' :
    'Maybe next time!'

  return (
    <div className="max-w-xl mx-auto p-5 space-y-6 pb-10">

      {/* Hero score */}
      <div className="text-center space-y-2 pt-4">
        <p className="text-4xl">{emoji}</p>
        <div className="text-7xl font-bold text-violet-400 tabular-nums">
          {game.totalScore}
          <span className="text-3xl text-slate-600">/{game.maxPossibleScore}</span>
        </div>
        <p className="text-slate-400 text-lg font-medium">{message}</p>
        {/* Score bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-600">{pct}% of max possible score</p>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">Round breakdown</p>
        {game.assignments.map((a, i) => {
          const spectrum = SPECTRUMS.find(s => s.id === a.spectrumId)!
          const zone = a.score !== null
            ? getZone(a.targetPosition, a.dialPosition)
            : 'miss'
          const color = ZONE_COLORS[zone]

          return (
            <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-900 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                {a.playerName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm">
                  <span className="text-slate-400">{a.playerName}:</span>{' '}
                  <span className="font-semibold">&ldquo;{a.clue}&rdquo;</span>
                </p>
                <p className="text-xs text-slate-600">
                  {spectrum.left} ↔ {spectrum.right}
                </p>
                {/* Mini position bar */}
                <div className="relative h-1.5 bg-slate-700 rounded-full mt-1.5">
                  {/* Guessed */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-violet-400"
                    style={{ left: `${a.dialPosition}%` }}
                  />
                  {/* Actual */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ left: `${a.targetPosition}%`, backgroundColor: color }}
                  />
                </div>
              </div>
              <div
                className="text-sm font-bold shrink-0 tabular-nums"
                style={{ color }}
              >
                {a.score ?? 0}pt
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => router.push('/lobby')}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        Play Again
      </button>
    </div>
  )
}
