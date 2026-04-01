/**
 * Label definitions and the symbol gallery for label creation.
 *
 * Labels are stored separately from board state (localStorage key: 'kanban_labels').
 * Each label: { id: string, name: string, symbol: string }
 * Each card stores the IDs of its assigned labels in: card.labelIds: string[]
 */

/** 20 symbols users can pick from when creating a new label. */
export const SYMBOL_GALLERY = [
  '🐛', '🚀', '🔥', '🎨', '⚡', '💡', '✅', '📌',
  '🎯', '⭐', '💎', '🏆', '🌟', '🔶', '🔷', '🟢',
  '🔴', '🟡', '🟣', '💫',
]

/** Pre-seeded labels shown on a fresh board. */
export const DEFAULT_LABELS = [
  { id: 'label-1', name: 'Bug',           symbol: '🐛' },
  { id: 'label-2', name: 'Feature',       symbol: '🚀' },
  { id: 'label-3', name: 'Urgent',        symbol: '🔥' },
  { id: 'label-4', name: 'Design',        symbol: '🎨' },
  { id: 'label-5', name: 'Backend',       symbol: '⚡' },
  { id: 'label-6', name: 'Frontend',      symbol: '💡' },
  { id: 'label-7', name: 'Testing',       symbol: '✅' },
  { id: 'label-8', name: 'Docs',          symbol: '📌' },
]
