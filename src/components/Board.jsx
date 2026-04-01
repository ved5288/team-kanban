import { useState } from 'react'
import { INITIAL_BOARD } from '../data/mockData'
import { countActiveFilters } from '../utils/filterUtils'
import { useBoard } from '../hooks/useBoard'
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
 * State is stored in localStorage so it persists across page reloads.
 * The board shape is:
 *   { cards: {id → card}, columns: {id → column}, columnOrder: [id] }
 *
 * Key operations:
 *  - addCard:    adds a new card to a column
 *  - deleteCard: removes a card from board state
 */
export default function Board() {
  const {
    board,
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleMoveCard,
    addLane,
    handleDeleteLane,
    resetBoard,
  } = useBoard()

  const { activeFilters, setActiveFilters, filteredCards } = useFilters(board.cards)

  // Which column's "Add card" was clicked (null = modal closed)
  const [addingToColumn, setAddingToColumn] = useState(null)

  // Which card's detail popup is open (null = closed, string = cardId)
  const [viewingCardId, setViewingCardId] = useState(null)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-100">

      {/* Top navigation */}
      <Header />

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
        />
      )}

    </div>
  )
}
