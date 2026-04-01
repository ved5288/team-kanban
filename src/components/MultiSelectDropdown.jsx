import { useState, useRef, useEffect } from 'react'

/**
 * Reusable searchable multi-select dropdown.
 *
 * Props:
 *  label        - string  Button label (e.g. "Priority", "Assignee")
 *  options      - Array<{ value: string, label: string }>
 *  selected     - string[]  Currently selected values
 *  onChange     - (newSelected: string[]) => void
 *  renderOption - (opt: { value, label }) => ReactNode  Optional custom option renderer
 */
export default function MultiSelectDropdown({ label, options, selected, onChange, renderOption }) {
  const [isOpen, setIsOpen]       = useState(false)
  const [searchQuery, setQuery]   = useState('')
  const dropdownRef               = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(next)
  }

  const isActive = selected.length > 0

  return (
    <div ref={dropdownRef} className="relative">

      {/* Trigger button */}
      <button
        onClick={() => { setIsOpen((v) => !v); setQuery('') }}
        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors
          ${isActive
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : 'border-gray-300 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
          }`}
      >
        <span>{label}</span>
        {isActive && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full
                           bg-indigo-600 text-white text-xs font-bold leading-none">
            {selected.length}
          </span>
        )}
        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-gray-200
                        rounded-xl shadow-lg z-20 overflow-hidden">

          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No results</p>
            ) : (
              filteredOptions.map((opt) => {
                const checked = selected.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left
                                hover:bg-indigo-50 transition-colors
                                ${checked ? 'bg-indigo-50/60' : ''}`}
                  >
                    {/* Custom checkbox */}
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                                  ${checked
                                    ? 'bg-indigo-600 border-indigo-600'
                                    : 'border-gray-300 bg-white'}`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"
                             stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </span>

                    {/* Option content */}
                    {renderOption ? renderOption(opt) : (
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    )}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer: clear selection */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100">
              <button
                onClick={() => onChange([])}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
