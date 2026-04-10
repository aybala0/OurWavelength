import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kv } from '@/lib/kv'
import { Game, Assignment } from '@/types/game'
import { SPECTRUMS } from '@/lib/spectrums'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = `game:${params.code.toUpperCase()}`
  const game = await kv.get<Game>(key)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  if (game.hostEmail !== session.user.email) {
    return NextResponse.json({ error: 'Only the host can start' }, { status: 403 })
  }
  if (game.status !== 'lobby') {
    return NextResponse.json({ error: 'Game already started' }, { status: 400 })
  }
  if (game.players.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 players' }, { status: 400 })
  }

  const needed = game.players.length * game.spectrumCount
  if (needed > SPECTRUMS.length) {
    return NextResponse.json({ error: 'Not enough spectrums for this configuration' }, { status: 400 })
  }

  const pickedSpectrums = shuffle(SPECTRUMS).slice(0, needed)
  const assignments: Assignment[] = []

  game.players.forEach((player, pi) => {
    for (let i = 0; i < game.spectrumCount; i++) {
      const spectrum = pickedSpectrums[pi * game.spectrumCount + i]
      assignments.push({
        playerEmail: player.email,
        playerName: player.name,
        spectrumId: spectrum.id,
        targetPosition: Math.floor(Math.random() * 81) + 10, // 10–90, avoid extremes
        clue: null,
        submitted: false,
        dialPosition: 50,
        readyPlayers: [],
        revealed: false,
        score: null,
      })
    }
  })

  game.assignments = shuffle(assignments) // randomise guessing order
  game.status = 'clue-giving'
  game.timerEnd = Date.now() + 2 * 60 * 1000
  game.maxPossibleScore = game.assignments.length * 4

  await kv.set(key, game, { ex: 60 * 60 * 24 })
  return NextResponse.json({ ok: true })
}
