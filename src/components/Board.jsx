import { useState } from 'react'
import { INITIAL_BOARD } from '../data/mockData'
import { countActiveFilters } from '../utils/filterUtils'
import { useWorkspace } from '../hooks/useWorkspace'
import { useFilters } from '../hooks/useFilters'
import Header from './Header'
import Column from './Column'
import AddCardModal from './AddCardModal'
import CardDetailModal from './CardDetailModal'
import FilterBar from './FilterBar'
import AddLaneForm from './AddLaneForm'

/**
 * The main board view.
 *
 * State now lives in useWorkspace (supports multiple boards).
 * The board shape remains:
 *   { cards: {id → card}, columns: {id → column}, columnOrder: [id] }
 * but is now nested inside a workspace:
 *   { activeBoardId, boards: { [id]: board } }
 */
export default function Board() {
  const {
    workspace,
    board,
    setBoard,
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleMoveCard,
    addLane,
    handleDeleteLane,
    resetBoard,
    createBoard,
    deleteBoard,
    renameBoard,
    switchBoard,
    linkExternalCard,
    unlinkExternalCard,
  } = useWorkspace()

  const { activeFilters, setActiveFilters, filteredCards } = useFilters(board.cards)

  const [addingToColumn, setAddingToColumn] = useState(null)
  const [viewingCardId,  setViewingCardId]  = useState(null)

  // Switch board and optionally open a card (used by cross-board link navigation)
  const handleSwitchAndView = (boardId, cardId) => {
    switchBoard(boardId)
    setViewingCardId(cardId)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-100">

      {/* Top navigation */}
      <Header
        workspace={workspace}
        onSwitchBoard={switchBoard}
        onCreateBoard={createBoard}
        onRenameBoard={renameBoard}
        onDeleteBoard={deleteBoard}
      />

      {/* Board toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <p className="text-sm text-gray-500">
          {Object.keys(board.cards).length} cards across {board.columnOrder.length} columns
        </p>
        <button
          onClick={resetBoard}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          ↺ Reset board
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar
        activeFilters={activeFilters}
        onChange={setActiveFilters}
      />

      {/* Columns */}
      <div className="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
        {board.columnOrder.map((colId) => {
          const column = board.columns[colId]
          if (!column) return null
          const visibleCardIds = column.cardIds.filter((id) => id in filteredCards)
          const isDefault = colId in INITIAL_BOARD.columns
          return (
            <Column
              key={colId}
              column={column}
              cards={board.cards}
              filteredCardIds={visibleCardIds}
              isFiltering={countActiveFilters(activeFilters) > 0}
              onAddCard={setAddingToColumn}
              onViewCard={setViewingCardId}
              onDeleteCard={handleDeleteCard}
              onMoveCard={handleMoveCard}
              onDeleteLane={isDefault ? undefined : handleDeleteLane}
            />
          )
        })}

        {/* Add lane */}
        <div className="shrink-0 w-72">
          <AddLaneForm onAddLane={addLane} />
        </div>
      </div>

      {/* Add card modal */}
      {addingToColumn && (
        <AddCardModal
          defaultColumnId={addingToColumn}
          columns={board.columnOrder.map((id) => board.columns[id]).filter(Boolean)}
          onSave={(card) => { handleAddCard(card); setAddingToColumn(null) }}
          onClose={() => setAddingToColumn(null)}
        />
      )}

      {/* Card detail popup */}
      {viewingCardId && board.cards[viewingCardId] && (
        <CardDetailModal
          card={board.cards[viewingCardId]}
          columns={board.columns}
          columnOrder={board.columnOrder}
          board={board}
          setBoard={setBoard}
          onSave={handleUpdateCard}
          onClose={() => setViewingCardId(null)}
          onViewCard={setViewingCardId}
          workspace={workspace}
          boardId={workspace.activeBoardId}
          onLinkExternal={linkExternalCard}
          onUnlinkExternal={unlinkExternalCard}
          onSwitchAndView={handleSwitchAndView}
        />
      )}

    </div>
  )
}
