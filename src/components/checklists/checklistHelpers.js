/**
 * Pure helper functions for checklist operations.
 * No side effects — safe to call anywhere.
 */

/** Create a new empty checklist with a title (defaults to "Checklist"). */
export function createChecklist(title) {
  return {
    id: crypto.randomUUID(),
    title: (title && title.trim()) || 'Checklist',
    items: [],
  }
}

/** Create a new unchecked checklist item. */
export function createChecklistItem(text) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Returns progress for a single checklist.
 * Returns null when the checklist has zero items (avoids 0/0 display).
 */
export function getChecklistProgress(checklist) {
  const total = checklist.items.length
  if (total === 0) return null

  const completed = checklist.items.filter((item) => item.completed).length
  const percent = Math.round((completed / total) * 100)

  return { total, completed, percent }
}

/**
 * Aggregates checklist progress across all checklists on a card.
 * Returns { total, completed } or null if the card has no checklist items.
 * Used by the Card thumbnail badge.
 */
export function getCardChecklistSummary(card) {
  const checklists = card.checklists ?? []
  if (checklists.length === 0) return null

  let total = 0
  let completed = 0

  for (const checklist of checklists) {
    for (const item of checklist.items) {
      total += 1
      if (item.completed) completed += 1
    }
  }

  if (total === 0) return null
  return { total, completed }
}
