import { useState, useEffect } from 'react'

/**
 * A small toast that fades in, stays briefly, then fades out.
 *
 * Props:
 *  message  - text to display
 *  type     - 'subtle' (single item) or 'bold' (checklist complete)
 *  onDone   - called when the toast finishes its lifecycle
 */
export default function CelebrationToast({ message, type = 'subtle', onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const duration = type === 'bold' ? 3000 : 2000
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [type])

  useEffect(() => {
    if (!visible && onDone) {
      // Wait for the fade-out transition to finish before unmounting
      const cleanup = setTimeout(onDone, 300)
      return () => clearTimeout(cleanup)
    }
  }, [visible, onDone])

  const baseClasses = 'pointer-events-none transition-all duration-300 text-center shadow-lg'

  const styleClasses = type === 'bold'
    ? 'bg-green-600 text-white text-lg font-bold rounded-2xl px-8 py-4 shadow-2xl'
    : 'bg-gray-800 text-white text-xs font-medium rounded-lg px-4 py-2'

  const scaleClass = type === 'bold'
    ? (visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75')
    : (visible ? 'opacity-100' : 'opacity-0')

  return (
    <div className={`${baseClasses} ${styleClasses} ${scaleClass}`}>
      {message}
    </div>
  )
}
