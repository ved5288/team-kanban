import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../App'
import { USERS, getUserName } from '../data/users'
import Avatar from './Avatar'
import { timeAgo } from '../utils/time'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_LIST = ['👍', '👎', '❤️', '😂', '😮', '🎉', '🚀', '👀']

// ─── Pure helpers ─────────────────────────────────────────────────────────────

// Splices @username into text at the given cursor position, replacing any
// partial @mention that was already being typed.
function spliceUsername(text, cursor, username) {
  return (
    text.slice(0, cursor).replace(/@\w*$/, '') +
    '@' + username + ' ' +
    text.slice(cursor)
  )
}

// Extracts the in-progress @mention query from text up to the cursor.
// Returns null when the cursor is not inside a @mention.
function getMentionQuery(value, cursorPos) {
  const match = value.slice(0, cursorPos).match(/@(\w*)$/)
  return match ? match[1] : null
}

// Shallow board update — avoids repeating the nested spread pattern.
function updateCard(board, cardId, updater) {
  return {
    ...board,
    cards: {
      ...board.cards,
      [cardId]: updater(board.cards[cardId]),
    },
  }
}

// ─── RenderText ───────────────────────────────────────────────────────────────

// Renders comment text with highlighted @mentions.
function RenderText({ text }) {
  const parts = text.split(/(@\w+)/g)
  return (
    <>
      {parts.map((part, i) =>
        /^@\w+$/.test(part)
          ? <span key={i} className="text-indigo-600 font-medium bg-indigo-50 rounded px-0.5">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

// ─── MentionDropdown ──────────────────────────────────────────────────────────

function MentionDropdown({ query, onSelect }) {
  if (query === null) return null

  const users = Object.values(USERS).filter(u =>
    u.id.toLowerCase().includes(query.toLowerCase()) ||
    u.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)

  if (users.length === 0) return null

  return (
    <div className="absolute z-20 top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      {users.map(u => (
        <button
          key={u.id}
          type="button"
          // onMouseDown + preventDefault keeps the textarea focused so the
          // cursor position remains accurate when we read it after selection.
          onMouseDown={e => { e.preventDefault(); onSelect(u.id) }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 text-left transition-colors"
        >
          <Avatar userId={u.id} />
          <div>
            <p className="text-sm font-medium text-gray-800">{u.name}</p>
            <p className="text-xs text-gray-400">@{u.id}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── EmojiPickerButton ────────────────────────────────────────────────────────
// Self-contained: owns open/close state and outside-click handling.

function EmojiPickerButton({ onAddReaction }) {
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

// ─── EditCommentForm ──────────────────────────────────────────────────────────
// Owns its own text state and cursor ref; calls onSave(trimmedText) or onCancel.

function EditCommentForm({ initialText, onSave, onCancel }) {
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

// ─── CommentItem ──────────────────────────────────────────────────────────────
// Edit and delete-confirmation state live here; parent only needs 5 props.

function CommentItem({ comment, currentUser, onSave, onDelete, onAddReaction }) {
  const [isEditing, setIsEditing]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isOwn = comment.authorId === currentUser.id

  return (
    <div className="flex gap-3">
      <Avatar userId={comment.authorId} />

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-800">{getUserName(comment.authorId)}</span>
          <span
            className="text-xs text-gray-400 cursor-default"
            title={new Date(comment.createdAt).toLocaleString()}
          >
            {timeAgo(comment.createdAt)}
          </span>
          {comment.editedAt && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
        </div>

        {/* Body — view or edit mode */}
        {isEditing ? (
          <EditCommentForm
            initialText={comment.text}
            onSave={text => { onSave(comment.id, text); setIsEditing(false) }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            <RenderText text={comment.text} />
          </p>
        )}

        {/* Reactions + actions row */}
        {!isEditing && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Existing reactions */}
            {Object.entries(comment.reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onAddReaction(emoji)}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors
                  ${users.includes(currentUser.id)
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}

            <EmojiPickerButton onAddReaction={onAddReaction} />

            {/* Edit / Delete — own comments only */}
            {isOwn && (
              <>
                <span className="text-gray-200 text-xs select-none">·</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  Edit
                </button>
                {confirmDelete ? (
                  <>
                    <span className="text-xs text-gray-500">Delete?</span>
                    <button
                      type="button"
                      onClick={onDelete}
                      className="text-xs text-red-600 font-medium hover:text-red-800 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CommentForm ──────────────────────────────────────────────────────────────
// New-comment form — owns its own text state and cursor ref.

function CommentForm({ user, onSubmit, onCancel }) {
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

// ─── CardComments (main export) ───────────────────────────────────────────────

export default function CardComments({ cardId, board, setBoard }) {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)

  // Force a re-render every 30s so relative timestamps stay accurate.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const comments = board.cards[cardId]?.comments ?? []

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function addComment(text) {
    setBoard(b => updateCard(b, cardId, card => ({
      ...card,
      comments: [...(card.comments ?? []), {
        id:        crypto.randomUUID(),
        authorId:  user.id,
        text,
        createdAt: new Date().toISOString(),
        editedAt:  null,
        reactions: {},
      }],
    })))
    setShowForm(false)
  }

  function saveEdit(commentId, text) {
    setBoard(b => updateCard(b, cardId, card => ({
      ...card,
      comments: card.comments.map(c =>
        c.id === commentId
          ? { ...c, text, editedAt: new Date().toISOString() }
          : c
      ),
    })))
  }

  function deleteComment(commentId) {
    setBoard(b => updateCard(b, cardId, card => ({
      ...card,
      comments: card.comments.filter(c => c.id !== commentId),
    })))
  }

  function toggleReaction(commentId, emoji) {
    setBoard(b => updateCard(b, cardId, card => ({
      ...card,
      comments: card.comments.map(c => {
        if (c.id !== commentId) return c
        const users    = c.reactions[emoji] ?? []
        const newUsers = users.includes(user.id)
          ? users.filter(u => u !== user.id)
          : [...users, user.id]
        const newReactions = { ...c.reactions }
        if (newUsers.length === 0) delete newReactions[emoji]
        else newReactions[emoji] = newUsers
        return { ...c, reactions: newReactions }
      }),
    })))
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Comments{comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUser={user}
          onSave={saveEdit}
          onDelete={() => deleteComment(comment.id)}
          onAddReaction={emoji => toggleReaction(comment.id, emoji)}
        />
      ))}

      {showForm ? (
        <CommentForm
          user={user}
          onSubmit={addComment}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          + Add comment
        </button>
      )}
    </div>
  )
}
