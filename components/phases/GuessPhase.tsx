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

  const spectrum    = SPECTRUMS.find(s => s.id === assignment.spectrumId)!
  const isClueGiver = assignment.playerEmail === userEmail
  const hasReadied  = assignment.readyPlayers.includes(userEmail)
  const readyCount  = assignment.readyPlayers.length
  const totalCount  = game.players.length
  const isLast      = game.currentGuessIndex + 1 >= game.assignments.length

  // Local dial position for smooth dragging
  const [localPos, setLocalPos]   = useState(assignment.dialPosition)
  const isDraggingRef             = useRef(false)
  const dragResetRef              = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSentRef               = useRef(assignment.dialPosition)

  useEffect(() => {
    if (!isDraggingRef.current) setLocalPos(assignment.dialPosition)
  }, [assignment.dialPosition])

  useEffect(() => {
    isDraggingRef.current = false
    setLocalPos(assignment.dialPosition)
    lastSentRef.current = assignment.dialPosition
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentGuessIndex])

  function handleDialChange(pos: number) {
    isDraggingRef.current = true
    setLocalPos(pos)
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
    if (dragResetRef.current) clearTimeout(dragResetRef.current)
    dragResetRef.current = setTimeout(() => { isDraggingRef.current = false }, 600)
  }

  async function pressReady() {
    await fetch(`/api/game/${game.code}/ready`, { method: 'POST' })
  }

  async function nextSpectrum() {
    await fetch(`/api/game/${game.code}/next`, { method: 'POST' })
  }

  const score = assignment.revealed ? calculateScore(assignment.targetPosition, assignment.dialPosition) : null
  const zone  = assignment.revealed ? getZone(assignment.targetPosition, assignment.dialPosition) : null

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-56px)] px-4 py-4 gap-4">

      {/* Compact top bar */}
      <div className="w-full max-w-md flex justify-between text-xs text-slate-500">
        <span>Spectrum {game.currentGuessIndex + 1}/{game.assignments.length}</span>
        <span><span className="text-violet-400 font-semibold">{game.totalScore}</span> pts</span>
      </div>

      {/* Spectrum labels + dial */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-sm font-semibold text-slate-300 mb-1 px-1">
          <span>{spectrum.left}</span>
          <span>{spectrum.right}</span>
        </div>
        <Dial
          className="w-full"
          position={assignment.revealed ? assignment.dialPosition : localPos}
          onChange={!isClueGiver && !assignment.revealed ? handleDialChange : undefined}
          disabled={isClueGiver || assignment.revealed}
          targetPosition={assignment.revealed ? assignment.targetPosition : undefined}
        />
      </div>

      {/* Clue + attribution */}
      <div className="w-full max-w-md text-center space-y-1">
        <p className="text-4xl font-bold tracking-tight">{assignment.clue}</p>
        <p className="text-sm text-slate-500">
          clue by <span className="text-slate-300">{assignment.playerName}</span>
          {isClueGiver && <span className="text-violet-400"> (you)</span>}
        </p>
      </div>

      {/* Zone result after reveal */}
      {assignment.revealed && score !== null && zone && (
        <div
          className="w-full max-w-md text-center py-3 rounded-2xl font-bold text-xl border"
          style={{
            backgroundColor: ZONE_COLORS[zone] + '22',
            borderColor:     ZONE_COLORS[zone] + '66',
            color:           ZONE_COLORS[zone],
          }}
        >
          {ZONE_LABELS[zone]}
        </div>
      )}

      {/* Spacer pushes controls to bottom */}
      <div className="flex-1" />

      {/* Controls */}
      <div className="w-full max-w-md space-y-3 pb-4">
        {!assignment.revealed ? (
          <>
            <p className="text-center text-slate-600 text-sm">{readyCount}/{totalCount} ready</p>
            <button
              onClick={pressReady}
              disabled={hasReadied}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-900/40 disabled:text-violet-700 text-white font-semibold py-3.5 rounded-2xl transition-colors text-base"
            >
              {hasReadied ? 'Waiting for others...' : 'Ready to Reveal'}
            </button>
          </>
        ) : (
          <button
            onClick={nextSpectrum}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-2xl transition-colors text-base"
          >
            {isLast ? 'See Final Results →' : 'Next Spectrum →'}
          </button>
        )}
      </div>
    </div>
  )
}
