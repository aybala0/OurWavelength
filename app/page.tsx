import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInButton } from '@/components/SignInButton'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/lobby')

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-violet-400 tracking-tight">
            Our Wavelength
          </h1>
          <p className="text-slate-400 text-xl">
            Find your wavelength with friends
          </p>
        </div>
        <SignInButton />
      </div>
    </main>
  )
}
