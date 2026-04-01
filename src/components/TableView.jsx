import { useState, useMemo, useEffect } from 'react'
import { getUserName, getUserInitials, getUserColor } from '../data/users'
import { formatDueDate, getDueDateStatus, DUE_DATE_STYLES } from '../utils/dueDateUtils'
import { timeAgo } from '../utils/time'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 25

const PRIORITY_STYLES = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-green-100 text-green-700',
}

const SORTABLE_COLUMNS = [
  { key: 'title',     label: 'Title'        },
  { key: 'status',    label: 'Status'       },
  { key: 'priority',  label: 'Priority'     },
  { key: 'assignee',  label: 'Assignee'     },
  { key: 'dueDate',   label: 'Due Date'     },
  { key: 'createdAt', label: 'Created'      },
]

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 }

// ─── Pagination helpers ──────────────────────────────────────────────────────

/**
 * Returns an array of page indices and '...' ellipsis markers.
 * Always shows first, last, and up to 2 pages around the current page.
 * e.g. [0, '...', 3, 4, 5, '...', 9] for page 4 of 10.
 */
function getPageNumbers(totalPages, current) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i)

  const pages = new Set([0, totalPages - 1])
  for (let i = Math.max(1, current - 1); i <= Math.min(totalPages - 2, current + 1); i++) {
    pages.add(i)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('...')
    result.push(sorted[i])
  }
  return result
}

// ─── Sort logic ──────────────────────────────────────────────────────────────

function compareCards(a, b, sortKey, sortDir, columns) {
  let valA, valB

  switch (sortKey) {
    case 'title':
      valA = a.title.toLowerCase()
      valB = b.title.toLowerCase()
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)

    case 'status':
      valA = columns[a.columnId]?.title?.toLowerCase() ?? ''
      valB = columns[b.columnId]?.title?.toLowerCase() ?? ''
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)

    case 'priority':
      valA = PRIORITY_ORDER[a.priority] ?? 9
      valB = PRIORITY_ORDER[b.priority] ?? 9
      return sortDir === 'asc' ? valA - valB : valB - valA

    case 'assignee':
      valA = getUserName(a.assignee).toLowerCase()
      valB = getUserName(b.assignee).toLowerCase()
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)

    case 'dueDate':
      // Cards without due dates go to the end
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return sortDir === 'asc'
        ? a.dueDate.localeCompare(b.dueDate)
        : b.dueDate.localeCompare(a.dueDate)

    case 'createdAt':
      return sortDir === 'asc'
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)

    default:
      return 0
  }
}

// ─── Sort arrow indicator ────────────────────────────────────────────────────

function SortArrow({ columnKey, sortKey, sortDir }) {
  if (columnKey !== sortKey) {
    return (
      <svg className="w-3 h-3 text-gray-300 ml-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }
  return (
    <svg className="w-3 h-3 text-indigo-600 ml-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      {sortDir === 'asc'
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      }
    </svg>
  )
}

// ─── TableView Component ─────────────────────────────────────────────────────

/**
 * Spreadsheet-style table view showing all cards in a flat list.
 *
 * Props:
 *  filteredCards    - filtered cards map (subset of cards)
 *  columns         - board columns map { id → column }
 *  columnOrder     - array of column IDs for ordering
 *  onViewCard      - (cardId) => void   opens card detail modal
 *  onAddCard       - () => void         opens add card modal
 */
export default function TableView({ filteredCards, columns, columnOrder, onViewCard, onAddCard }) {
  const [sortKey, setSortKey] = useState('dueDate')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(0)

  // Build sorted card list from filtered cards
  const sortedCards = useMemo(() => {
    const cardList = Object.values(filteredCards)
    cardList.sort((a, b) => compareCards(a, b, sortKey, sortDir, columns))
    return cardList
  }, [filteredCards, sortKey, sortDir, columns])

  // Reset page when filtered results change
  const filteredCount = Object.keys(filteredCards).length
  useEffect(() => { setPage(0) }, [filteredCount])

  // Pagination
  const totalCards = sortedCards.length
  const totalPages = Math.max(1, Math.ceil(totalCards / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pagedCards = sortedCards.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  // Reset page on sort change
  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Table container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse min-w-[800px]">

          {/* Header */}
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              {SORTABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`text-left text-xs font-semibold uppercase tracking-wide px-4 py-3
                              cursor-pointer select-none hover:bg-gray-100 transition-colors
                              ${col.key === 'title' ? 'w-[30%]' : ''}
                              ${sortKey === col.key ? 'text-indigo-600' : 'text-gray-500'}`}
                >
                  <div className="flex items-center">
                    {col.label}
                    <SortArrow columnKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-100">
            {pagedCards.length === 0 ? (
              <tr>
                <td colSpan={SORTABLE_COLUMNS.length} className="text-center py-16 text-sm text-gray-400">
                  No cards match the current filters.
                </td>
              </tr>
            ) : (
              pagedCards.map((card) => {
                const columnTitle = columns[card.columnId]?.title ?? card.columnId
                const dueDateStatus = card.dueDate ? getDueDateStatus(card.dueDate) : null

                return (
                  <tr
                    key={card.id}
                    onClick={() => onViewCard(card.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewCard(card.id) } }}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors group
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
                  >
                    {/* Title */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {card.title}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                        {columnTitle}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_STYLES[card.priority] ?? ''}`}>
                        {card.priority}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center
                                      text-white text-[10px] font-bold shrink-0 ${getUserColor(card.assignee)}`}
                        >
                          {getUserInitials(card.assignee)}
                        </div>
                        <span className="text-sm text-gray-700">{getUserName(card.assignee)}</span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-3">
                      {card.dueDate ? (
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${DUE_DATE_STYLES[dueDateStatus]}`}>
                          {formatDueDate(card.dueDate)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">{timeAgo(card.createdAt)}</span>
                    </td>
                  </tr>
                )
              })
            )}

            {/* Add card row */}
            <tr
              onClick={onAddCard}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAddCard() } }}
              tabIndex={0}
              role="button"
              className="hover:bg-indigo-50/50 cursor-pointer transition-colors group
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
            >
              <td colSpan={SORTABLE_COLUMNS.length} className="px-4 py-3">
                <span className="text-sm text-gray-400 group-hover:text-indigo-600 transition-colors font-medium">
                  + Add card
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, totalCards)} of {totalCards} cards
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                         disabled:text-gray-300 disabled:cursor-not-allowed
                         text-gray-600 hover:bg-gray-100"
            >
              Previous
            </button>
            {getPageNumbers(totalPages, safePage).map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`w-7 h-7 text-xs font-medium rounded-lg transition-colors
                             ${item === safePage
                               ? 'bg-indigo-600 text-white'
                               : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {item + 1}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                         disabled:text-gray-300 disabled:cursor-not-allowed
                         text-gray-600 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
