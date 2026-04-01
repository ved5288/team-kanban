import { useCallback } from 'react'
import { INITIAL_BOARD } from '../data/mockData'
import { useLocalStorage } from './useLocalStorage'

export function useBoard() {
  const [board, setBoard] = useLocalStorage('kanban_board', INITIAL_BOARD)

  // ── Add a new card ──────────────────────────────────────────────────────────

  const handleAddCard = useCallback((newCard) => {
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
  }, [setBoard])

  // ── Update a card ───────────────────────────────────────────────────────────

  const handleUpdateCard = useCallback((updatedCard) => {
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
  }, [setBoard])

  // ── Delete a card ───────────────────────────────────────────────────────────

  const handleDeleteCard = useCallback((cardId) => {
    setBoard((prev) => {
      const card = prev.cards[cardId]
      if (!card) return prev

      const column = prev.columns[card.columnId]
      const updatedColumn = {
        ...column,
        cardIds: column.cardIds.filter((id) => id !== cardId),
      }

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
  }, [setBoard])

  // ── Move a card (drag & drop) ──────────────────────────────────────────────

  const handleMoveCard = useCallback((cardId, targetColumnId, targetIndex) => {
    setBoard((prev) => {
      const card = prev.cards[cardId]
      if (!card) return prev

      const sourceColumnId = card.columnId
      const sourceColumn = prev.columns[sourceColumnId]
      const targetColumn = prev.columns[targetColumnId]
      if (!sourceColumn || !targetColumn) return prev

      const sourceIndex = sourceColumn.cardIds.indexOf(cardId)

      if (sourceColumnId === targetColumnId) {
        // Same column reorder
        // Adjust for the removed card: DOM still shows N elements when index was
        // calculated, but the filtered list has N-1. If dragging downward, decrement.
        let adjustedIndex = targetIndex
        if (targetIndex > sourceIndex) {
          adjustedIndex = targetIndex - 1
        }
        const clampedIndex = Math.min(adjustedIndex, sourceColumn.cardIds.length - 1)

        // Bail out if the card didn't actually move
        if (clampedIndex === sourceIndex) return prev

        const reorderedIds = [...sourceColumn.cardIds]
        reorderedIds.splice(sourceIndex, 1)
        reorderedIds.splice(clampedIndex, 0, cardId)

        return {
          ...prev,
          columns: {
            ...prev.columns,
            [sourceColumnId]: { ...sourceColumn, cardIds: reorderedIds },
          },
        }
      } else {
        // Cross-column move
        const sourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId)
        const targetCardIds = [...targetColumn.cardIds]
        const clampedIndex = Math.min(targetIndex, targetCardIds.length)
        targetCardIds.splice(clampedIndex, 0, cardId)

        return {
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: { ...card, columnId: targetColumnId },
          },
          columns: {
            ...prev.columns,
            [sourceColumnId]: { ...sourceColumn, cardIds: sourceCardIds },
            [targetColumnId]: { ...targetColumn, cardIds: targetCardIds },
          },
        }
      }
    })
  }, [setBoard])

  // ── Add a new lane ──────────────────────────────────────────────────────────
  // Returns true on success, false if the name is a duplicate (caller should
  // keep the form open so the user can correct the name).

  const addLane = useCallback((name) => {
    const duplicate = Object.values(board.columns).some(
      (col) => col.title.toLowerCase() === name.toLowerCase()
    )
    if (duplicate) {
      alert(`A lane named "${name}" already exists.`)
      return false
    }

    const colId = `col-${Date.now()}`
    setBoard((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [colId]: { id: colId, title: name, cardIds: [] },
      },
      columnOrder: [...prev.columnOrder, colId],
    }))
    return true
  }, [board.columns, setBoard])

  // ── Delete a lane ─────────────────────────────────────────────────────────

  const handleDeleteLane = useCallback((columnId) => {
    // Read from current board for the confirmation message (UI only — not used
    // inside the state updater, so stale-closure risk here is acceptable).
    const column = board.columns[columnId]
    if (!column) return

    const cardCount = column.cardIds.length
    const message = cardCount > 0
      ? `Delete "${column.title}" and its ${cardCount} card${cardCount > 1 ? 's' : ''}? This cannot be undone.`
      : `Delete the empty lane "${column.title}"?`

    if (!window.confirm(message)) return

    setBoard((prev) => {
      // Use prev to ensure we delete the correct card IDs even if the board
      // state has changed since the confirmation dialog was shown.
      const col = prev.columns[columnId]
      if (!col) return prev

      const remainingCards = { ...prev.cards }
      for (const cardId of col.cardIds) {
        delete remainingCards[cardId]
      }

      const { [columnId]: _removed, ...remainingColumns } = prev.columns

      return {
        ...prev,
        cards: remainingCards,
        columns: remainingColumns,
        columnOrder: prev.columnOrder.filter((id) => id !== columnId),
      }
    })
  }, [board.columns, setBoard])

  // ── Reset board (dev helper) ────────────────────────────────────────────────

  const resetBoard = useCallback(() => {
    if (window.confirm('Reset board to the original demo data? All changes will be lost.')) {
      setBoard(INITIAL_BOARD)
    }
  }, [setBoard])

  // ── Bulk operations ────────────────────────────────────────────────────────

  /** Delete all cards in the given Set of card IDs */
  const handleBulkDelete = useCallback((cardIds) => {
    setBoard((prev) => {
      const remaining = { ...prev.cards }
      const updatedColumns = { ...prev.columns }

      for (const cardId of cardIds) {
        const card = remaining[cardId]
        if (!card) continue
        delete remaining[cardId]
        const col = updatedColumns[card.columnId]
        if (col) {
          updatedColumns[card.columnId] = {
            ...col,
            cardIds: col.cardIds.filter((id) => id !== cardId),
          }
        }
      }

      return { ...prev, cards: remaining, columns: updatedColumns }
    })
  }, [setBoard])

  /** Move all cards in the given Set to a target column */
  const handleBulkMove = useCallback((cardIds, targetColumnId) => {
    setBoard((prev) => {
      const targetColumn = prev.columns[targetColumnId]
      if (!targetColumn) return prev

      const updatedCards = { ...prev.cards }
      const updatedColumns = { ...prev.columns }
      const toAppend = []

      for (const cardId of cardIds) {
        const card = updatedCards[cardId]
        if (!card || card.columnId === targetColumnId) continue

        // Remove from source column
        const srcCol = updatedColumns[card.columnId]
        if (srcCol) {
          updatedColumns[card.columnId] = {
            ...srcCol,
            cardIds: srcCol.cardIds.filter((id) => id !== cardId),
          }
        }

        updatedCards[cardId] = { ...card, columnId: targetColumnId }
        toAppend.push(cardId)
      }

      if (toAppend.length === 0) return prev

      updatedColumns[targetColumnId] = {
        ...updatedColumns[targetColumnId],
        cardIds: [...updatedColumns[targetColumnId].cardIds, ...toAppend],
      }

      return { ...prev, cards: updatedCards, columns: updatedColumns }
    })
  }, [setBoard])

  /** Update a specific field (assignee | priority | dueDate) on all selected cards */
  const handleBulkUpdate = useCallback((cardIds, field, value) => {
    setBoard((prev) => {
      const updatedCards = { ...prev.cards }
      for (const cardId of cardIds) {
        if (!updatedCards[cardId]) continue
        updatedCards[cardId] = { ...updatedCards[cardId], [field]: value }
      }
      return { ...prev, cards: updatedCards }
    })
  }, [setBoard])

  return {
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
  }
}
