'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function LobbyClient({ user }: { user: User }) {
  const router = useRouter()
  const [spectrumCount, setSpectrumCount] = useState(2)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createGame() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spectrumCount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/room/${data.code}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  async function joinGame() {
    if (!joinCode.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/room/${data.code}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-violet-400">Our Wavelength</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user.name ?? user.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Create */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create a game</h2>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Spectrums per player</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setSpectrumCount(n)}
                    className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                      spectrumCount === n
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={createGame}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>

          {/* Join */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Join a game</h2>
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinGame()}
              placeholder="Room code"
              maxLength={6}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-xl tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={joinGame}
              disabled={loading || !joinCode.trim()}
              className="w-full bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
