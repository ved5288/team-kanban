import { useState, useRef, useEffect } from 'react'
import { SYMBOL_GALLERY } from '../data/labelsData'

/**
 * Labels popup panel.
 *
 * Render this inside a `position: relative` container.
 * The panel positions itself as `absolute top-full left-0`.
 *
 * Props:
 *  labels        - Label[]           full board-level label list
 *  cardLabelIds  - string[]          label IDs currently on this card
 *  onToggleLabel - (labelId) => void toggle a label on/off for the card
 *  onAddLabel    - (name, symbol) => void  create a new board-level label
 *  onClose       - () => void
 */
export default function LabelsModal({ labels, cardLabelIds, onToggleLabel, onAddLabel, onClose }) {
  const [search, setSearch]       = useState('')
  const [isCreating, setCreating] = useState(false)
  const [newName, setNewName]     = useState('')
  const [newSymbol, setNewSymbol] = useState(SYMBOL_GALLERY[0])
  const panelRef                  = useRef(null)

  // Close when clicking outside this panel
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const filteredLabels = labels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = () => {
    if (!newName.trim()) return
    onAddLabel(newName.trim(), newSymbol)
    setNewName('')
    setNewSymbol(SYMBOL_GALLERY[0])
    setCreating(false)
  }

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl
                 border border-gray-200 overflow-hidden z-50"
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Search ── */}
      <div className="p-2 border-b border-gray-100">
        <input
          autoFocus
          type="text"
          placeholder="Search labels…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* ── Label list ── */}
      <div className="max-h-52 overflow-y-auto py-1">
        {filteredLabels.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No labels found</p>
        ) : (
          filteredLabels.map((label) => {
            const checked = cardLabelIds.includes(label.id)
            return (
              <button
                key={label.id}
                onClick={() => onToggleLabel(label.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left
                            hover:bg-indigo-50 transition-colors
                            ${checked ? 'bg-indigo-50/60' : ''}`}
              >
                {/* Checkbox */}
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                                  ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"
                         stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                <span className="text-base leading-none">{label.symbol}</span>
                <span className="text-sm text-gray-700">{label.name}</span>
              </button>
            )
          })
        )}
      </div>

      {/* ── Create new label ── */}
      <div className="border-t border-gray-100">
        {!isCreating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-600
                       hover:bg-indigo-50 transition-colors font-medium"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create new label
          </button>
        ) : (
          <div className="p-3 space-y-2.5">

            {/* Label name */}
            <input
              autoFocus
              type="text"
              placeholder="Label name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            {/* Symbol gallery */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Symbol
              </p>
              <div className="grid grid-cols-5 gap-1">
                {SYMBOL_GALLERY.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setNewSymbol(sym)}
                    className={`text-lg py-1 rounded-lg hover:bg-gray-100 transition-colors
                                ${newSymbol === sym ? 'bg-indigo-100 ring-2 ring-indigo-400' : ''}`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setCreating(false); setNewName(''); setNewSymbol(SYMBOL_GALLERY[0]) }}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600
                           bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600
                           hover:bg-indigo-700 rounded-lg transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
