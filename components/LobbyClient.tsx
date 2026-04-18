'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { AVATARS } from '@/lib/avatars'

interface User {
  name?: string | null
  email?: string | null
}

interface Profile {
  displayName: string
  avatar: string
}

export function LobbyClient({ user }: { user: User }) {
  const [profile, setProfile] = useState<Profile | null>(null)

  if (!profile) {
    return <ProfileSetup onDone={setProfile} userEmail={user.email} />
  }

  return <LobbyScreen profile={profile} onChangeProfile={() => setProfile(null)} />
}

// ── Lobby screen (separate component so hooks are never conditional) ──
function LobbyScreen({ profile, onChangeProfile }: { profile: Profile; onChangeProfile: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [spectrumCount, setSpectrumCount] = useState(2)
  const [joinCode, setJoinCode] = useState('')

  async function createGame() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spectrumCount, ...profile }),
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
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim(), ...profile }),
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
        <div className="flex items-center gap-3">
          <span className="text-2xl">{profile.avatar}</span>
          <span className="text-slate-300 text-sm font-medium">{profile.displayName}</span>
          <button onClick={onChangeProfile} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            change
          </button>
          <span className="text-slate-700">·</span>
          <button onClick={() => signOut()} className="text-sm text-slate-500 hover:text-white transition-colors">
            sign out
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

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Create a game</h2>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Spectrums per player</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setSpectrumCount(n)}
                    className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                      spectrumCount === n ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createGame} disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Join a game</h2>
            <input type="text" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinGame()}
              placeholder="Room code" maxLength={6}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-xl tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button onClick={joinGame} disabled={loading || !joinCode.trim()}
              className="w-full bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

// ── Profile setup screen ──────────────────────────────────────────
function ProfileSetup({ onDone, userEmail }: { onDone: (p: Profile) => void; userEmail?: string | null }) {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')

  function submit() {
    if (!name.trim() || !avatar) return
    onDone({ displayName: name.trim(), avatar })
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-violet-400 mb-1">Our Wavelength</h1>
        <p className="text-slate-400">Set up your profile to play</p>
      </div>

      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="How should we call you?"
            maxLength={20}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Pick your avatar</label>
          <div className="grid grid-cols-9 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {AVATARS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setAvatar(emoji)}
                className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all ${
                  avatar === emoji
                    ? 'bg-violet-600/50 ring-2 ring-violet-400 scale-110'
                    : 'bg-slate-700 hover:bg-slate-600 opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="w-14 h-14 rounded-full bg-slate-700 border-2 border-slate-600 shrink-0 flex items-center justify-center text-3xl">
            {avatar || <span className="text-slate-500 text-xl">?</span>}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">{name || <span className="text-slate-500 font-normal">your name</span>}</p>
            <p className="text-sm text-slate-500">{userEmail}</p>
          </div>
          <button
            onClick={submit}
            disabled={!name.trim() || !avatar}
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Let&apos;s play!
          </button>
        </div>
      </div>
    </main>
  )
}
