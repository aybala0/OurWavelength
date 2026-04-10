import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kv } from '@/lib/kv'
import { Game } from '@/types/game'

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = `game:${params.code.toUpperCase()}`
  const game = await kv.get<Game>(key)
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  // Auto-transition clue-giving → guessing when timer expires
  if (game.status === 'clue-giving' && game.timerEnd && Date.now() > game.timerEnd) {
    game.status = 'guessing'
    game.timerEnd = null
    await kv.set(key, game, { ex: 60 * 60 * 24 })
  }

  return NextResponse.json(game)
}
