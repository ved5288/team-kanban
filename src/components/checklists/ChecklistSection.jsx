import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import ChecklistItem from './ChecklistItem'
import CelebrationToast from './CelebrationToast'
import Confetti from './Confetti'
import { getChecklistProgress } from './checklistHelpers'
import { saveAsTemplate } from './TemplateManager'
import { pickRandom, SINGLE_ITEM_MESSAGES, CHECKLIST_COMPLETE_MESSAGES } from './celebrationData'

/**
 * Returns a Tailwind colour class based on progress percentage.
 * Red (0-30%) -> Amber (31-70%) -> Green (71-100%)
 */
function getProgressColor(percent) {
  if (percent === 100) return 'bg-green-500'
  if (percent >= 71)   return 'bg-green-400'
  if (percent >= 31)   return 'bg-amber-400'
  return 'bg-red-400'
}

/**
 * Renders a single checklist: title, progress bar, items list, add-item input.
 *
 * Props:
 *  checklist       - { id, title, items[] }
 *  soundEnabled    - boolean — whether to play the tada sound on 100%
 *  onRename        - (checklistId, newTitle) => void
 *  onDelete        - (checklistId) => void
 *  onAddItem       - (checklistId, text) => void
 *  onToggleItem    - (checklistId, itemId) => void
 *  onEditItem      - (checklistId, itemId, newText) => void
 *  onDeleteItem    - (checklistId, itemId) => void
 *  onReorderItem   - (checklistId, fromIndex, toIndex) => void
 */
