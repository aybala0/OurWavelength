'use client'

import { useState } from 'react'
import { Game } from '@/types/game'
import { SPECTRUMS } from '@/lib/spectrums'
import { Timer } from '@/components/Timer'

interface Props {
  game: Game
  userEmail: string
  isHost: boolean
  onRefresh: () => void
}

function positionLabel(pos: number, left: string, right: string): string {
  if (pos < 20) return `Very ${left.toLowerCase()}`
  if (pos < 38) return `Leaning ${left.toLowerCase()}`
  if (pos < 62) return 'Right in the middle'
  if (pos < 80) return `Leaning ${right.toLowerCase()}`
  return `Very ${right.toLowerCase()}`
}

export function CluePhase({ game, userEmail }: Props) {
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [localSubmitted, setLocalSubmitted] = useState<Record<number, boolean>>({})

  const myAssignments = game.assignments
    .map((a, i) => ({ ...a, idx: i }))
    .filter(a => a.playerEmail === userEmail)

  async function submit(idx: number) {
    const clue = drafts[idx]?.trim()
    if (!clue) return
    const res = await fetch(`/api/game/${game.code}/submit-clue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentIndex: idx, clue }),
    })
    if (res.ok) setLocalSubmitted(prev => ({ ...prev, [idx]: true }))
  }

  const totalSubmitted = game.assignments.filter(a => a.submitted).length

  return (
    <div className="max-w-xl mx-auto p-5 space-y-5">

      {/* Status bar */}
      <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Time left</p>
          {game.timerEnd
            ? <Timer timerEnd={game.timerEnd} />
            : <span className="text-violet-400 font-mono text-2xl font-bold">—</span>
          }
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Submitted</p>
          <span className="text-2xl font-bold text-violet-400">
            {totalSubmitted}<span className="text-slate-600 text-lg">/{game.assignments.length}</span>
          </span>
        </div>
      </div>

      {/* Player submission status */}
      <div className="flex flex-wrap gap-2">
        {game.players.map(p => {
          const done = game.assignments
            .filter(a => a.playerEmail === p.email)
            .every(a => a.submitted)
          return (
            <div
              key={p.email}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
                done
                  ? 'bg-emerald-900/30 border-emerald-800 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              <span>{done ? '✓' : '○'}</span>
              <span>{p.name}{p.email === userEmail ? ' (you)' : ''}</span>
            </div>
          )
        })}
      </div>

      {/* My assignment cards */}
      {myAssignments.length === 0 && (
        <p className="text-center text-slate-500 py-8">Loading your spectrums...</p>
      )}

      {myAssignments.map(a => {
        const spectrum = SPECTRUMS.find(s => s.id === a.spectrumId)!
        const isDone = localSubmitted[a.idx] || a.submitted

        return (
          <div
            key={a.idx}
            className={`rounded-2xl border p-5 space-y-4 transition-all ${
              isDone
                ? 'bg-emerald-950/30 border-emerald-900'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            {/* Spectrum bar with target dot */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold text-slate-200">
                <span>{spectrum.left}</span>
                <span>{spectrum.right}</span>
              </div>
              <div className="relative h-3 bg-slate-700 rounded-full">
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-violet-500 border-2 border-white shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                  style={{ left: `${a.targetPosition}%` }}
                />
              </div>
            </div>

            {/* Target hint */}
            <p className="text-center text-sm text-slate-400">
              Your target:{' '}
              <span className="text-violet-300 font-medium">
                {positionLabel(a.targetPosition, spectrum.left, spectrum.right)}
              </span>
            </p>

            {/* Clue input / submitted state */}
            {isDone ? (
              <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-900 rounded-xl px-4 py-3">
                <span className="text-emerald-400 text-lg">✓</span>
                <span className="text-emerald-300 font-medium">
                  {drafts[a.idx] || a.clue}
                </span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={drafts[a.idx] ?? ''}
                  onChange={e => setDrafts(prev => ({ ...prev, [a.idx]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && submit(a.idx)}
                  placeholder="Your clue..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={() => submit(a.idx)}
                  disabled={!drafts[a.idx]?.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  Lock in
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Waiting message for fully submitted players */}
      {myAssignments.length > 0 && myAssignments.every(a => localSubmitted[a.idx] || a.submitted) && (
        <p className="text-center text-slate-500 text-sm pt-2">
          Waiting for everyone else to finish...
        </p>
      )}
    </div>
  )
}
