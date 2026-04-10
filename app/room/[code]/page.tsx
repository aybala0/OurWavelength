'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Game } from '@/types/game'
import { LobbyPhase } from '@/components/phases/LobbyPhase'
import { CluePhase } from '@/components/phases/CluePhase'
import { GuessPhase } from '@/components/phases/GuessPhase'
import { SummaryPhase } from '@/components/phases/SummaryPhase'

export default function RoomPage({ params }: { params: { code: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [game, setGame] = useState<Game | null>(null)
  const [error, setError] = useState('')

  const code = params.code.toUpperCase()

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/${code}`)
      if (res.status === 404) { setError('Game not found'); return }
      if (!res.ok) return
      setGame(await res.json())
    } catch {
      // silently retry on next poll
    }
  }, [code])

  // Redirect if not authed
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status, router])

  // Auto-join if not already in the player list (handles direct URL navigation)
  useEffect(() => {
    if (!session?.user?.email) return
    async function tryJoin() {
      const res = await fetch(`/api/game/${code}`)
      if (!res.ok) return
      const g: Game = await res.json()
      if (g.status === 'lobby' && !g.players.some(p => p.email === session!.user!.email)) {
        await fetch('/api/game/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
      }
    }
    tryJoin()
  }, [code, session])

  // Poll game state every second
  useEffect(() => {
    fetchGame()
    const interval = setInterval(fetchGame, 1000)
    return () => clearInterval(interval)
  }, [fetchGame])

  if (status === 'loading' || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-lg">{error || 'Loading...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button onClick={() => router.push('/lobby')} className="text-violet-400 hover:underline">
            Back to lobby
          </button>
        </div>
      </div>
    )
  }

  const userEmail = session?.user?.email ?? ''
  const isHost = game.hostEmail === userEmail
  const props = { game, userEmail, isHost, onRefresh: fetchGame }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 shrink-0">
        <h1 className="text-lg font-bold text-violet-400">Our Wavelength</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 text-sm font-mono tracking-widest">#{code}</span>
          <div className="flex -space-x-1.5">
            {game.players.map(p => (
              <div
                key={p.email}
                title={p.name}
                className="w-7 h-7 rounded-full bg-violet-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold"
              >
                {p.name[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Phase content */}
      <div className="flex-1 overflow-y-auto">
        {game.status === 'lobby'       && <LobbyPhase   {...props} />}
        {game.status === 'clue-giving' && <CluePhase    {...props} />}
        {game.status === 'guessing'    && <GuessPhase   {...props} />}
        {game.status === 'summary'     && <SummaryPhase {...props} />}
      </div>
    </main>
  )
}
