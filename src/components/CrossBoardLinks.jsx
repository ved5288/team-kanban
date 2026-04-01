import { useState, useMemo } from 'react'

function RemoveIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Shows and manages cross-board card links for a card.
 *
 * Props:
 *  card              - current card object (read from board.cards[card.id] for freshness)
 *  boardId           - the board this card lives on
 *  workspace         - full workspace state { activeBoardId, boards }
 *  onLinkExternal    - (fromCardId, fromBoardId, toCardId, toBoardId) => void
 *  onUnlinkExternal  - (fromCardId, fromBoardId, toCardId, toBoardId) => void
 *  onSwitchAndView   - (boardId, cardId) => void — navigate to another board & open card
 */
export default function CrossBoardLinks({
  card,
  boardId,
  workspace,
  onLinkExternal,
  onUnlinkExternal,
  onSwitchAndView,
}) {
  const [showPicker, setShowPicker]       = useState(false)
  const [pickerBoardId, setPickerBoardId] = useState('')
  const [searchQuery, setSearchQuery]     = useState('')

  const externalLinks = card.externalLinks ?? []
  const otherBoards   = Object.values(workspace.boards).filter((b) => b.id !== boardId)

  // Cards available on the selected picker board (excluding already linked ones)
  const pickerCards = useMemo(() => {
    if (!pickerBoardId) return []
    const pickerBoard = workspace.boards[pickerBoardId]
    if (!pickerBoard) return []
    return Object.values(pickerBoard.cards).filter(
      (c) => !externalLinks.some((l) => l.cardId === c.id && l.boardId === pickerBoardId)
    )
  }, [pickerBoardId, workspace.boards, externalLinks])

  const filteredPickerCards = pickerCards.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Don't render the section at all if there are no other boards
  if (otherBoards.length === 0 && externalLinks.length === 0) return null

  const handleLink = (toCardId) => {
    onLinkExternal(card.id, boardId, toCardId, pickerBoardId)
    setShowPicker(false)
    setPickerBoardId('')
    setSearchQuery('')
  }

  const handleCancelPicker = () => {
    setShowPicker(false)
    setPickerBoardId('')
    setSearchQuery('')
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Cross-Board Links
          {externalLinks.length > 0 && (
            <span className="text-gray-300 ml-1">({externalLinks.length})</span>
          )}
        </p>
        {!showPicker && otherBoards.length > 0 && (
          <button
            onClick={() => setShowPicker(true)}
            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
          >
            + Link card
          </button>
        )}
      </div>

      {/* Existing links */}
      {externalLinks.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {externalLinks.map(({ cardId: linkedCardId, boardId: linkedBoardId }) => {
            const linkedBoard = workspace.boards[linkedBoardId]
            const linkedCard  = linkedBoard?.cards[linkedCardId]
            if (!linkedCard) return null
            return (
              <div
                key={`${linkedBoardId}-${linkedCardId}`}
                className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-purple-400 font-medium truncate">{linkedBoard.name}</p>
                  <button
                    onClick={() => onSwitchAndView?.(linkedBoardId, linkedCardId)}
                    className="text-sm text-purple-700 font-medium hover:underline truncate text-left block w-full"
                  >
                    {linkedCard.title}
                  </button>
                </div>
                <button
                  onClick={() => onUnlinkExternal(card.id, boardId, linkedCardId, linkedBoardId)}
                  title="Remove link"
                  className="text-gray-300 hover:text-red-500 ml-2 shrink-0 transition-colors"
                >
                  <RemoveIcon />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!showPicker && externalLinks.length === 0 && (
        <p className="text-sm text-gray-400 italic">No cross-board links.</p>
      )}

      {/* Picker */}
      {showPicker && (
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {/* Board selector */}
          <select
            autoFocus
            value={pickerBoardId}
            onChange={(e) => { setPickerBoardId(e.target.value); setSearchQuery('') }}
            className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none bg-white"
          >
            <option value="">Select a board…</option>
            {otherBoards.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {pickerBoardId && (
            <>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards…"
                className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none"
              />
              <div className="max-h-40 overflow-y-auto">
                {filteredPickerCards.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-2 italic">No cards available</p>
                ) : (
                  filteredPickerCards.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleLink(c.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 text-gray-700 border-b border-gray-100 last:border-0"
                    >
                      {c.title}
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          <button
            onClick={handleCancelPicker}
            className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
