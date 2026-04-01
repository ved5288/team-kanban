import { useState } from 'react'
import { USERS, getUserName, getUserInitials, getUserColor } from '../data/users'
import { countActiveFilters } from '../utils/filterUtils'
import MultiSelectDropdown from './MultiSelectDropdown'
import DateFilterPicker from './DateFilterPicker'

// ── Static option lists ───────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { value: 'High',   label: 'High'   },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low',    label: 'Low'    },
]

const PRIORITY_BADGE = {
  High:   'bg-red-100   text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-green-100 text-green-700',
}

const ASSIGNEE_OPTIONS = Object.values(USERS)
  .map((u) => ({ value: u.id, label: u.name }))
  .sort((a, b) => a.label.localeCompare(b.label))

// ── Helpers ───────────────────────────────────────────────────────────────────

function describeDateFilter(f) {
  if (!f) return ''
  if (f.mode === 'relative') return `Last ${f.value} ${f.unit}`
  if (f.mode === 'on')       return `On ${f.date}`
  if (f.mode === 'before')   return `Before ${f.date}`
  if (f.mode === 'after')    return `After ${f.date}`
  if (f.mode === 'between')  return `${f.from || '…'} → ${f.to || '…'}`
  return 'Date filter'
}

// ── Chip sub-component ────────────────────────────────────────────────────────

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium
                     px-2.5 py-1 rounded-full
                     bg-indigo-50 text-indigo-700 border border-indigo-200">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="text-indigo-400 hover:text-indigo-700 leading-none font-bold"
      >
        ×
      </button>
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Board-level filter bar.
 *
 * Props:
 *  activeFilters - { priority: string[], assignees: string[], dateFilter: null|object }
 *  onChange      - (newFilters) => void  receives the full updated filters object
 */
export default function FilterBar({ activeFilters, onChange, onOpenActivity }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { priority, assignees, dateFilter } = activeFilters
  const activeCount = countActiveFilters(activeFilters)

  const clearAll = () => onChange({ priority: [], assignees: [], dateFilter: null })

  const removePriority = (p) =>
    onChange({ ...activeFilters, priority: priority.filter((v) => v !== p) })

  const removeAssignee = (uid) =>
    onChange({ ...activeFilters, assignees: assignees.filter((v) => v !== uid) })

  const clearDate = () => onChange({ ...activeFilters, dateFilter: null })

  return (
    <div className="bg-white border-b border-gray-200">

      {/* ── Always-visible toggle row ── */}
      <div className="flex items-center gap-3 px-6 py-2.5 flex-wrap">

        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600
                     hover:text-indigo-600 transition-colors shrink-0"
        >
          {/* Filter icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                             bg-indigo-600 text-white text-xs font-bold leading-none">
              {activeCount}
            </span>
          )}
          {/* Chevron */}
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Active filter chips (shown when collapsed) */}
        {!isExpanded && activeCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {priority.map((p) => (
              <Chip key={p} label={p} onRemove={() => removePriority(p)} />
            ))}
            {assignees.map((uid) => (
              <Chip key={uid} label={getUserName(uid)} onRemove={() => removeAssignee(uid)} />
            ))}
            {dateFilter && (
              <Chip label={describeDateFilter(dateFilter)} onRemove={clearDate} />
            )}
          </div>
        )}

        {/* Activity tab */}
        <button
          onClick={onOpenActivity}
          className="flex items-center gap-2 text-sm font-medium text-gray-600
                     hover:text-indigo-600 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activity
        </button>

        {/* Clear all — right-aligned */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* ── Expanded filter controls ── */}
      {isExpanded && (
        <div className="flex flex-wrap gap-6 px-6 pb-5 pt-1 border-t border-gray-100 items-start">

          {/* Priority filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</span>
            <MultiSelectDropdown
              label="Priority"
              options={PRIORITY_OPTIONS}
              selected={priority}
              onChange={(val) => onChange({ ...activeFilters, priority: val })}
              renderOption={(opt) => (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[opt.value] ?? ''}`}>
                  {opt.label}
                </span>
              )}
            />
          </div>

          {/* Assignee filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assignee</span>
            <MultiSelectDropdown
              label="Assignee"
              options={ASSIGNEE_OPTIONS}
              selected={assignees}
              onChange={(val) => onChange({ ...activeFilters, assignees: val })}
              renderOption={(opt) => (
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center
                                  text-white text-xs font-bold shrink-0 ${getUserColor(opt.value)}`}>
                    {getUserInitials(opt.value)}
                  </div>
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </div>
              )}
            />
          </div>

          {/* Date filter */}
          <DateFilterPicker
            value={dateFilter}
            onChange={(val) => onChange({ ...activeFilters, dateFilter: val })}
          />

        </div>
      )}

    </div>
  )
}
