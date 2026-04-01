import { useState, useMemo, useCallback } from 'react'
import { INITIAL_BOARD } from '../data/mockData'
import { countActiveFilters } from '../utils/filterUtils'
import { useBoard } from '../hooks/useBoard'
import { useFilters } from '../hooks/useFilters'
import { useBulkSelect } from '../hooks/useBulkSelect'
import { useActivity } from '../hooks/useActivity'
import { useAuth } from '../App'
import Header from './Header'
import Column from './Column'
import AddCardModal from './AddCardModal'
import CardDetailModal from './CardDetailModal'
import FilterBar from './FilterBar'
import AddLaneForm from './AddLaneForm'
import TableView from './TableView'
import BulkActionBar from './BulkActionBar'
import ActivityFeed from './ActivityFeed'

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
    setBoard,
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleMoveCard,
    addLane,
    handleDeleteLane,
    resetBoard,
    handleBulkDelete,
    handleBulkMove,
    handleBulkUpdate,
  } = useBoard()

  const { user } = useAuth()
  const { activities, logMove, toggleReaction } = useActivity()
  const { activeFilters, setActiveFilters, filteredCards } = useFilters(board.cards)

  // Current view mode: 'board' or 'table'
  const [viewMode, setViewMode] = useState('board')

  const bulk = useBulkSelect()

  // Which column's "Add card" was clicked (null = modal closed)
  const [addingToColumn, setAddingToColumn] = useState(null)

  // Which card's detail popup is open (null = closed, string = cardId)
  const [viewingCardId, setViewingCardId] = useState(null)

  // Flat ordered list of all visible card IDs (for shift-range selection)
  const allVisibleIds = useMemo(() =>
    board.columnOrder.flatMap((colId) => {
      const col = board.columns[colId]
      if (!col) return []
      return col.cardIds.filter((id) => id in filteredCards)
    }),
  [board.columnOrder, board.columns, filteredCards])

  // Activity panel open/collapsed state
  const [activityOpen, setActivityOpen] = useState(true)

  // Wrap handleMoveCard to log cross-column moves to the activity feed
  const handleMoveCardWithLog = useCallback((cardId, targetColumnId, targetIndex) => {
    const card = board.cards[cardId]
    if (card && card.columnId !== targetColumnId) {
      logMove({
        cardTitle: card.title,
        cardId,
        fromColumn: board.columns[card.columnId]?.title ?? card.columnId,
        toColumn: board.columns[targetColumnId]?.title ?? targetColumnId,
        userId: user?.id ?? 'unknown',
      })
    }
    handleMoveCard(cardId, targetColumnId, targetIndex)
  }, [board.cards, board.columns, user, logMove, handleMoveCard])

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
        <div className="flex items-center gap-3">
          {/* Bulk select toggle */}
          <button
            onClick={bulk.isSelecting ? bulk.exitSelectMode : bulk.enterSelectMode}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors
              ${bulk.isSelecting
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {bulk.isSelecting ? `Selecting (${bulk.selectedIds.size})` : 'Select'}
          </button>
          <button
            onClick={resetBoard}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            ↺ Reset board
          </button>
        </div>
      </div>

      {/* Filter bar + view toggle + activity toggle */}
      <FilterBar
        activeFilters={activeFilters}
        onChange={setActiveFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleActivity={() => setActivityOpen((p) => !p)}
      />

      {/* Main content: view + activity feed */}
      <div className="flex flex-1 min-h-0">

        {/* Board view */}
        {viewMode === 'board' && (
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
                  onMoveCard={handleMoveCardWithLog}
                  onDeleteLane={isDefault ? undefined : handleDeleteLane}
                  isSelecting={bulk.isSelecting}
                  isSelected={bulk.isSelected}
                  onSelectCard={(cardId, e) => e.shiftKey
                    ? bulk.shiftSelectRange(cardId, allVisibleIds)
                    : bulk.toggleCard(cardId)
                  }
                />
              )
            })}

            {/* Add lane */}
            <div className="shrink-0 w-72">
              <AddLaneForm onAddLane={addLane} />
            </div>
          </div>
        )}

        {/* Table view */}
        {viewMode === 'table' && (
          <TableView
            filteredCards={filteredCards}
            columns={board.columns}
            columnOrder={board.columnOrder}
            onViewCard={setViewingCardId}
            onAddCard={() => setAddingToColumn(board.columnOrder[0])}
          />
        )}

        {/* Activity feed */}
        <ActivityFeed
          activities={activities}
          currentUserId={user?.id ?? ''}
          onReact={(activityId, emoji) => toggleReaction(activityId, emoji, user?.id ?? '')}
          isOpen={activityOpen}
          onToggle={() => setActivityOpen((p) => !p)}
        />

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
        />
      )}

      {/* Bulk action bar */}
      {bulk.isSelecting && (
        <BulkActionBar
          selectedCount={bulk.selectedIds.size}
          totalCount={allVisibleIds.length}
          columns={board.columns}
          columnOrder={board.columnOrder}
          onSelectAll={() => bulk.selectAll(allVisibleIds)}
          onDeselectAll={bulk.deselectAll}
          onExit={bulk.exitSelectMode}
          onDelete={() => {
            if (!window.confirm(`Delete ${bulk.selectedIds.size} card${bulk.selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) return
            handleBulkDelete(bulk.selectedIds)
            bulk.exitSelectMode()
          }}
          onMove={(targetColumnId) => {
            handleBulkMove(bulk.selectedIds, targetColumnId)
            bulk.exitSelectMode()
          }}
          onUpdate={(field, value) => {
            handleBulkUpdate(bulk.selectedIds, field, value)
            bulk.exitSelectMode()
          }}
        />
      )}

    </div>
  )
}
