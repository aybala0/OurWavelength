'use client'

import { useRef, useCallback, useEffect } from 'react'

const CX = 150
const CY = 150
const R  = 120

function posToAngle(pos: number) { return Math.PI * (1 - pos / 100) }

function posToPoint(pos: number, r = R) {
  const a = posToAngle(pos)
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }
}

function f(n: number) { return n.toFixed(2) }

// Half-disc path routed through top midpoint to avoid 180° arc ambiguity
const HALF_DISC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${CX + R} ${CY} Z`

// Filled pie-sector from center, positions p1→p2 (left to right)
function sectorPath(p1: number, p2: number) {
  const c1 = Math.max(0, Math.min(100, p1))
  const c2 = Math.max(0, Math.min(100, p2))
  if (c2 - c1 < 0.2) return ''
  const s = posToPoint(c1)
  const e = posToPoint(c2)
  return `M ${f(CX)} ${f(CY)} L ${f(s.x)} ${f(s.y)} A ${R} ${R} 0 ${c2-c1>50?1:0} 1 ${f(e.x)} ${f(e.y)} Z`
}

// Zones: draw outer→inner so inner paints on top
function getRevealZones(t: number) {
  return [
    { p1: t - 24, p2: t - 16, color: '#ffd93d', score: 2 },
    { p1: t + 16, p2: t + 24, color: '#ffd93d', score: 2 },
    { p1: t - 16, p2: t - 8,  color: '#ff8c42', score: 3 },
    { p1: t + 8,  p2: t + 16, color: '#ff8c42', score: 3 },
    { p1: t - 8,  p2: t + 8,  color: '#4ecdc4', score: 4 },
  ].filter(z => z.p2 > 0 && z.p1 < 100)
}

// Thin arrow needle
function Needle({ position, color }: { position: number; color: string }) {
  const tip = posToPoint(position)
  const a   = posToAngle(position)
  const dx  = Math.cos(a)
  const dy  = -Math.sin(a) // SVG y is flipped

  const arrowLen = 18
  const arrowWidth = 5
  const bx = tip.x - dx * arrowLen
  const by = tip.y - dy * arrowLen
  // Perpendicular to (dx, dy): use (-dy, dx)
  const px = -dy, py = dx
  const w1 = { x: bx + px * arrowWidth, y: by + py * arrowWidth }
  const w2 = { x: bx - px * arrowWidth, y: by - py * arrowWidth }

  return (
    <>
      <line x1={f(CX)} y1={f(CY)} x2={f(bx)} y2={f(by)}
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <polygon
        points={`${f(tip.x)},${f(tip.y)} ${f(w1.x)},${f(w1.y)} ${f(w2.x)},${f(w2.y)}`}
        fill={color}
      />
    </>
  )
}

export interface DialProps {
  position: number
  onChange?: (pos: number) => void
  disabled?: boolean
  targetPosition?: number // reveal mode: show zones + golden target needle
  className?: string
}

export function Dial({ position, onChange, disabled = false, targetPosition, className = '' }: DialProps) {
  const svgRef  = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const showReveal = targetPosition !== undefined
  const zones = showReveal ? getRevealZones(targetPosition!) : []

  const clientToPos = useCallback((clientX: number, clientY: number): number => {
    const svg = svgRef.current
    if (!svg) return position
    const rect = svg.getBoundingClientRect()
    const svgX = (clientX - rect.left)  * (300 / rect.width)
    const svgY = (clientY - rect.top)   * (160 / rect.height)
    const dx = svgX - CX
    const dy = CY - svgY
    const angle = Math.atan2(dy, dx)
    return Math.round((1 - Math.max(0, Math.min(Math.PI, angle)) / Math.PI) * 100)
  }, [position])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current || disabled || !onChange) return
    onChange(clientToPos(clientX, clientY))
  }, [disabled, onChange, clientToPos])

  useEffect(() => {
    const mm = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const mu = () => { dragging.current = false }
    const tm = (e: TouchEvent) => { if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY) }
    const te = () => { dragging.current = false }
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup', mu)
    window.addEventListener('touchmove', tm, { passive: true })
    window.addEventListener('touchend', te)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('mouseup', mu)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('touchend', te)
    }
  }, [handleMove])

  const startDrag = (cX: number, cY: number) => {
    if (disabled || !onChange) return
    dragging.current = true
    onChange(clientToPos(cX, cY))
  }

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 160"
      className={className}
      style={{ cursor: disabled ? 'default' : 'grab', userSelect: 'none', touchAction: 'none', display: 'block' }}
      onMouseDown={e => startDrag(e.clientX, e.clientY)}
      onTouchStart={e => { if (e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY) }}
    >
      {/* Cream dial face */}
      <path d={HALF_DISC} fill="#f8f4e8" />

      {/* Zone sectors (reveal only) */}
      {zones.map((z, i) => (
        <path key={i} d={sectorPath(z.p1, z.p2)} fill={z.color} />
      ))}

      {/* Zone score labels */}
      {zones.map((z, i) => {
        const clampedMid = (Math.max(0, z.p1) + Math.min(100, z.p2)) / 2
        const pt = posToPoint(clampedMid, R * 0.63)
        return (
          <text key={`t${i}`} x={f(pt.x)} y={f(pt.y)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="12" fontWeight="bold" fill="white"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}>
            {z.score}
          </text>
        )
      })}

      {/* Navy bezel rim */}
      <path d={HALF_DISC} fill="none" stroke="#1a2f4a" strokeWidth="18" />

      {/* Diameter line */}
      <line x1={CX - R - 9} y1={CY} x2={CX + R + 9} y2={CY} stroke="#1a2f4a" strokeWidth="18" strokeLinecap="round" />

      {/* Guess needle (violet) */}
      <Needle position={position} color="#7c3aed" />

      {/* Target needle in reveal mode (amber) */}
      {showReveal && <Needle position={targetPosition!} color="#f59e0b" />}

      {/* Center pivot */}
      <circle cx={CX} cy={CY} r="9" fill="#e63946" />
      <circle cx={CX} cy={CY} r="3.5" fill="white" opacity="0.7" />
    </svg>
  )
}
