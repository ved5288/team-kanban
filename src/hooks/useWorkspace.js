import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { INITIAL_WORKSPACE, DEFAULT_COLUMNS } from '../data/workspaceData'
import { INITIAL_BOARD } from '../data/mockData'

/**
 * useWorkspace — single source of truth for all boards and cards.
 *
 * Replaces useBoard. Stores state in 'kanban_workspace' (localStorage).
 * Exposes the same card-operation API as useBoard (add/update/delete/move/lane)
 * so Board.jsx requires minimal changes, plus board-level CRUD and cross-board
 * card linking.
 */
export function useWorkspace() {
  const [workspace, setWorkspace] = useLocalStorage('kanban_workspace', INITIAL_WORKSPACE)

  const activeBoard = workspace.boards[workspace.activeBoardId]

  // ── Internal helper: update only the active board ─────────────────────────

  const setActiveBoard = useCallback((updater) => {
    setWorkspace((prev) => ({
      ...prev,
      boards: {
        ...prev.boards,
        [prev.activeBoardId]:
          typeof updater === 'function'
            ? updater(prev.boards[prev.activeBoardId])
            : updater,
      },
    }))
  }, [setWorkspace])

  // ── Board management ──────────────────────────────────────────────────────

  const createBoard = useCallback((name) => {
    const id = `board-${Date.now()}`
    setWorkspace((prev) => ({
      ...prev,
      activeBoardId: id,
      boards: {
        ...prev.boards,
        [id]: {
          id,
          name: name.trim(),
          createdAt: new Date().toISOString(),
          cards: {},
          ...DEFAULT_COLUMNS,
        },
      },
    }))
    return id
  }, [setWorkspace])

  const deleteBoard = useCallback((boardId) => {
    setWorkspace((prev) => {
      if (Object.keys(prev.boards).length <= 1) return prev // can't delete last board

      const boardName = prev.boards[boardId]?.name ?? 'this board'
      if (!window.confirm(`Delete "${boardName}"? All cards on this board will be lost.`)) return prev

      const { [boardId]: _removed, ...remainingBoards } = prev.boards

      // Clean up externalLinks in surviving boards that point to the deleted board
      const cleanedBoards = {}
      for (const [bid, board] of Object.entries(remainingBoards)) {
        const cleanedCards = {}
        for (const [cid, card] of Object.entries(board.cards)) {
          cleanedCards[cid] = {
            ...card,
            externalLinks: (card.externalLinks ?? []).filter((l) => l.boardId !== boardId),
          }
        }
        cleanedBoards[bid] = { ...board, cards: cleanedCards }
      }

      const newActiveBoardId =
        boardId === prev.activeBoardId
          ? Object.keys(cleanedBoards)[0]
          : prev.activeBoardId

      return { ...prev, activeBoardId: newActiveBoardId, boards: cleanedBoards }
    })
  }, [setWorkspace])

  const renameBoard = useCallback((boardId, name) => {
    if (!name.trim()) return
    setWorkspace((prev) => ({
      ...prev,
      boards: {
        ...prev.boards,
        [boardId]: { ...prev.boards[boardId], name: name.trim() },
      },
    }))
  }, [setWorkspace])

  const switchBoard = useCallback((boardId) => {
    setWorkspace((prev) => ({ ...prev, activeBoardId: boardId }))
  }, [setWorkspace])

  // ── Card operations (mirrors useBoard API) ────────────────────────────────

  const handleAddCard = useCallback((newCard) => {
    setActiveBoard((prev) => {
      const column = prev.columns[newCard.columnId]
      return {
        ...prev,
        cards: { ...prev.cards, [newCard.id]: newCard },
        columns: {
          ...prev.columns,
          [newCard.columnId]: { ...column, cardIds: [...column.cardIds, newCard.id] },
        },
      }
    })
  }, [setActiveBoard])

  const handleUpdateCard = useCallback((updatedCard) => {
    setActiveBoard((prev) => {
      const oldCard = prev.cards[updatedCard.id]
      if (!oldCard) return prev

      let columns = prev.columns
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

      return { ...prev, cards: { ...prev.cards, [updatedCard.id]: updatedCard }, columns }
    })
  }, [setActiveBoard])

  const handleDeleteCard = useCallback((cardId) => {
    setWorkspace((prev) => {
      const activeBoardId = prev.activeBoardId
      const board = prev.boards[activeBoardId]
      const card = board?.cards[cardId]
      if (!card) return prev

      const column = board.columns[card.columnId]
      const updatedColumn = { ...column, cardIds: column.cardIds.filter((id) => id !== cardId) }
      const { [cardId]: _removed, ...remainingCards } = board.cards

      // Clean up same-board parent/child links
      const linkPatches = {}
      if (card.parentCardId && remainingCards[card.parentCardId]) {
        linkPatches[card.parentCardId] = {
          ...remainingCards[card.parentCardId],
          childCardIds: (remainingCards[card.parentCardId].childCardIds ?? []).filter((id) => id !== cardId),
        }
      }
      for (const childId of (card.childCardIds ?? [])) {
        if (remainingCards[childId]) {
          linkPatches[childId] = { ...remainingCards[childId], parentCardId: null }
        }
      }

      const updatedBoards = {
        ...prev.boards,
        [activeBoardId]: {
          ...board,
          cards: { ...remainingCards, ...linkPatches },
          columns: { ...board.columns, [card.columnId]: updatedColumn },
        },
      }

      // Clean up externalLinks in OTHER boards that pointed to this card
      for (const [bid, b] of Object.entries(updatedBoards)) {
        if (bid === activeBoardId) continue
        let changed = false
        const cleanedCards = {}
        for (const [cid, c] of Object.entries(b.cards)) {
          const filtered = (c.externalLinks ?? []).filter(
            (l) => !(l.cardId === cardId && l.boardId === activeBoardId)
          )
          if (filtered.length !== (c.externalLinks ?? []).length) changed = true
          cleanedCards[cid] = { ...c, externalLinks: filtered }
        }
        if (changed) updatedBoards[bid] = { ...b, cards: cleanedCards }
      }

      return { ...prev, boards: updatedBoards }
    })
  }, [setWorkspace])

  const handleMoveCard = useCallback((cardId, targetColumnId, targetIndex) => {
    setActiveBoard((prev) => {
      const card = prev.cards[cardId]
      if (!card) return prev

      const sourceColumnId = card.columnId
      const sourceColumn = prev.columns[sourceColumnId]
      const targetColumn = prev.columns[targetColumnId]
      if (!sourceColumn || !targetColumn) return prev

      const sourceIndex = sourceColumn.cardIds.indexOf(cardId)

      if (sourceColumnId === targetColumnId) {
        let adjustedIndex = targetIndex
        if (targetIndex > sourceIndex) adjustedIndex = targetIndex - 1
        const clampedIndex = Math.min(adjustedIndex, sourceColumn.cardIds.length - 1)
        if (clampedIndex === sourceIndex) return prev

        const reorderedIds = [...sourceColumn.cardIds]
        reorderedIds.splice(sourceIndex, 1)
        reorderedIds.splice(clampedIndex, 0, cardId)

        return {
          ...prev,
          columns: { ...prev.columns, [sourceColumnId]: { ...sourceColumn, cardIds: reorderedIds } },
        }
      } else {
        const sourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId)
        const targetCardIds = [...targetColumn.cardIds]
        const clampedIndex = Math.min(targetIndex, targetCardIds.length)
        targetCardIds.splice(clampedIndex, 0, cardId)

        return {
          ...prev,
          cards: { ...prev.cards, [cardId]: { ...card, columnId: targetColumnId } },
          columns: {
            ...prev.columns,
            [sourceColumnId]: { ...sourceColumn, cardIds: sourceCardIds },
            [targetColumnId]: { ...targetColumn, cardIds: targetCardIds },
          },
        }
      }
    })
  }, [setActiveBoard])

  const addLane = useCallback((name) => {
    const duplicate = Object.values(activeBoard.columns).some(
      (col) => col.title.toLowerCase() === name.toLowerCase()
    )
    if (duplicate) {
      alert(`A lane named "${name}" already exists.`)
      return false
    }

    const colId = `col-${Date.now()}`
    setActiveBoard((prev) => ({
      ...prev,
      columns: { ...prev.columns, [colId]: { id: colId, title: name, cardIds: [] } },
      columnOrder: [...prev.columnOrder, colId],
    }))
    return true
  }, [activeBoard?.columns, setActiveBoard])

  const handleDeleteLane = useCallback((columnId) => {
    const column = activeBoard?.columns[columnId]
    if (!column) return

    const cardCount = column.cardIds.length
    const message =
      cardCount > 0
        ? `Delete "${column.title}" and its ${cardCount} card${cardCount > 1 ? 's' : ''}? This cannot be undone.`
        : `Delete the empty lane "${column.title}"?`
    if (!window.confirm(message)) return

    setActiveBoard((prev) => {
      const col = prev.columns[columnId]
      if (!col) return prev

      const remainingCards = { ...prev.cards }
      const deletedIds = new Set(col.cardIds)
      for (const cardId of col.cardIds) {
        const card = remainingCards[cardId]
        if (card) {
          if (card.parentCardId && remainingCards[card.parentCardId] && !deletedIds.has(card.parentCardId)) {
            remainingCards[card.parentCardId] = {
              ...remainingCards[card.parentCardId],
              childCardIds: (remainingCards[card.parentCardId].childCardIds ?? []).filter((id) => id !== cardId),
            }
          }
          for (const childId of (card.childCardIds ?? [])) {
            if (remainingCards[childId] && !deletedIds.has(childId)) {
              remainingCards[childId] = { ...remainingCards[childId], parentCardId: null }
            }
          }
        }
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
  }, [activeBoard?.columns, setActiveBoard])

  const resetBoard = useCallback(() => {
    if (window.confirm('Reset board to the original demo data? All changes will be lost.')) {
      setActiveBoard((prev) => ({
        ...INITIAL_BOARD,
        id: prev.id,
        name: prev.name,
        createdAt: prev.createdAt,
      }))
    }
  }, [setActiveBoard])

  // ── Cross-board card linking ───────────────────────────────────────────────

  const linkExternalCard = useCallback((fromCardId, fromBoardId, toCardId, toBoardId) => {
    setWorkspace((prev) => {
      const boards = { ...prev.boards }

      const applyLink = (boardId, cardId, targetCardId, targetBoardId) => {
        const board = boards[boardId]
        const card = board?.cards[cardId]
        if (!card) return
        const already = (card.externalLinks ?? []).some(
          (l) => l.cardId === targetCardId && l.boardId === targetBoardId
        )
        if (already) return
        boards[boardId] = {
          ...board,
          cards: {
            ...board.cards,
            [cardId]: {
              ...card,
              externalLinks: [...(card.externalLinks ?? []), { cardId: targetCardId, boardId: targetBoardId }],
            },
          },
        }
      }

      applyLink(fromBoardId, fromCardId, toCardId, toBoardId)
      applyLink(toBoardId, toCardId, fromCardId, fromBoardId)

      return { ...prev, boards }
    })
  }, [setWorkspace])

  const unlinkExternalCard = useCallback((fromCardId, fromBoardId, toCardId, toBoardId) => {
    setWorkspace((prev) => {
      const boards = { ...prev.boards }

      const removeLink = (boardId, cardId, targetCardId, targetBoardId) => {
        const board = boards[boardId]
        const card = board?.cards[cardId]
        if (!card) return
        boards[boardId] = {
          ...board,
          cards: {
            ...board.cards,
            [cardId]: {
              ...card,
              externalLinks: (card.externalLinks ?? []).filter(
                (l) => !(l.cardId === targetCardId && l.boardId === targetBoardId)
              ),
            },
          },
        }
      }

      removeLink(fromBoardId, fromCardId, toCardId, toBoardId)
      removeLink(toBoardId, toCardId, fromCardId, fromBoardId)

      return { ...prev, boards }
    })
  }, [setWorkspace])

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    workspace,
    setWorkspace,
    activeBoard,
    createBoard,
    deleteBoard,
    renameBoard,
    switchBoard,
    // Board.jsx-compatible card operations
    board: activeBoard,
    setBoard: setActiveBoard,
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleMoveCard,
    addLane,
    handleDeleteLane,
    resetBoard,
    // Cross-board linking
    linkExternalCard,
    unlinkExternalCard,
  }
}
