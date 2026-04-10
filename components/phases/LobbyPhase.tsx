'use client'

import { Game } from '@/types/game'

interface Props {
  game: Game
  userEmail: string
  isHost: boolean
  onRefresh: () => void
}

export function LobbyPhase({ game, userEmail, isHost }: Props) {
  async function startGame() {
    await fetch(`/api/game/${game.code}/start`, { method: 'POST' })
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-6">
      <div className="w-full max-w-sm space-y-6">

        {/* Room code */}
        <div className="text-center space-y-1">
          <p className="text-slate-500 text-sm uppercase tracking-wider">Room code</p>
          <div className="text-5xl font-bold font-mono tracking-widest text-violet-400">
            {game.code}
          </div>
          <p className="text-slate-600 text-xs">Share with friends to join</p>
        </div>

        {/* Players */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Players ({game.players.length})
          </p>
          <ul className="space-y-2">
            {game.players.map(p => (
              <li key={p.email} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-800 flex items-center justify-center text-sm font-bold shrink-0">
                  {p.name[0]?.toUpperCase()}
                </div>
                <span className="font-medium text-sm flex-1">{p.name}</span>
                <div className="flex gap-1.5">
                  {p.email === game.hostEmail && (
                    <span className="text-xs text-violet-400 bg-violet-900/40 border border-violet-800 px-2 py-0.5 rounded-full">
                      host
                    </span>
                  )}
                  {p.email === userEmail && (
                    <span className="text-xs text-slate-500">you</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Settings */}
        <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
          <span className="text-slate-400 text-sm">Spectrums per player</span>
          <span className="font-bold text-violet-400">{game.spectrumCount}</span>
        </div>

        {/* Action */}
        {isHost ? (
          <button
            onClick={startGame}
            disabled={game.players.length < 2}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors text-base"
          >
            {game.players.length < 2 ? 'Waiting for players...' : 'Start Game'}
          </button>
        ) : (
          <p className="text-center text-slate-500 py-2 text-sm">
            Waiting for{' '}
            <span className="text-slate-300">
              {game.players.find(p => p.email === game.hostEmail)?.name}
            </span>{' '}
            to start...
          </p>
        )}
      </div>
    </div>
  )
}
