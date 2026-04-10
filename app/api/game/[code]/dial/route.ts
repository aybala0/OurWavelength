import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kv } from '@/lib/kv'
import { Game } from '@/types/game'

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { position } = await req.json()
  if (typeof position !== 'number' || position < 0 || position > 100) {
    return NextResponse.json({ error: 'Invalid position' }, { status: 400 })
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

  // Clue-giver cannot move the dial (they know the answer)
  if (assignment.playerEmail === session.user.email) {
    return NextResponse.json({ error: 'Clue-giver cannot move the dial' }, { status: 403 })
  }

  assignment.dialPosition = Math.round(position)
  await kv.set(key, game, { ex: 60 * 60 * 24 })
  return NextResponse.json({ ok: true })
}
