/**
 * Pure filtering utilities — no React dependencies.
 *
 * activeFilters shape:
 *   {
 *     priority:   string[],          // e.g. ['High', 'Medium']
 *     assignees:  string[],          // e.g. ['vedant', 'yash']
 *     dateFilter: null | DateFilter, // see shapes below
 *   }
 *
 * DateFilter shapes (discriminated by mode):
 *   { mode: 'relative', value: number, unit: 'days' | 'weeks' | 'months' }
 *   { mode: 'between',  from: string,  to: string }   // 'YYYY-MM-DD' or ''
 *   { mode: 'before',   date: string }
 *   { mode: 'after',    date: string }
 *   { mode: 'on',       date: string }
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse 'YYYY-MM-DD' as local midnight.
 * Avoids the well-known UTC-offset bug with new Date('YYYY-MM-DD').
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Set time to 00:00:00.000 in local timezone. */
function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// ── Date filter matching ──────────────────────────────────────────────────────

function matchesDateFilter(isoString, dateFilter) {
  if (!dateFilter) return true

  const cardDate = new Date(isoString)
  const cardDay  = startOfDay(cardDate)
  const { mode } = dateFilter

  if (mode === 'on') {
    if (!dateFilter.date) return true
    const target = parseLocalDate(dateFilter.date)
    if (!target) return true
    return cardDay.getTime() === startOfDay(target).getTime()
  }

  if (mode === 'before') {
    if (!dateFilter.date) return true
    const target = parseLocalDate(dateFilter.date)
    if (!target) return true
    return cardDay < startOfDay(target)
  }

  if (mode === 'after') {
    if (!dateFilter.date) return true
    const target = parseLocalDate(dateFilter.date)
    if (!target) return true
    return cardDay > startOfDay(target)
  }

  if (mode === 'between') {
    const { from, to } = dateFilter
    const fromDate = from ? parseLocalDate(from) : null
    const toDate   = to   ? parseLocalDate(to)   : null
    const afterFrom = !fromDate || cardDay >= startOfDay(fromDate)
    const beforeTo  = !toDate   || cardDay <= startOfDay(toDate)
    return afterFrom && beforeTo
  }

  if (mode === 'relative') {
    const { value, unit } = dateFilter
    if (!value || value <= 0) return true
    const cutoff = new Date()
    if      (unit === 'days')   cutoff.setDate(cutoff.getDate() - value)
    else if (unit === 'weeks')  cutoff.setDate(cutoff.getDate() - value * 7)
    else if (unit === 'months') cutoff.setMonth(cutoff.getMonth() - value)
    return cardDate >= cutoff
  }

  return true // unknown mode — don't hide anything
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a new cards map containing only cards that pass ALL active filters.
 * An empty filter dimension (empty array / null) means "show all" for that dimension.
 *
 * @param  {Object} cards   - { [id]: card } full card map from board state
 * @param  {Object} filters - activeFilters shape
 * @returns {Object}         filtered cards map (same shape as input cards)
 */
export function applyFilters(cards, filters) {
  const { priority, assignees, dateFilter } = filters

  const noPriorityFilter = priority.length === 0
  const noAssigneeFilter = assignees.length === 0
  const noDateFilter     = dateFilter === null

  // Fast-path: nothing active
  if (noPriorityFilter && noAssigneeFilter && noDateFilter) return cards

  const result = {}

  for (const [id, card] of Object.entries(cards)) {
    if (!noPriorityFilter && !priority.includes(card.priority))             continue
    if (!noAssigneeFilter && !assignees.includes(card.assignee))            continue
    if (!noDateFilter     && !matchesDateFilter(card.createdAt, dateFilter)) continue
    result[id] = card
  }

  return result
}

/**
 * Returns the number of active filter dimensions (0–3).
 * Useful for showing a badge count on the filter toggle button.
 */
export function countActiveFilters(filters) {
  let count = 0
  if (filters.priority.length  > 0) count++
  if (filters.assignees.length > 0) count++
  if (filters.dateFilter !== null)  count++
  return count
}
