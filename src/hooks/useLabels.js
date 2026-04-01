import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { DEFAULT_LABELS } from '../data/labelsData'

/**
 * Manages the board-wide labels list in localStorage.
 *
 * Returns:
 *   labels    - Label[]   all labels ({ id, name, symbol })
 *   addLabel  - (name: string, symbol: string) => Label
 */
export function useLabels() {
  const [labels, setLabels] = useLocalStorage('kanban_labels', DEFAULT_LABELS)

  const addLabel = useCallback((name, symbol) => {
    const newLabel = { id: `label-${Date.now()}`, name, symbol }
    setLabels((prev) => [...prev, newLabel])
    return newLabel
  }, [setLabels])

  return { labels, addLabel }
}
