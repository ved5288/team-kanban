import { useState, useRef } from 'react'
import { getMentionQuery, spliceUsername } from './commentHelpers'
import MentionDropdown from './MentionDropdown'

// Owns its own text state and cursor ref; calls onSave(trimmedText) or onCancel.
export default function EditCommentForm({ initialText, onSave, onCancel }) {
  const [text, setText] = useState(initialText)
  const [mentionQuery, setMentionQuery] = useState(null)
  const cursorRef = useRef(0)

  function handleChange(e) {
    // Store cursor before React re-renders so insertMention reads the right position.
    cursorRef.current = e.target.selectionStart
    setText(e.target.value)
    setMentionQuery(getMentionQuery(e.target.value, e.target.selectionStart))
  }

  function insertMention(username) {
    const newVal = spliceUsername(text, cursorRef.current, username)
    setText(newVal)
    setMentionQuery(null)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={text}
          onChange={handleChange}
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none
                     focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
        />
        <MentionDropdown query={mentionQuery} onSelect={insertMention} />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(text.trim())}
          disabled={!text.trim()}
          className="text-xs px-3 py-1 bg-indigo-600 text-white rounded font-medium
                     hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1 text-gray-600 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
