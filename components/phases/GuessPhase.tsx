'use client'

import { useState, useEffect, useRef } from 'react'
import { Game } from '@/types/game'
import { SPECTRUMS } from '@/lib/spectrums'
import { Dial } from '@/components/Dial'
import { calculateScore, getZone, ZONE_LABELS, ZONE_COLORS } from '@/lib/scoring'

interface Props {
  game: Game
  userEmail: string
  isHost: boolean
  onRefresh: () => void
}

export function GuessPhase({ game, userEmail }: Props) {
  const assignment = game.assignments[game.currentGuessIndex]
  if (!assignment) return null

  const spectrum = SPECTRUMS.find(s => s.id === assignment.spectrumId)!
  const isClueGiver = assignment.playerEmail === userEmail
  const hasReadied = assignment.readyPlayers.includes(userEmail)

  // Local dial position for smooth dragging
  const [localPos, setLocalPos] = useState(assignment.dialPosition)
  const isDraggingRef = useRef(false)
  const dragResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef = useRef(assignment.dialPosition)

  // Sync from server when not actively dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalPos(assignment.dialPosition)
    }
  }, [assignment.dialPosition])

  // Reset local state when moving to a new spectrum
  useEffect(() => {
    isDraggingRef.current = false
    setLocalPos(assignment.dialPosition)
    lastSentRef.current = assignment.dialPosition
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentGuessIndex])

  async function sendDial(pos: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (Math.abs(pos - lastSentRef.current) < 1) return
      lastSentRef.current = pos
      await fetch(`/api/game/${game.code}/dial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: pos }),
      })
    }, 120)
  }

  function handleDialChange(pos: number) {
    isDraggingRef.current = true
    setLocalPos(pos)
    sendDial(pos)
    // Allow server sync again after 600ms of inactivity
    if (dragResetRef.current) clearTimeout(dragResetRef.current)
    dragResetRef.current = setTimeout(() => {
      isDraggingRef.current = false
    }, 600)
  }

  async function pressReady() {
    await fetch(`/api/game/${game.code}/ready`, { method: 'POST' })
  }

  async function nextSpectrum() {
    await fetch(`/api/game/${game.code}/next`, { method: 'POST' })
  }

  const score = assignment.revealed
    ? calculateScore(assignment.targetPosition, assignment.dialPosition)
    : null
  const zone = assignment.revealed
    ? getZone(assignment.targetPosition, assignment.dialPosition)
    : null

  const progress = `${game.currentGuessIndex + 1} / ${game.assignments.length}`
  const isLast = game.currentGuessIndex + 1 >= game.assignments.length

  return (
    <div className="max-w-xl mx-auto p-5 space-y-4">

      {/* Progress + running score */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Spectrum {progress}</span>
        <span>
          <span className="text-violet-400 font-semibold">{game.totalScore}</span>
          <span className="text-slate-600"> pts</span>
          {game.currentGuessIndex > 0 && (
            <span className="text-slate-600"> / {game.currentGuessIndex * 4} possible</span>
          )}
        </span>
      </div>

      {/* Clue card */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
        {/* Clue giver */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-800 flex items-center justify-center font-bold text-sm shrink-0">
            {assignment.playerName[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{assignment.playerName}</p>
            <p className="text-xs text-slate-500">gave the clue</p>
          </div>
          {isClueGiver && (
            <span className="text-xs bg-violet-900/40 border border-violet-800 text-violet-400 px-2 py-1 rounded-full">
              that&apos;s you!
            </span>
          )}
        </div>

        {/* Spectrum labels */}
        <div className="flex justify-between text-sm font-semibold text-slate-300 px-1">
          <span>{spectrum.left}</span>
          <span className="text-slate-600 font-normal text-xs">← spectrum →</span>
          <span>{spectrum.right}</span>
        </div>

        {/* Clue */}
        <div className="bg-slate-700/60 rounded-xl py-3 px-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Clue</p>
          <p className="text-2xl font-bold">{assignment.clue}</p>
        </div>
      </div>

      {/* Dial */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between text-sm font-semibold text-slate-300">
          <span>{spectrum.left}</span>
          <span>{spectrum.right}</span>
        </div>

        <div className="flex justify-center">
          <Dial
            position={assignment.revealed ? assignment.dialPosition : localPos}
            onChange={!isClueGiver && !assignment.revealed ? handleDialChange : undefined}
            disabled={isClueGiver || assignment.revealed}
            targetPosition={assignment.revealed ? assignment.targetPosition : undefined}
            size={280}
          />
        </div>

        {isClueGiver && !assignment.revealed && (
          <p className="text-center text-xs text-slate-600">
            You gave the clue — sit back and watch
          </p>
        )}

        {/* Reveal score */}
        {assignment.revealed && score !== null && zone && (
          <div
            className="text-center py-3 rounded-xl font-bold text-lg border"
            style={{
              backgroundColor: ZONE_COLORS[zone] + '20',
              borderColor: ZONE_COLORS[zone] + '60',
              color: ZONE_COLORS[zone],
            }}
          >
            {ZONE_LABELS[zone]}
          </div>
        )}
      </div>

      {/* Ready / Next controls */}
      {!assignment.revealed ? (
        <div className="space-y-3">
          {/* Who's ready */}
          <div className="flex flex-wrap gap-2">
            {game.players.map(p => {
              const ready = assignment.readyPlayers.includes(p.email)
              return (
                <span
                  key={p.email}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    ready
                      ? 'bg-emerald-900/30 border-emerald-800 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  {p.name}{p.email === userEmail ? ' (you)' : ''} {ready ? '✓' : '...'}
                </span>
              )
            })}
          </div>

          <button
            onClick={pressReady}
            disabled={hasReadied}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-900/50 disabled:text-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {hasReadied ? 'Waiting for others...' : 'Ready to Reveal'}
          </button>
        </div>
      ) : (
        <button
          onClick={nextSpectrum}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {isLast ? 'See Final Results →' : 'Next Spectrum →'}
        </button>
      )}
    </div>
  )
}
