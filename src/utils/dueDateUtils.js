/**
 * Shared utilities for due date formatting, status calculation, and badge styles.
 * Used by Card.jsx and CardDetail.jsx.
 */

// ─── Status ───────────────────────────────────────────────────────────────────

/**
 * Returns 'overdue' | 'soon' | 'upcoming' for a given YYYY-MM-DD date string.
 * 'soon' = due today or within the next 3 days.
 */
export function getDueDateStatus(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0)  return 'overdue'
  if (diffDays <= 3) return 'soon'
  return 'upcoming'
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const DUE_DATE_STYLES = {
  overdue:  'bg-red-50   text-red-600   border border-red-200',
  soon:     'bg-amber-50 text-amber-600 border border-amber-200',
  upcoming: 'bg-gray-50  text-gray-500  border border-gray-200',
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Formats a YYYY-MM-DD date string for display on a card badge.
 * e.g. "5 Apr 2026"
 */
export function formatDueDate(dateStr, options = {}) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...options,
  })
}
