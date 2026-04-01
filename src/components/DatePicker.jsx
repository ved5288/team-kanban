import { useState, useRef, useEffect, useLayoutEffect } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ─── DatePicker ───────────────────────────────────────────────────────────────

/**
 * A forward-looking calendar date-picker dropdown.
 *
 * Props:
 *  value       - selected date as 'YYYY-MM-DD' string, or null
 *  onChange    - (value: string | null) => void
 *  placeholder - text shown when no date is selected
 */
export default function DatePicker({ value, onChange, placeholder = 'Set due date' }) {
  // ── Today (midnight, local) ─────────────────────────────────────────────────
  const getToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }

  const today = getToday()

  // ── State ───────────────────────────────────────────────────────────────────
  const [open, setOpen]           = useState(false)
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [dropStyle, setDropStyle] = useState({})   // computed position overrides
  const containerRef              = useRef(null)
  const dropdownRef               = useRef(null)

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Auto-position dropdown (runs before paint to avoid flash) ───────────────
  useLayoutEffect(() => {
    if (!open || !dropdownRef.current || !containerRef.current) {
      setDropStyle({})
      return
    }

    const trigger  = containerRef.current.getBoundingClientRect()
    const drop     = dropdownRef.current.getBoundingClientRect()
    const vw       = window.innerWidth
    const vh       = window.innerHeight
    const GAP      = 8  // px gap between trigger and dropdown

    const spaceBelow = vh - trigger.bottom - GAP
    const spaceAbove = trigger.top - GAP
    const spaceRight = vw - trigger.left

    // Flip above if not enough room below but more room above
    const openAbove = spaceBelow < drop.height && spaceAbove > spaceBelow

    // Anchor to right edge of trigger if dropdown would overflow right
    const overflowsRight = trigger.left + drop.width > vw
    const overflowsLeft  = trigger.right - drop.width < 0

    const style = {}

    if (openAbove) {
      style.bottom    = '100%'
      style.top       = 'auto'
      style.marginTop = 0
      style.marginBottom = `${GAP}px`
    } else {
      style.top        = '100%'
      style.bottom     = 'auto'
      style.marginTop  = `${GAP}px`
      style.marginBottom = 0
    }

    if (overflowsRight && !overflowsLeft) {
      style.right = 0
      style.left  = 'auto'
    } else {
      style.left  = 0
      style.right = 'auto'
    }

    setDropStyle(style)
  }, [open])

  // ── Navigation guards ───────────────────────────────────────────────────────
  const atEarliestYear  = viewYear  <= today.getFullYear()
  const atEarliestMonth = atEarliestYear && viewMonth <= today.getMonth()

  const prevYear = () => {
    if (atEarliestYear) return
    const newYear = viewYear - 1
    // If landing in the current year, clamp month to today's month
    if (newYear === today.getFullYear() && viewMonth < today.getMonth()) {
      setViewMonth(today.getMonth())
    }
    setViewYear(newYear)
  }

  const nextYear = () => setViewYear((y) => y + 1)

  const prevMonth = () => {
    if (atEarliestMonth) return
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // ── Calendar grid ───────────────────────────────────────────────────────────
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sun
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()

  // Build array: leading nulls (empty cells) then day numbers
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // ── Day helpers ─────────────────────────────────────────────────────────────
  const dayDate     = (d) => new Date(viewYear, viewMonth, d)
  const isDisabled  = (d) => dayDate(d) < today
  const isToday     = (d) => today.getFullYear() === viewYear &&
                              today.getMonth()   === viewMonth &&
                              today.getDate()    === d
  const isSelected  = (d) => {
    if (!value) return false
    const sel = new Date(value + 'T00:00:00')
    return sel.getFullYear() === viewYear &&
           sel.getMonth()    === viewMonth &&
           sel.getDate()     === d
  }

  const selectDay = (d) => {
    if (isDisabled(d)) return
    onChange(dayDate(d).toISOString().split('T')[0]) // → 'YYYY-MM-DD'
    setOpen(false)
  }

  // ── Display label ───────────────────────────────────────────────────────────
  const displayLabel = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  // ── Nav button classes ──────────────────────────────────────────────────────
  const navBtn = (enabled) =>
    `w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-colors
     ${enabled
       ? 'hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 cursor-pointer'
       : 'text-gray-200 cursor-not-allowed'}`

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={containerRef}>

      {/* ── Trigger button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-left
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors
                    ${displayLabel
                      ? 'border-gray-300 text-gray-800'
                      : 'border-gray-300 text-gray-400'}`}
      >
        <span className="text-gray-400 text-base leading-none select-none">📅</span>
        <span className="flex-1">{displayLabel ?? placeholder}</span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(null) }}
            className="text-gray-300 hover:text-gray-500 transition-colors leading-none cursor-pointer"
          >
            ✕
          </span>
        )}
      </button>

      {/* ── Dropdown calendar ──────────────────────────────────────────────── */}
      {open && (
        <div
          ref={dropdownRef}
          style={dropStyle}
          className="absolute bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 w-64 select-none"
        >

          {/* Year toggle */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevYear} className={navBtn(!atEarliestYear)}>‹</button>
            <span className="text-sm font-bold text-gray-800 w-12 text-center">{viewYear}</span>
            <button type="button" onClick={nextYear} className={navBtn(true)}>›</button>
          </div>

          {/* Month toggle */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className={navBtn(!atEarliestMonth)}>‹</button>
            <span className="text-sm font-semibold text-indigo-600 w-28 text-center">
              {MONTHS[viewMonth]}
            </span>
            <button type="button" onClick={nextMonth} className={navBtn(true)}>›</button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((h) => (
              <div key={h} className="text-center text-xs text-gray-400 font-medium py-0.5">
                {h}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`e${idx}`} />

              const disabled  = isDisabled(day)
              const selected  = isSelected(day)
              const todayMark = isToday(day)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDay(day)}
                  disabled={disabled}
                  className={[
                    'mx-auto w-8 h-8 flex items-center justify-center rounded-full text-xs transition-colors',
                    selected
                      ? 'bg-indigo-600 text-white font-bold'
                      : disabled
                        ? 'text-gray-200 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer',
                    todayMark && !selected
                      ? 'ring-2 ring-indigo-400 font-semibold'
                      : '',
                  ].join(' ')}
                >
                  {day}
                </button>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}
