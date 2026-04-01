import { useState, useMemo } from 'react'
import { applyFilters } from '../utils/filterUtils'

export function useFilters(cards) {
  const [activeFilters, setActiveFilters] = useState({
    priority:   [],
    assignees:  [],
    dateFilter: null,
  })

  const filteredCards = useMemo(
    () => applyFilters(cards, activeFilters),
    [cards, activeFilters]
  )

  return { activeFilters, setActiveFilters, filteredCards }
}
