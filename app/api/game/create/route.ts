import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kv } from '@/lib/kv'
import { Game } from '@/types/game'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const spectrumCount = Number(body.spectrumCount)
  if (!spectrumCount || spectrumCount < 1 || spectrumCount > 5) {
    return NextResponse.json({ error: 'Spectrum count must be 1–5' }, { status: 400 })
  }

  let code = generateCode()
  while (await kv.get(`game:${code}`)) {
    code = generateCode()
  }

  const game: Game = {
    code,
    hostEmail: session.user.email,
    status: 'lobby',
    players: [{
      email: session.user.email,
      name: session.user.name ?? session.user.email,
      image: session.user.image ?? undefined,
    }],
    spectrumCount,
    assignments: [],
    currentGuessIndex: 0,
    totalScore: 0,
    maxPossibleScore: 0,
    timerEnd: null,
    createdAt: Date.now(),
  }

  await kv.set(`game:${code}`, game, { ex: 60 * 60 * 24 })

  return NextResponse.json({ code })
}
