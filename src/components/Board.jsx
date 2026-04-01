import { useState } from 'react'
import { INITIAL_BOARD } from '../data/mockData'
import { useLocalStorage } from '../hooks/useLocalStorage'
import Header from './Header'
import Column from './Column'
import AddCardModal from './AddCardModal'
import CardDetailModal from './CardDetailModal'

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
  // Board data persisted in localStorage
  const [board, setBoard] = useLocalStorage('kanban_board', INITIAL_BOARD)

  // Which column's "Add card" was clicked (null = modal closed)
  const [addingToColumn, setAddingToColumn] = useState(null)

  // Which card's detail popup is open (null = closed, string = cardId)
  const [viewingCardId, setViewingCardId] = useState(null)

  // ── Add a new card ──────────────────────────────────────────────────────────

  const handleAddCard = (newCard) => {
    setBoard((prev) => {
      const column = prev.columns[newCard.columnId]
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [newCard.id]: newCard,
        },
        columns: {
          ...prev.columns,
          [newCard.columnId]: {
            ...column,
            cardIds: [...column.cardIds, newCard.id],
          },
        },
      }
    })
    setAddingToColumn(null)
  }

  // ── Update a card ───────────────────────────────────────────────────────────

  const handleUpdateCard = (updatedCard) => {
    setBoard((prev) => {
      const oldCard = prev.cards[updatedCard.id]
      if (!oldCard) return prev

      let columns = prev.columns

      // If the card moved columns, update both columns' cardIds arrays
      if (oldCard.columnId !== updatedCard.columnId) {
        const oldColumn = prev.columns[oldCard.columnId]
        const newColumn = prev.columns[updatedCard.columnId]
        columns = {
          ...prev.columns,
          [oldCard.columnId]: {
            ...oldColumn,
            cardIds: oldColumn.cardIds.filter((id) => id !== updatedCard.id),
          },
          [updatedCard.columnId]: {
            ...newColumn,
            cardIds: [...newColumn.cardIds, updatedCard.id],
          },
        }
      }

      return {
        ...prev,
        cards: {
          ...prev.cards,
          [updatedCard.id]: updatedCard,
        },
        columns,
      }
    })
  }

  // ── Delete a card ───────────────────────────────────────────────────────────

  const handleDeleteCard = (cardId) => {
    setBoard((prev) => {
      const card = prev.cards[cardId]
      if (!card) return prev

      // Remove the card from its column's cardIds array
      const column = prev.columns[card.columnId]
      const updatedColumn = {
        ...column,
        cardIds: column.cardIds.filter((id) => id !== cardId),
      }

      // Remove the card from the cards map
      const { [cardId]: _removed, ...remainingCards } = prev.cards

      return {
        ...prev,
        cards: remainingCards,
        columns: {
          ...prev.columns,
          [card.columnId]: updatedColumn,
        },
      }
    })
  }

  // ── Reset board (dev helper) ────────────────────────────────────────────────

  const resetBoard = () => {
    if (window.confirm('Reset board to the original demo data? All changes will be lost.')) {
      setBoard(INITIAL_BOARD)
    }
  }

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

      {/* Columns */}
      <div className="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
        {board.columnOrder.map((colId) => {
          const column = board.columns[colId]
          if (!column) return null
          return (
            <Column
              key={colId}
              column={column}
              cards={board.cards}
              onAddCard={setAddingToColumn}
              onDeleteCard={handleDeleteCard}
              onViewCard={setViewingCardId}
            />
          )
        })}
      </div>

      {/* Add card modal */}
      {addingToColumn && (
        <AddCardModal
          defaultColumnId={addingToColumn}
          onSave={handleAddCard}
          onClose={() => setAddingToColumn(null)}
        />
      )}

      {/* Card detail popup */}
      {viewingCardId && board.cards[viewingCardId] && (
        <CardDetailModal
          card={board.cards[viewingCardId]}
          columns={board.columns}
          columnOrder={board.columnOrder}
          onSave={handleUpdateCard}
          onClose={() => setViewingCardId(null)}
        />
      )}

    </div>
  )
}
