import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import { patchCard } from './comments/commentHelpers'
import CommentItem from './comments/CommentItem'
import CommentForm from './comments/CommentForm'

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
    setBoard(b => patchCard(b, cardId, card => ({
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
    setBoard(b => patchCard(b, cardId, card => ({
      ...card,
      comments: card.comments.map(c =>
        c.id === commentId
          ? { ...c, text, editedAt: new Date().toISOString() }
          : c
      ),
    })))
  }

  function deleteComment(commentId) {
    setBoard(b => patchCard(b, cardId, card => ({
      ...card,
      comments: card.comments.filter(c => c.id !== commentId),
    })))
  }

  function toggleReaction(commentId, emoji) {
    setBoard(b => patchCard(b, cardId, card => ({
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
