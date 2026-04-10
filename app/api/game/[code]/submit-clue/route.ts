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

  const { assignmentIndex, clue } = await req.json()
  if (!clue?.trim()) {
    return NextResponse.json({ error: 'Clue is required' }, { status: 400 })
  }

  const key = `game:${params.code.toUpperCase()}`
  const game = await kv.get<Game>(key)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  if (game.status !== 'clue-giving') {
    return NextResponse.json({ error: 'Not in clue-giving phase' }, { status: 400 })
  }

  const assignment = game.assignments[assignmentIndex]
  if (!assignment || assignment.playerEmail !== session.user.email) {
    return NextResponse.json({ error: 'Not your assignment' }, { status: 403 })
  }

  assignment.clue = clue.trim()
  assignment.submitted = true

  // Auto-transition when all players have submitted
  if (game.assignments.every(a => a.submitted)) {
    game.status = 'guessing'
    game.timerEnd = null
  }

  await kv.set(key, game, { ex: 60 * 60 * 24 })
  return NextResponse.json({ ok: true })
}
