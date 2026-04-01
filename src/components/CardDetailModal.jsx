import { useState, useEffect } from 'react'
import { USERS, getUserColor, getUserInitials, getUserName } from '../data/users'
import CardComments from './CardComments'
import CardLinks from './CardLinks'
import CrossBoardLinks from './CrossBoardLinks'

const PRIORITIES = ['High', 'Medium', 'Low']

const PRIORITY_STYLES = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-green-100 text-green-700',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60)         return 'just now'
  if (seconds < 3600)       return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)      return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(isoString)
}

// ─── CardDetailModal ──────────────────────────────────────────────────────────

/**
 * In-place popup modal for viewing and editing a card.
 *
 * Props:
 *  card             - the card data object
 *  columns          - full columns map from Board state
 *  columnOrder      - ordered array of column IDs
 *  board            - full board state (passed to CardComments / CardLinks)
 *  setBoard         - board state setter
 *  onSave           - (updatedCard) => void
 *  onClose          - () => void
 *  onViewCard       - (cardId) => void  — navigate to another card's detail (required)
 *  workspace        - full workspace object (for cross-board links)
 *  boardId          - ID of the board this card lives on
 *  onLinkExternal   - (fromCardId, fromBoardId, toCardId, toBoardId) => void
 *  onUnlinkExternal - (fromCardId, fromBoardId, toCardId, toBoardId) => void
 *  onSwitchAndView  - (boardId, cardId) => void
 */
export default function CardDetailModal({
  card,
  columns,
  columnOrder,
  board,
  setBoard,
  onSave,
  onClose,
  onViewCard,
  workspace,
  boardId,
  onLinkExternal,
  onUnlinkExternal,
  onSwitchAndView,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [title,       setTitle]       = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [priority,    setPriority]    = useState(card.priority)
  const [assignee,    setAssignee]    = useState(card.assignee)
  const [columnId,    setColumnId]    = useState(card.columnId)

  // Always read the freshest card data from the board (card prop can be stale)
  const liveCard = board.cards[card.id] ?? card

  // Header styling: use card colour when set, grey otherwise
  const hasColor   = !!card.color
  const headerBg   = hasColor ? card.color  : 'bg-gray-100'
  const headerText = hasColor ? 'text-white' : 'text-gray-800'
  const iconColor  = hasColor ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'

  // ── Escape key closes the modal ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      ...card,
      title:       title.trim(),
      description: description.trim(),
      priority,
      assignee,
      columnId,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitle(card.title)
    setDescription(card.description ?? '')
    setPriority(card.priority)
    setAssignee(card.assignee)
    setColumnId(card.columnId)
    setIsEditing(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header — card title + edit button */}
        <div className={`${headerBg} px-6 py-4 flex items-center justify-between shrink-0`}>
          <h2 className={`text-base font-bold ${headerText} truncate pr-4`}>
            {card.title}
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              aria-label="Edit card"
              title="Edit"
              className={`${iconColor} transition-colors shrink-0`}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Read-only view */}
          {!isEditing && (
            <div className="px-6 py-5 space-y-4">

              {/* Priority + status badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${PRIORITY_STYLES[card.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                  {card.priority} priority
                </span>
                <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                  {columns[card.columnId]?.title ?? card.columnId}
                </span>
              </div>

              <hr className="border-gray-100" />

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                {card.description ? (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{card.description}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No description provided.</p>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Assignee + created date */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center
                                text-white text-xs font-bold shrink-0 ${getUserColor(card.assignee)}`}
                  >
                    {getUserInitials(card.assignee)}
                  </div>
                  <span className="text-gray-600">{getUserName(card.assignee)}</span>
                </div>
                <span title={formatDate(card.createdAt)}>Created {timeAgo(card.createdAt)}</span>
              </div>

              <hr className="border-gray-100" />

              {/* Same-board parent/child links */}
              <CardLinks
                card={liveCard}
                board={board}
                setBoard={setBoard}
                onViewCard={onViewCard}
              />

              <hr className="border-gray-100" />

              {/* Cross-board links */}
              {workspace && (
                <>
                  <CrossBoardLinks
                    card={liveCard}
                    boardId={boardId}
                    workspace={workspace}
                    onLinkExternal={onLinkExternal}
                    onUnlinkExternal={onUnlinkExternal}
                    onSwitchAndView={onSwitchAndView}
                  />
                  <hr className="border-gray-100" />
                </>
              )}

              {/* Comments */}
              <CardComments cardId={card.id} board={board} setBoard={setBoard} />

            </div>
          )}

          {/* Edit form */}
          {isEditing && (
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Card title"
                  autoFocus
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none text-gray-700
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Add more detail..."
                  rows={3}
                />
              </div>

              {/* Priority + Assignee row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Assignee
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {Object.values(USERS).map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Status
                </label>
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {columnOrder.map((cid) => (
                    <option key={cid} value={cid}>{columns[cid]?.title ?? cid}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                             hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600
                             hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Save changes
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  )
}
