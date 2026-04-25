"use client"

import { useMemo } from "react"

const COLS = 20
const ROWS = 11
const CYCLE = 5       // full animation cycle in seconds
const SPREAD = 1.6    // how many seconds the wave takes to sweep across the grid

function waveDelays(cols: number, rows: number, spread: number): number[] {
  const raw = Array.from({ length: rows * cols }, (_, i) => {
    const x = i % cols
    const y = Math.floor(i / cols)
    return Math.hypot(x - (cols - 1) / 2, y - (rows - 1) / 2)
  })
  const max = Math.max(...raw)
  const min = Math.min(...raw)
  const span = max - min || 1
  return raw.map((v) => ((v - min) / span) * spread)
}

export function GridPixelateBg() {
  const delays = useMemo(() => waveDelays(COLS, ROWS, SPREAD), [])

  return (
    <>
      {/* Static gradient underlayer */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: [
            "radial-gradient(ellipse 75% 55% at 20% 15%, rgba(124,58,237,0.13) 0%, transparent 65%)",
            "radial-gradient(ellipse 60% 50% at 80% 85%, rgba(6,182,212,0.09) 0%, transparent 60%)",
            "#000",
          ].join(","),
        }}
      />

      {/* Faint static grid texture */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "48px 48px",
        }}
      />

      {/* Animated pixelate wave overlay */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          pointerEvents: "none",
        }}
      >
        {delays.map((delay, i) => (
          <div
            key={i}
            className="pixelate-cell"
            style={{
              animationDelay: `${delay}s`,
              animationDuration: `${CYCLE}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}
