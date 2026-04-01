import { useState, useRef } from 'react'
import Avatar from '../Avatar'
import { getUserName } from '../../data/users'
import { getMentionQuery, spliceUsername } from './commentHelpers'
import MentionDropdown from './MentionDropdown'

// New-comment form — owns its own text state and cursor ref.
export default function CommentForm({ user, onSubmit, onCancel }) {
  const [text, setText]               = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  const cursorRef = useRef(0)

  function handleChange(e) {
    cursorRef.current = e.target.selectionStart
    setText(e.target.value)
    setMentionQuery(getMentionQuery(e.target.value, e.target.selectionStart))
  }

  function insertMention(username) {
    const newVal = spliceUsername(text, cursorRef.current, username)
    setText(newVal)
    setMentionQuery(null)
  }

  function handleSubmit() {
    if (!text.trim()) return
    onSubmit(text.trim())
    setText('')
    setMentionQuery(null)
  }

  return (
    <div className="space-y-3">
      {/* Author header */}
      <div className="flex items-center gap-2">
        <Avatar userId={user.id} />
        <span className="text-sm font-semibold text-gray-800">{getUserName(user.id)}</span>
        <span className="text-xs text-gray-400">@{user.id}</span>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Write a comment… Use @ to mention someone"
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none
                     focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent
                     placeholder-gray-400"
        />
        <MentionDropdown query={mentionQuery} onSelect={insertMention} />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-medium
                     hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-1.5 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
