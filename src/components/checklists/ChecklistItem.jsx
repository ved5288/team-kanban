import { useState, useRef, useEffect } from 'react'

/**
 * A single checklist item row: checkbox + text + delete button.
 * Features animated strikethrough on completion.
 *
 * Props:
 *  item      - { id, text, completed }
 *  onToggle  - (itemId) => void
 *  onEdit    - (itemId, newText) => void
 *  onDelete  - (itemId) => void
 */
export default function ChecklistItem({ item, onToggle, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)
  const inputRef = useRef(null)

  // Track previous completed state to trigger animation only on change
  const prevCompletedRef = useRef(item.completed)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (item.completed && !prevCompletedRef.current) {
      // Just got checked — trigger strikethrough animation
      setAnimating(true)
      const timer = setTimeout(() => setAnimating(false), 400)
      prevCompletedRef.current = item.completed
      return () => clearTimeout(timer)
    }
    prevCompletedRef.current = item.completed
  }, [item.completed])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== item.text) {
      onEdit(item.id, trimmed)
    }
    setEditText(trimmed || item.text)
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setEditText(item.text)
      setIsEditing(false)
    }
  }

  return (
    <div className="group flex items-center gap-2 py-1.5 px-1 rounded hover:bg-gray-50 transition-colors">
      {/* Drag handle — visible on hover */}
      <div className="opacity-0 group-hover:opacity-100 text-gray-300 cursor-grab active:cursor-grabbing shrink-0 transition-opacity">
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(item.id)}
        className="w-4 h-4 rounded border-gray-300 text-indigo-600
                   focus:ring-2 focus:ring-indigo-500 cursor-pointer shrink-0"
      />

      {/* Text — click to edit, with animated strikethrough */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm px-1 py-0.5 border border-gray-300 rounded
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-sm cursor-text select-none relative ${
            item.completed ? 'text-gray-400' : 'text-gray-700'
          }`}
        >
          {item.text}
          {/* Animated strikethrough line */}
          {item.completed && (
            <span
              className={`absolute left-0 top-1/2 h-px bg-gray-400 ${
                animating ? 'strikethrough-animate' : 'w-full'
              }`}
            />
          )}
        </span>
      )}

      {/* Delete button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500
                   transition-opacity p-0.5 shrink-0"
        title="Delete item"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Strikethrough animation keyframes */}
      <style>{`
        .strikethrough-animate {
          animation: strikethrough 0.4s ease-out forwards;
        }
        @keyframes strikethrough {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
