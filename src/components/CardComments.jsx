import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../App'
import { USERS, getUserName, getUserInitials, getUserColor } from '../data/users'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_LIST = ['👍', '👎', '❤️', '😂', '😮', '🎉', '🚀', '👀']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60)         return 'just now'
  if (seconds < 3600)       return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)      return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Renders comment text with highlighted @mentions
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

function Avatar({ userId, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${cls} ${getUserColor(userId)} rounded-full flex items-center justify-center text-white font-bold shrink-0`}>
      {getUserInitials(userId)}
    </div>
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
          onMouseDown={e => { e.preventDefault(); onSelect(u.id) }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 text-left transition-colors"
        >
          <Avatar userId={u.id} size="sm" />
          <div>
            <p className="text-sm font-medium text-gray-800">{u.name}</p>
            <p className="text-xs text-gray-400">@{u.id}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── EmojiPicker ─────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect }) {
  return (
    <div className="absolute z-20 bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-1">
      {EMOJI_LIST.map(emoji => (
        <button
          key={emoji}
          type="button"
          onMouseDown={e => { e.preventDefault(); onSelect(emoji) }}
          className="text-lg hover:bg-gray-100 rounded p-0.5 transition-colors"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

// ─── CommentForm ──────────────────────────────────────────────────────────────

function CommentForm({ user, text, textareaRef, mentionQuery, onTextChange, onInsertMention, onSubmit, onCancel }) {
  return (
    <div className="space-y-3">
      {/* Author header */}
      <div className="flex items-center gap-2">
        <Avatar userId={user.id} size="sm" />
        <span className="text-sm font-semibold text-gray-800">{getUserName(user.id)}</span>
        <span className="text-xs text-gray-400">@{user.id}</span>
      </div>

      {/* Textarea + mention dropdown */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={onTextChange}
          placeholder="Write a comment… Use @ to mention someone"
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none
                     focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent
                     placeholder-gray-400"
        />
        <MentionDropdown query={mentionQuery} onSelect={onInsertMention} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
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

// ─── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  currentUser,
  isEditing,
  editText,
  editMentionQuery,
  editTextareaRef,
  showEmojiPicker,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditTextChange,
  onInsertMention,
  onDelete,
  onToggleEmojiPicker,
  onAddReaction,
}) {
  const isOwn = comment.authorId === currentUser.id

  return (
    <div className="flex gap-3">
      <Avatar userId={comment.authorId} size="sm" />

      <div className="flex-1 min-w-0">
        {/* Header: name + timestamp + edited marker */}
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

        {/* Body: view or edit mode */}
        {isEditing ? (
          <div className="space-y-2">
            <div className="relative">
              <textarea
                ref={editTextareaRef}
                value={editText}
                onChange={onEditTextChange}
                rows={3}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none
                           focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
              <MentionDropdown query={editMentionQuery} onSelect={onInsertMention} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSaveEdit}
                disabled={!editText.trim()}
                className="text-xs px-3 py-1 bg-indigo-600 text-white rounded font-medium
                           hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="text-xs px-3 py-1 text-gray-600 rounded font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            <RenderText text={comment.text} />
          </p>
        )}

        {/* Reactions + action row */}
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

            {/* Add reaction button */}
            <div className="relative">
              <button
                type="button"
                onClick={onToggleEmojiPicker}
                className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
                title="Add reaction"
              >
                😊 +
              </button>
              {showEmojiPicker && <EmojiPicker onSelect={onAddReaction} />}
            </div>

            {/* Edit / Delete — own comments only */}
            {isOwn && (
              <>
                <span className="text-gray-200 text-xs select-none">·</span>
                <button
                  type="button"
                  onClick={onStartEdit}
                  className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CardComments (main export) ───────────────────────────────────────────────

export default function CardComments({ cardId, board, setBoard }) {
  const { user } = useAuth()

  const [showForm, setShowForm]           = useState(false)
  const [text, setText]                   = useState('')
  const [mentionQuery, setMentionQuery]   = useState(null)

  const [editingId, setEditingId]             = useState(null)
  const [editText, setEditText]               = useState('')
  const [editMentionQuery, setEditMentionQuery] = useState(null)

  const [showEmojiFor, setShowEmojiFor] = useState(null)

  const textareaRef     = useRef(null)
  const editTextareaRef = useRef(null)

  const comments = board.cards[cardId]?.comments ?? []

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiFor) return
    function handler(e) {
      setShowEmojiFor(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmojiFor])

  // ── @mention helpers ────────────────────────────────────────────────────────

  function getMentionQuery(value, cursorPos) {
    const match = value.slice(0, cursorPos).match(/@(\w*)$/)
    return match ? match[1] : null
  }

  function handleTextChange(e) {
    setText(e.target.value)
    setMentionQuery(getMentionQuery(e.target.value, e.target.selectionStart))
  }

  function handleEditTextChange(e) {
    setEditText(e.target.value)
    setEditMentionQuery(getMentionQuery(e.target.value, e.target.selectionStart))
  }

  function insertMention(username, isEdit) {
    const ref = isEdit ? editTextareaRef : textareaRef
    const val = isEdit ? editText : text
    const cursor = ref.current.selectionStart
    const newVal = val.slice(0, cursor).replace(/@\w*$/, '') + '@' + username + ' ' + val.slice(cursor)
    if (isEdit) { setEditText(newVal); setEditMentionQuery(null) }
    else        { setText(newVal);     setMentionQuery(null)     }
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  function addComment() {
    if (!text.trim()) return
    const comment = {
      id:        `c-${Date.now()}`,
      authorId:  user.id,
      text:      text.trim(),
      createdAt: new Date().toISOString(),
      editedAt:  null,
      reactions: {},
    }
    setBoard(b => ({
      ...b,
      cards: {
        ...b.cards,
        [cardId]: {
          ...b.cards[cardId],
          comments: [...(b.cards[cardId].comments ?? []), comment],
        },
      },
    }))
    setText('')
    setShowForm(false)
    setMentionQuery(null)
  }

  function saveEdit(commentId) {
    if (!editText.trim()) return
    setBoard(b => ({
      ...b,
      cards: {
        ...b.cards,
        [cardId]: {
          ...b.cards[cardId],
          comments: b.cards[cardId].comments.map(c =>
            c.id === commentId
              ? { ...c, text: editText.trim(), editedAt: new Date().toISOString() }
              : c
          ),
        },
      },
    }))
    setEditingId(null)
    setEditMentionQuery(null)
  }

  function deleteComment(commentId) {
    setBoard(b => ({
      ...b,
      cards: {
        ...b.cards,
        [cardId]: {
          ...b.cards[cardId],
          comments: b.cards[cardId].comments.filter(c => c.id !== commentId),
        },
      },
    }))
  }

  function toggleReaction(commentId, emoji) {
    setBoard(b => {
      const card    = b.cards[cardId]
      const comment = card.comments.find(c => c.id === commentId)
      const users   = comment.reactions[emoji] ?? []
      const newUsers = users.includes(user.id)
        ? users.filter(u => u !== user.id)
        : [...users, user.id]
      const newReactions = { ...comment.reactions }
      if (newUsers.length === 0) delete newReactions[emoji]
      else newReactions[emoji] = newUsers
      return {
        ...b,
        cards: {
          ...b.cards,
          [cardId]: {
            ...card,
            comments: card.comments.map(c =>
              c.id === commentId ? { ...c, reactions: newReactions } : c
            ),
          },
        },
      }
    })
    setShowEmojiFor(null)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Comments{comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>

      {/* Comment list */}
      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUser={user}
          isEditing={editingId === comment.id}
          editText={editText}
          editMentionQuery={editMentionQuery}
          editTextareaRef={editTextareaRef}
          showEmojiPicker={showEmojiFor === comment.id}
          onStartEdit={() => { setEditingId(comment.id); setEditText(comment.text) }}
          onCancelEdit={() => { setEditingId(null); setEditMentionQuery(null) }}
          onSaveEdit={() => saveEdit(comment.id)}
          onEditTextChange={handleEditTextChange}
          onInsertMention={username => insertMention(username, true)}
          onDelete={() => deleteComment(comment.id)}
          onToggleEmojiPicker={() => setShowEmojiFor(prev => prev === comment.id ? null : comment.id)}
          onAddReaction={emoji => toggleReaction(comment.id, emoji)}
        />
      ))}

      {/* Add comment form or CTA */}
      {showForm ? (
        <CommentForm
          user={user}
          text={text}
          textareaRef={textareaRef}
          mentionQuery={mentionQuery}
          onTextChange={handleTextChange}
          onInsertMention={username => insertMention(username, false)}
          onSubmit={addComment}
          onCancel={() => { setShowForm(false); setText(''); setMentionQuery(null) }}
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
