import { useState, useCallback, useEffect } from 'react'

/**
 * Manages bulk card selection state.
 *
 * Returns:
 *  isSelecting        - bool: selection mode is active
 *  selectedIds        - Set<string>: currently selected card IDs
 *  enterSelectMode    - () => void
 *  exitSelectMode     - () => void
 *  toggleCard         - (cardId) => void
 *  shiftSelectRange   - (cardId, orderedIds) => void  — shift-click range select
 *  selectAll          - (ids: string[]) => void
 *  deselectAll        - () => void
 *  isSelected         - (cardId) => bool
 */
export function useBulkSelect() {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  // Track last-clicked card for shift-range selection
  const [lastClickedId, setLastClickedId] = useState(null)

  // Escape key exits selection mode
  useEffect(() => {
    if (!isSelecting) return
    const handler = (e) => {
      if (e.key === 'Escape') exitSelectMode()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isSelecting])

  const enterSelectMode = useCallback(() => {
    setIsSelecting(true)
    setSelectedIds(new Set())
    setLastClickedId(null)
  }, [])

  const exitSelectMode = useCallback(() => {
    setIsSelecting(false)
    setSelectedIds(new Set())
    setLastClickedId(null)
  }, [])

  const toggleCard = useCallback((cardId) => {
    setLastClickedId(cardId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])

  /**
   * Shift-click: select all cards between lastClickedId and cardId
   * orderedIds: flat ordered array of all visible card IDs across the board
   */
  const shiftSelectRange = useCallback((cardId, orderedIds) => {
    if (!lastClickedId || lastClickedId === cardId) {
      toggleCard(cardId)
      return
    }
    const a = orderedIds.indexOf(lastClickedId)
    const b = orderedIds.indexOf(cardId)
    if (a === -1 || b === -1) { toggleCard(cardId); return }
    const [start, end] = a < b ? [a, b] : [b, a]
    const rangeIds = orderedIds.slice(start, end + 1)
    setLastClickedId(cardId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      rangeIds.forEach((id) => next.add(id))
      return next
    })
  }, [lastClickedId, toggleCard])

  const selectAll = useCallback((ids) => {
    setSelectedIds(new Set(ids))
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((cardId) => selectedIds.has(cardId), [selectedIds])

  return {
    isSelecting,
    selectedIds,
    enterSelectMode,
    exitSelectMode,
    toggleCard,
    shiftSelectRange,
    selectAll,
    deselectAll,
    isSelected,
  }
}
