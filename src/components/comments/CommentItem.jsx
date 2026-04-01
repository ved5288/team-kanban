import { useState } from 'react'
import Avatar from '../Avatar'
import { getUserName } from '../../data/users'
import { timeAgo } from '../../utils/time'
import RenderText from './RenderText'
import EditCommentForm from './EditCommentForm'
import EmojiPickerButton from './EmojiPickerButton'

// Edit and delete-confirmation state live here; parent only needs 5 props.
export default function CommentItem({ comment, currentUser, onSave, onDelete, onAddReaction }) {
  const [isEditing, setIsEditing]         = useState(false)
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
