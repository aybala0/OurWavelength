'use client'

import { useEffect, useState } from 'react'

export function Timer({ timerEnd }: { timerEnd: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, timerEnd - Date.now()))

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, timerEnd - Date.now()))
    }, 100)
    return () => clearInterval(interval)
  }, [timerEnd])

  const seconds = Math.ceil(remaining / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const urgent = remaining < 30_000

  return (
    <span className={`font-mono text-2xl font-bold tabular-nums ${urgent ? 'text-red-400 animate-pulse' : 'text-violet-400'}`}>
      {minutes}:{secs.toString().padStart(2, '0')}
    </span>
  )
}
