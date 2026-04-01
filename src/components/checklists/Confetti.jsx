import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Full-screen confetti animation using a portal.
 * Renders 60 coloured particles that burst from the top and fall across the viewport.
 *
 * Props:
 *  onDone - called when the animation finishes (~2.5s)
 */

const COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400',
  'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-orange-400',
  'bg-rose-400', 'bg-cyan-400', 'bg-amber-400', 'bg-emerald-400',
]

const PARTICLE_COUNT = 60

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

export default function Confetti({ onDone }) {
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      left: randomBetween(0, 100),         // % from left across full screen
      delay: randomBetween(0, 0.6),        // staggered start
      duration: randomBetween(1.2, 2.2),   // longer fall for full viewport
      size: randomBetween(6, 12),          // bigger particles
      rotation: randomBetween(0, 360),
      drift: randomBetween(-80, 80),       // horizontal sway in px
      shape: Math.random() > 0.5 ? 'rounded-sm' : 'rounded-full', // mix squares and circles
    }))
  )

  useEffect(() => {
    const timer = setTimeout(() => { if (onDone) onDone() }, 2800)
    return () => clearTimeout(timer)
  }, [onDone])

  return createPortal(
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 9999 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${p.shape} ${p.color}`}
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall-${p.id} ${p.duration}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}

      <style>{`
        ${particles.map((p) => `
          @keyframes confetti-fall-${p.id} {
            0% {
              opacity: 1;
              transform: translateY(0) translateX(0) rotate(0deg) scale(1);
            }
            50% {
              opacity: 1;
              transform: translateY(50vh) translateX(${p.drift}px) rotate(360deg) scale(0.9);
            }
            100% {
              opacity: 0;
              transform: translateY(100vh) translateX(${p.drift * 1.5}px) rotate(720deg) scale(0.5);
            }
          }
        `).join('')}
      `}</style>
    </div>,
    document.body
  )
}