export default function ChecklistSection({
  checklist,
  soundEnabled,
  onRename,
  onDelete,
  onAddItem,
  onToggleItem,
  onEditItem,
  onDeleteItem,
  onReorderItem,
}) {
  // ── Collapse/expand ─────────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false)

  // ── Title editing ────────────────────────────────────────────────────────────
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(checklist.title)
  const titleRef = useRef(null)

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus()
      titleRef.current.select()
    }
  }, [isEditingTitle])

  const saveTitle = () => {
    const trimmed = titleDraft.trim()
    onRename(checklist.id, trimmed || 'Checklist')
    setTitleDraft(trimmed || 'Checklist')
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveTitle() }
    if (e.key === 'Escape') { setTitleDraft(checklist.title); setIsEditingTitle(false) }
  }

  // ── Add item input ───────────────────────────────────────────────────────────
  const [newItemText, setNewItemText] = useState('')
  const addInputRef = useRef(null)

  const handleAddItem = () => {
    const trimmed = newItemText.trim()
    if (!trimmed) return
    onAddItem(checklist.id, trimmed)
    setNewItemText('')
    requestAnimationFrame(() => addInputRef.current?.focus())
  }

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddItem() }
    if (e.key === 'Escape') { setNewItemText(''); addInputRef.current?.blur() }
  }

  // ── Celebrations ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  // Fix #2: Guard against rapid re-triggers — track if confetti is active
  const confettiActiveRef = useRef(false)

  const handleToggle = useCallback((itemId) => {
    const item = checklist.items.find((i) => i.id === itemId)
    const isChecking = item && !item.completed

    onToggleItem(checklist.id, itemId)

    if (!isChecking) return

    const completedAfter = checklist.items.filter((i) =>
      i.id === itemId ? true : i.completed
    ).length
    const totalItems = checklist.items.length
    const willComplete = completedAfter === totalItems

    if (willComplete) {
      setToast({ message: pickRandom(CHECKLIST_COMPLETE_MESSAGES), type: 'bold' })
      // Only trigger confetti if one isn't already running
      if (!confettiActiveRef.current) {
        confettiActiveRef.current = true
        setShowConfetti(true)
      }
      if (soundEnabled) {
        try {
          const audio = new Audio('/sounds/tada.wav')
          audio.volume = 0.5
          audio.play().catch(() => {})
        } catch {
          // no-op
        }
      }
    } else {
      setToast({ message: pickRandom(SINGLE_ITEM_MESSAGES), type: 'subtle' })
    }
  }, [checklist, onToggleItem, soundEnabled])

  const handleConfettiDone = useCallback(() => {
    confettiActiveRef.current = false
    setShowConfetti(false)
  }, [])

  // ── Save as template ───────────────────────────────────────────────────────
  const [templateSaved, setTemplateSaved] = useState(false)
  // Fix #8: Track timeout so we can clean up on unmount
  const templateTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (templateTimerRef.current) clearTimeout(templateTimerRef.current)
    }
  }, [])

  const handleSaveAsTemplate = () => {
    if (checklist.items.length === 0) return
    saveAsTemplate(checklist)
    setTemplateSaved(true)
    if (templateTimerRef.current) clearTimeout(templateTimerRef.current)
    templateTimerRef.current = setTimeout(() => {
      setTemplateSaved(false)
      templateTimerRef.current = null
    }, 2000)
  }

  // ── Delete confirmation ──────────────────────────────────────────────────────
  const handleDelete = () => {
    if (checklist.items.length > 0) {
      const confirmed = window.confirm(
        `Delete "${checklist.title}" and its ${checklist.items.length} item(s)?`
      )
      if (!confirmed) return
    }
    onDelete(checklist.id)
  }

  // ── Drag-to-reorder items ────────────────────────────────────────────────────
  const [dragItemIndex, setDragItemIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleItemDragStart = (e, index) => {
    // Fix #5: Set both checklist-item and text/plain data types.
    // text/plain is set to a non-card-id value so Column's drop handler
    // safely ignores it (it checks cards[cardId] which won't match).
    e.dataTransfer.setData('checklist-item', checklist.items[index].id)
    e.dataTransfer.setData('text/plain', `checklist-item:${checklist.items[index].id}`)
    e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation()
    setDragItemIndex(index)
  }

  const handleItemDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) setDragOverIndex(index)
  }

  const handleItemDrop = (e, toIndex) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragItemIndex !== null && dragItemIndex !== toIndex) {
      onReorderItem(checklist.id, dragItemIndex, toIndex)
    }
    setDragItemIndex(null)
    setDragOverIndex(null)
  }

  const handleItemDragEnd = () => {
    setDragItemIndex(null)
    setDragOverIndex(null)
  }

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  // Fix #4: Size itemRefs to match current item count, trimming stale entries
  const itemRefs = useRef([])
  itemRefs.current = itemRefs.current.slice(0, checklist.items.length)

  // Fix #9: Clamp focusedIndex when items are deleted
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const clampedFocusIndex = focusedIndex >= checklist.items.length
    ? checklist.items.length - 1
    : focusedIndex

  const handleItemKeyNav = useCallback((e, index) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        if (index > 0) {
          setFocusedIndex(index - 1)
          itemRefs.current[index - 1]?.focus()
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (index < checklist.items.length - 1) {
          setFocusedIndex(index + 1)
          itemRefs.current[index + 1]?.focus()
        }
        break
      case ' ':
        e.preventDefault()
        handleToggle(checklist.items[index].id)
        break
      default:
        break
    }
  }, [checklist.items, handleToggle])

  // ── Progress ─────────────────────────────────────────────────────────────────
  const progress = getChecklistProgress(checklist)
  // Fix #6: Removed unused `isComplete` variable

  return (
    <div className="relative space-y-2 bg-gray-50/50 rounded-lg p-3 border border-gray-100">
      {/* Confetti overlay — guarded against stacking */}
      {showConfetti && <Confetti onDone={handleConfettiDone} />}

      {/* Toast — bold renders centred on screen, subtle stays inline */}
      {toast && toast.type === 'bold' && createPortal(
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10000 }}>
          <CelebrationToast
            message={toast.message}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        </div>,
        document.body
      )}
      {toast && toast.type === 'subtle' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-50">
          <CelebrationToast
            message={toast.message}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        </div>
      )}

      {/* Title row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Collapse chevron */}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${collapsed ? '-rotate-90' : 'rotate-0'}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isEditingTitle ? (
            <input
              ref={titleRef}
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleTitleKeyDown}
              className="flex-1 text-sm font-semibold px-2 py-1 border border-gray-300 rounded
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          ) : (
            <h4
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-gray-700 cursor-text truncate"
            >
              {checklist.title}
            </h4>
          )}

          {/* Item count when collapsed */}
          {collapsed && progress && (
            <span className="text-xs text-gray-400 shrink-0">
              {progress.completed}/{progress.total}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Save as template button */}
          {checklist.items.length > 0 && (
            <button
              onClick={handleSaveAsTemplate}
              className={`transition-colors ${
                templateSaved
                  ? 'text-green-500'
                  : 'text-gray-400 hover:text-indigo-500'
              }`}
              title={templateSaved ? 'Saved!' : 'Save as template'}
            >
              {templateSaved ? (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              )}
            </button>
          )}

          <button
            onClick={handleDelete}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            title="Delete checklist"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Progress bar — colour-coded: red -> amber -> green */}
      {progress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{progress.completed}/{progress.total}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getProgressColor(progress.percent)}`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Collapsible content */}
      {!collapsed && (
        <>
          {/* Items list with drag-to-reorder and keyboard nav */}
          <div>
            {checklist.items.map((item, index) => (
              <div
                key={item.id}
                ref={(el) => { itemRefs.current[index] = el }}
                tabIndex={0}
                draggable
                onDragStart={(e) => handleItemDragStart(e, index)}
                onDragOver={(e) => handleItemDragOver(e, index)}
                onDrop={(e) => handleItemDrop(e, index)}
                onDragEnd={handleItemDragEnd}
                onKeyDown={(e) => handleItemKeyNav(e, index)}
                onFocus={() => setFocusedIndex(index)}
                className={`outline-none ${
                  dragOverIndex === index && dragItemIndex !== index
                    ? 'border-t-2 border-indigo-400'
                    : 'border-t-2 border-transparent'
                } ${
                  dragItemIndex === index ? 'opacity-40' : ''
                } ${
                  clampedFocusIndex === index ? 'ring-1 ring-indigo-300 rounded' : ''
                }`}
              >
                <ChecklistItem
                  item={item}
                  onToggle={handleToggle}
                  onEdit={(itemId, text) => onEditItem(checklist.id, itemId, text)}
                  onDelete={(itemId) => onDeleteItem(checklist.id, itemId)}
                />
              </div>
            ))}
          </div>

          {/* Add item input */}
          <div className="flex items-center gap-2">
            <input
              ref={addInputRef}
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Add an item... (Enter to add)"
              className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         placeholder:text-gray-400"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1"
            >
              Add
            </button>
          </div>
        </>
      )}
    </div>
  )
}
