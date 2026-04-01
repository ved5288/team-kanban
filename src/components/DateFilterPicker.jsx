import { useState } from 'react'

/**
 * Inline date filter with 5 selectable modes.
 *
 * Props:
 *  value    - null | DateFilter object
 *  onChange - (newValue: null | DateFilter) => void
 *
 * DateFilter shapes:
 *  { mode: 'relative', value: number, unit: 'days'|'weeks'|'months' }
 *  { mode: 'between',  from: string, to: string }   // 'YYYY-MM-DD' or ''
 *  { mode: 'before',   date: string }
 *  { mode: 'after',    date: string }
 *  { mode: 'on',       date: string }
 */

const MODES = [
  { id: 'relative', label: 'Relative' },
  { id: 'between',  label: 'Between'  },
  { id: 'before',   label: 'Before'   },
  { id: 'after',    label: 'After'    },
  { id: 'on',       label: 'On'       },
]

const INPUT_CLS = `px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white
                   focus:outline-none focus:ring-2 focus:ring-indigo-400`

export default function DateFilterPicker({ value, onChange }) {
  // Track locally so the tab strip stays on the last-used mode after "Clear"
  const [localMode, setLocalMode] = useState('relative')

  const activeMode = value?.mode ?? localMode

  // Emit a sensible default when switching modes (empty strings = open constraint)
  const handleModeChange = (newMode) => {
    setLocalMode(newMode)
    if (newMode === 'relative') onChange({ mode: 'relative', value: 7, unit: 'days' })
    else if (newMode === 'between') onChange({ mode: 'between', from: '', to: '' })
    else onChange({ mode: newMode, date: '' })
  }

  // ── Relative helpers ────────────────────────────────────────────────────────
  const relValue = value?.value ?? 7
  const relUnit  = value?.unit  ?? 'days'

  const emitRelative = (v, u) => {
    const num = parseInt(v, 10)
    onChange({ mode: 'relative', value: isNaN(num) ? '' : num, unit: u })
  }

  // ── Single-date helpers (before / after / on) ────────────────────────────
  const singleDate = value?.date ?? ''
  const emitSingle = (d) => onChange({ mode: activeMode, date: d })

  // ── Between helpers ──────────────────────────────────────────────────────
  const fromDate = value?.from ?? ''
  const toDate   = value?.to   ?? ''
  const emitBetween = (from, to) => onChange({ mode: 'between', from, to })

  return (
    <div className="flex flex-col gap-2">

      {/* Section label */}
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Created Date
      </span>

      {/* Mode tab strip */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium
              ${activeMode === m.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode-specific inputs */}
      {activeMode === 'relative' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Last</span>
          <input
            type="number"
            min="1"
            max="365"
            value={relValue}
            onChange={(e) => emitRelative(e.target.value, relUnit)}
            className={`w-16 ${INPUT_CLS}`}
          />
          <select
            value={relUnit}
            onChange={(e) => emitRelative(relValue, e.target.value)}
            className={INPUT_CLS}
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
        </div>
      )}

      {activeMode === 'between' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => emitBetween(e.target.value, toDate)}
            className={INPUT_CLS}
          />
          <span className="text-sm text-gray-400">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => emitBetween(fromDate, e.target.value)}
            className={INPUT_CLS}
          />
        </div>
      )}

      {(activeMode === 'before' || activeMode === 'after' || activeMode === 'on') && (
        <input
          type="date"
          value={singleDate}
          onChange={(e) => emitSingle(e.target.value)}
          className={`w-auto ${INPUT_CLS}`}
        />
      )}

      {/* Clear date filter */}
      {value !== null && (
        <button
          onClick={() => onChange(null)}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors self-start"
        >
          Clear date filter
        </button>
      )}

    </div>
  )
}
