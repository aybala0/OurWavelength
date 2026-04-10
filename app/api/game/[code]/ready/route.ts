import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kv } from '@/lib/kv'
import { Game } from '@/types/game'
import { calculateScore } from '@/lib/scoring'

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

  if (game.status !== 'guessing') {
    return NextResponse.json({ error: 'Not in guessing phase' }, { status: 400 })
  }

  const assignment = game.assignments[game.currentGuessIndex]
  if (!assignment || assignment.revealed) {
    return NextResponse.json({ error: 'Already revealed' }, { status: 400 })
  }

  const email = session.user.email
  if (!assignment.readyPlayers.includes(email)) {
    assignment.readyPlayers.push(email)
  }

  // Reveal when all players are ready
  if (assignment.readyPlayers.length >= game.players.length) {
    assignment.revealed = true
    assignment.score = calculateScore(assignment.targetPosition, assignment.dialPosition)
    game.totalScore += assignment.score
  }

  await kv.set(key, game, { ex: 60 * 60 * 24 })
  return NextResponse.json({ ok: true })
}
