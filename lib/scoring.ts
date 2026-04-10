export type Zone = 'bullseye' | 'close' | 'near' | 'miss'

// Zone boundaries: distance from target position (0-100 scale)
const BULLSEYE = 8
const CLOSE = 16
const NEAR = 24

export function calculateScore(targetPosition: number, dialPosition: number): number {
  const d = Math.abs(targetPosition - dialPosition)
  if (d <= BULLSEYE) return 4
  if (d <= CLOSE)    return 3
  if (d <= NEAR)     return 2
  return 0
}

export function getZone(targetPosition: number, dialPosition: number): Zone {
  const d = Math.abs(targetPosition - dialPosition)
  if (d <= BULLSEYE) return 'bullseye'
  if (d <= CLOSE)    return 'close'
  if (d <= NEAR)     return 'near'
  return 'miss'
}

export const ZONE_LABELS: Record<Zone, string> = {
  bullseye: 'Bullseye! +4 pts',
  close:    'Close!   +3 pts',
  near:     'Near!    +2 pts',
  miss:     'Miss.    +0 pts',
}

export const ZONE_COLORS: Record<Zone, string> = {
  bullseye: '#fbbf24',
  close:    '#f97316',
  near:     '#3b82f6',
  miss:     '#475569',
}

// Returns the half-widths for each zone (for drawing arcs)
export const ZONE_WIDTHS = { bullseye: BULLSEYE, close: CLOSE, near: NEAR }
