import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LobbyClient } from '@/components/LobbyClient'

export default async function LobbyPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/')

  return <LobbyClient user={session.user} />
}
