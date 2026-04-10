import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kv } from '@/lib/kv'
import { Game } from '@/types/game'

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
  if (!assignment?.revealed) {
    return NextResponse.json({ error: 'Not yet revealed' }, { status: 400 })
  }

  game.currentGuessIndex++

  if (game.currentGuessIndex >= game.assignments.length) {
    game.status = 'summary'
  }

  await kv.set(key, game, { ex: 60 * 60 * 24 })
  return NextResponse.json({ ok: true })
}
