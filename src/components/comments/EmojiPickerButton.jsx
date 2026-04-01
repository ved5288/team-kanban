import { useState, useRef, useEffect } from 'react'
import { EMOJI_LIST } from './commentHelpers'

// Self-contained: owns open/close state and outside-click handling.
export default function EmojiPickerButton({ onAddReaction }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
        title="Add reaction"
      >
        😊 +
      </button>
      {open && (
        <div className="absolute z-20 bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1">
          {EMOJI_LIST.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => { onAddReaction(emoji); setOpen(false) }}
              className="text-lg hover:bg-gray-100 rounded p-0.5 transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
