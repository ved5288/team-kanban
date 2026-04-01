import { useState, useCallback } from 'react'
import ChecklistSection from './ChecklistSection'
import { createChecklist, createChecklistItem } from './checklistHelpers'
import { patchCard } from '../comments/commentHelpers'
import TemplatePicker from './TemplateManager'

/**
 * Top-level checklist container for a card.
 * Same interface as CardComments — receives cardId, board, setBoard.
 *
 * Props:
 *  cardId   - the card's ID
 *  board    - full board state
 *  setBoard - board state setter
 */
export default function CardChecklists({ cardId, board, setBoard }) {
  // Sound toggle — off by default, persisted in localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('checklist_sound_enabled')) === true
    } catch {
      return false
    }
  })

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev
      localStorage.setItem('checklist_sound_enabled', JSON.stringify(next))
      return next
    })
  }

  // Template picker dropdown
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  const checklists = board.cards[cardId]?.checklists ?? []

  // ── Helpers to update checklists on this card ────────────────────────────────

  const updateChecklists = useCallback((updater) => {
    setBoard((b) =>
      patchCard(b, cardId, (card) => ({
        ...card,
        checklists: updater(card.checklists ?? []),
      }))
    )
  }, [cardId, setBoard])

  // ── Checklist CRUD ───────────────────────────────────────────────────────────

  const addBlankChecklist = () => {
    updateChecklists((cls) => [...cls, createChecklist('')])
    setShowTemplatePicker(false)
  }

  const addChecklistFromTemplate = (template) => {
    const newChecklist = createChecklist(template.title)
    // Pre-populate with template items (all unchecked)
    newChecklist.items = template.items.map((text) => createChecklistItem(text))
    updateChecklists((cls) => [...cls, newChecklist])
    setShowTemplatePicker(false)
  }

  const renameChecklist = (checklistId, newTitle) => {
    updateChecklists((cls) =>
      cls.map((cl) => cl.id === checklistId ? { ...cl, title: newTitle } : cl)
    )
  }

  const deleteChecklist = (checklistId) => {
    updateChecklists((cls) => cls.filter((cl) => cl.id !== checklistId))
  }

  // ── Item CRUD ────────────────────────────────────────────────────────────────

  const addItem = (checklistId, text) => {
    updateChecklists((cls) =>
      cls.map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: [...cl.items, createChecklistItem(text)] }
          : cl
      )
    )
  }

  const toggleItem = (checklistId, itemId) => {
    updateChecklists((cls) =>
      cls.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : cl
      )
    )
  }

  const editItem = (checklistId, itemId, newText) => {
    updateChecklists((cls) =>
      cls.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((item) =>
                item.id === itemId ? { ...item, text: newText } : item
              ),
            }
          : cl
      )
    )
  }

  const deleteItem = (checklistId, itemId) => {
    updateChecklists((cls) =>
      cls.map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.filter((item) => item.id !== itemId) }
          : cl
      )
    )
  }

  // ── Reorder item within a checklist ────────────────────────────────────────

  const reorderItem = (checklistId, fromIndex, toIndex) => {
    updateChecklists((cls) =>
      cls.map((cl) => {
        if (cl.id !== checklistId) return cl
        const items = [...cl.items]
        const [moved] = items.splice(fromIndex, 1)
        items.splice(toIndex, 0, moved)
        return { ...cl, items }
      })
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Checklists
        </p>
        <div className="flex items-center gap-3">
          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Sound on — click to mute' : 'Sound off — click to enable'}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {soundEnabled ? (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Add checklist button — opens template picker */}
          <div className="relative">
            <button
              onClick={() => setShowTemplatePicker((prev) => !prev)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              + Add checklist
            </button>
            {showTemplatePicker && (
              <TemplatePicker
                onSelectTemplate={addChecklistFromTemplate}
                onCreateBlank={addBlankChecklist}
                onClose={() => setShowTemplatePicker(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Checklist sections */}
      {checklists.length === 0 && (
        <p className="text-sm text-gray-400 italic">No checklists yet.</p>
      )}

      {checklists.map((cl) => (
        <ChecklistSection
          key={cl.id}
          checklist={cl}
          soundEnabled={soundEnabled}
          onRename={renameChecklist}
          onDelete={deleteChecklist}
          onAddItem={addItem}
          onToggleItem={toggleItem}
          onEditItem={editItem}
          onDeleteItem={deleteItem}
          onReorderItem={reorderItem}
        />
      ))}
    </div>
  )
}
