import { useState, useEffect, useRef, useCallback } from 'react'
import { getUserName, getUserInitials, getUserColor } from '../data/users'
import { timeAgo } from '../utils/time'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_REACTIONS = ['👍', '🎉', '❤️']
const MORE_EMOJIS = ['🚀', '👀', '😂', '🙌', '🔥', '✅', '💯', '😮', '👏', '🤔', '😅', '⚡']

function getDateLabel(isoString) {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function groupByDate(activities) {
  const items = []
  let currentLabel = null
  for (const activity of activities) {
    const label = getDateLabel(activity.timestamp)
    if (label !== currentLabel) {
      items.push({ type: 'separator', label })
      currentLabel = label
    }
    items.push({ type: 'activity', data: activity })
  }
  return items
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    function handleMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onCloseRef.current()
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, []) // stable — reads latest onClose via ref

  return (
    <div
      ref={ref}
      className="absolute right-0 bottom-7 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2 grid grid-cols-6 gap-0.5 w-52"
    >
      {[...QUICK_REACTIONS, ...MORE_EMOJIS].map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onSelect(emoji); onClose() }}
          className="text-lg hover:bg-gray-100 rounded p-0.5 w-7 h-7 flex items-center justify-center transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

// ─── Date Separator ───────────────────────────────────────────────────────────

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 sticky top-0 bg-white z-10">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 whitespace-nowrap font-medium">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

// ─── Activity Item ─────────────────────────────────────────────────────────────

function ActivityItem({ entry, currentUserId, onReact }) {
  const [showPicker, setShowPicker] = useState(false)

  const hasReactions = Object.values(entry.reactions).some((users) => users.length > 0)

  return (
    <div className="group relative px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex gap-2.5">
        {/* User avatar */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 ${getUserColor(entry.userId)}`}
          title={getUserName(entry.userId)}
        >
          {getUserInitials(entry.userId)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-xs text-gray-700 leading-relaxed">
            <span className="font-semibold">{getUserName(entry.userId)}</span>
            {' moved '}
            <span className="font-medium text-gray-900">"{entry.cardTitle}"</span>
            {' from '}
            <span className="font-medium text-indigo-600">{entry.fromColumn}</span>
            {' → '}
            <span className="font-medium text-indigo-600">{entry.toColumn}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(entry.timestamp)}</p>

          {/* Existing reactions */}
          {hasReactions && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(entry.reactions).map(([emoji, users]) => {
                if (users.length === 0) return null
                const visibleNames = users.slice(0, 3).map((uid) => getUserName(uid))
                const extra = users.length - 3
                const tooltipText = extra > 0
                  ? `${visibleNames.join(', ')} +${extra}`
                  : visibleNames.join(', ')
                return (
                  <div key={emoji} className="relative group/reaction">
                    <button
                      onClick={() => onReact(entry.id, emoji)}
                      className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors ${
                        users.includes(currentUserId)
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {emoji} <span>{users.length}</span>
                    </button>
                    {/* Tooltip — left-0 anchored to avoid clipping at panel edge */}
                    <div className="absolute bottom-full left-0 mb-2 z-30
                                    bg-gray-800 text-white text-xs rounded px-2 py-1
                                    whitespace-nowrap pointer-events-none
                                    opacity-0 group-hover/reaction:opacity-100 transition-opacity">
                      {tooltipText}
                      <div className="absolute top-full left-3
                                      border-4 border-transparent border-t-gray-800" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick reaction bar — visible on hover */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-gray-200 rounded-full shadow-sm px-1.5 py-1 z-10">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(entry.id, emoji)}
            className="text-sm hover:scale-125 transition-transform leading-none p-0.5"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
        <div className="relative">
          <button
            onClick={() => setShowPicker((p) => !p)}
            className="text-xs font-bold text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            +
          </button>
          {showPicker && (
            <EmojiPicker
              onSelect={(emoji) => onReact(entry.id, emoji)}
              onClose={() => setShowPicker(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

export default function ActivityFeed({ activities, currentUserId, onReact, isOpen, onToggle }) {
  // Force re-render every 30s so relative timestamps stay fresh
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const items = groupByDate(activities)

  return (
    <div className="relative flex shrink-0 min-h-0">

      {/* Collapse / expand toggle — centred on the left border */}
      <button
        onClick={onToggle}
        title={isOpen ? 'Collapse activity panel' : 'Expand activity panel'}
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                   w-5 h-10 bg-white border border-gray-300 rounded-full shadow-md
                   flex items-center justify-center
                   hover:bg-indigo-50 hover:border-indigo-400 transition-colors"
      >
        <svg
          className="w-3 h-3 text-gray-500"
          fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={2.5}
        >
          <path
            strokeLinecap="round" strokeLinejoin="round"
            d={isOpen ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
          />
        </svg>
      </button>

      {/* Panel content — only rendered when open */}
      {isOpen && (
        <div className="w-[20vw] border-l border-gray-200 bg-white flex flex-col min-h-0 h-full overflow-hidden">

          {/* Scrollable feed */}
          <div className="flex-1 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-10">
                <span className="text-3xl mb-2">📋</span>
                <p className="text-sm text-gray-500 font-medium">No activity yet</p>
                <p className="text-xs text-gray-400 mt-1">Move a card to see it here</p>
              </div>
            ) : (
              <div>
                {items.map((item, i) =>
                  item.type === 'separator' ? (
                    <DateSeparator key={`sep-${i}`} label={item.label} />
                  ) : (
                    <ActivityItem
                      key={item.data.id}
                      entry={item.data}
                      currentUserId={currentUserId}
                      onReact={onReact}
                    />
                  )
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}
