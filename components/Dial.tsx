'use client'

import { useRef, useCallback, useEffect } from 'react'

// SVG geometry: 300×160 viewBox, semicircle centered at (150, 150), radius 120
const CX = 150
const CY = 150
const R = 120

// Convert a position 0–100 to radians (π at pos=0, 0 at pos=100)
function posToAngle(pos: number): number {
  return Math.PI * (1 - pos / 100)
}

// Convert position to SVG point on the arc
function posToPoint(pos: number): { x: number; y: number } {
  const a = posToAngle(pos)
  return {
    x: CX + R * Math.cos(a),
    y: CY - R * Math.sin(a), // flip y: SVG y increases downward
  }
}

// Build an SVG arc path from position p1 to p2 (clockwise through the top, sweep=1)
function arcD(p1: number, p2: number): string {
  const c1 = Math.max(0, Math.min(100, p1))
  const c2 = Math.max(0, Math.min(100, p2))
  if (Math.abs(c2 - c1) < 0.01) return ''
  const start = posToPoint(c1)
  const end = posToPoint(c2)
  const span = c2 - c1
  // Full arc: route through midpoint to avoid the 180° ambiguity
  if (span >= 99.9) {
    const mid = posToPoint(50)
    return (
      `M ${f(start.x)} ${f(start.y)} ` +
      `A ${R} ${R} 0 0 1 ${f(mid.x)} ${f(mid.y)} ` +
      `A ${R} ${R} 0 0 1 ${f(end.x)} ${f(end.y)}`
    )
  }
  const largeArc = span > 50 ? 1 : 0
  return `M ${f(start.x)} ${f(start.y)} A ${R} ${R} 0 ${largeArc} 1 ${f(end.x)} ${f(end.y)}`
}

function f(n: number) {
  return n.toFixed(2)
}

// Zone arcs centred on targetPos: bullseye ±8, close ±16, near ±24
function buildZoneArcs(targetPos: number) {
  return [
    { p1: targetPos - 24, p2: targetPos - 16, color: '#3b82f6' }, // near left
    { p1: targetPos - 16, p2: targetPos - 8,  color: '#f97316' }, // close left
    { p1: targetPos - 8,  p2: targetPos + 8,  color: '#fbbf24' }, // bullseye
    { p1: targetPos + 8,  p2: targetPos + 16, color: '#f97316' }, // close right
    { p1: targetPos + 16, p2: targetPos + 24, color: '#3b82f6' }, // near right
  ].filter(z => z.p2 > 0 && z.p1 < 100)
}

export interface DialProps {
  position: number       // 0–100, current dial position
  onChange?: (pos: number) => void
  disabled?: boolean
  targetPosition?: number // if set, show zone arcs + target marker (reveal mode)
  size?: number           // rendered width in px (height auto-scaled)
}

export function Dial({
  position,
  onChange,
  disabled = false,
  targetPosition,
  size = 300,
}: DialProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  // Convert client coords → SVG coords → position 0-100
  const clientToPos = useCallback(
    (clientX: number, clientY: number): number => {
      const svg = svgRef.current
      if (!svg) return position
      const rect = svg.getBoundingClientRect()
      // Map client → viewBox coords
      const svgX = (clientX - rect.left) * (300 / rect.width)
      const svgY = (clientY - rect.top) * (160 / rect.height)
      const dx = svgX - CX
      const dy = CY - svgY // flip y
      const angle = Math.atan2(dy, dx) // −π … π
      const clamped = Math.max(0, Math.min(Math.PI, angle))
      return Math.round((1 - clamped / Math.PI) * 100)
    },
    [position]
  )

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging.current || disabled || !onChange) return
      onChange(clientToPos(clientX, clientY))
    },
    [disabled, onChange, clientToPos]
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onMouseUp = () => { dragging.current = false }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchEnd = () => { dragging.current = false }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [handleMove])

  const tip = posToPoint(position)
  const showReveal = targetPosition !== undefined
  const zoneArcs = showReveal ? buildZoneArcs(targetPosition!) : []
  const targetPt = showReveal ? posToPoint(targetPosition!) : null
  const height = Math.round(size * (160 / 300))

  const startDrag = (clientX: number, clientY: number) => {
    if (disabled || !onChange) return
    dragging.current = true
    onChange(clientToPos(clientX, clientY))
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 160"
      width={size}
      height={height}
      style={{ cursor: disabled ? 'default' : 'grab', userSelect: 'none', touchAction: 'none' }}
      onMouseDown={e => startDrag(e.clientX, e.clientY)}
      onTouchStart={e => { if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
    >
      {/* Base track */}
      <path
        d={arcD(0, 100)}
        fill="none"
        stroke="#334155"
        strokeWidth="22"
        strokeLinecap="round"
      />

      {/* Zone arcs (reveal mode) */}
      {zoneArcs.map((z, i) => (
        <path
          key={i}
          d={arcD(z.p1, z.p2)}
          fill="none"
          stroke={z.color}
          strokeWidth="22"
          strokeLinecap="butt"
          opacity="0.85"
        />
      ))}

      {/* Needle */}
      <line
        x1={CX} y1={CY}
        x2={f(tip.x)} y2={f(tip.y)}
        stroke="#a78bfa"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Needle pivot */}
      <circle cx={CX} cy={CY} r="7" fill="#7c3aed" />

      {/* Needle handle */}
      <circle
        cx={f(tip.x)}
        cy={f(tip.y)}
        r="10"
        fill={disabled ? '#5b21b6' : '#7c3aed'}
        stroke="white"
        strokeWidth="2.5"
      />

      {/* Target marker (reveal mode) */}
      {showReveal && targetPt && (
        <>
          <line
            x1={CX} y1={CY}
            x2={f(targetPt.x)} y2={f(targetPt.y)}
            stroke="#fbbf24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 4"
            opacity="0.9"
          />
          <circle
            cx={f(targetPt.x)}
            cy={f(targetPt.y)}
            r="9"
            fill="#fbbf24"
            stroke="white"
            strokeWidth="2.5"
          />
        </>
      )}
    </svg>
  )
}
