import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kv } from '@/lib/kv'
import { Game } from '@/types/game'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await req.json()
  const key = `game:${String(code).toUpperCase()}`
  const game = await kv.get<Game>(key)

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }
  if (game.status !== 'lobby') {
    return NextResponse.json({ error: 'Game already started' }, { status: 400 })
  }

  const alreadyIn = game.players.some(p => p.email === session.user!.email)
  if (!alreadyIn) {
    game.players.push({
      email: session.user.email,
      name: session.user.name ?? session.user.email,
      image: session.user.image ?? undefined,
    })
    await kv.set(key, game, { ex: 60 * 60 * 24 })
  }

  return NextResponse.json({ code: game.code })
}
