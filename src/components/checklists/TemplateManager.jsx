import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'checklist_templates'

/**
 * Loads saved checklist templates from localStorage.
 * Returns an array of { id, title, items: string[] }
 */
export function loadTemplates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

/** Saves templates array to localStorage. */
function saveTemplates(templates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

/** Save a checklist as a reusable template. */
export function saveAsTemplate(checklist) {
  const templates = loadTemplates()
  const template = {
    id: crypto.randomUUID(),
    title: checklist.title,
    items: checklist.items.map((item) => item.text),
  }
  templates.push(template)
  saveTemplates(templates)
  return template
}

/** Delete a template by ID. */
export function deleteTemplate(templateId) {
  const templates = loadTemplates().filter((t) => t.id !== templateId)
  saveTemplates(templates)
}

/**
 * Dropdown for picking a template or creating a blank checklist.
 *
 * Props:
 *  onSelectTemplate  - (template) => void — template has { title, items: string[] }
 *  onCreateBlank     - () => void
 *  onClose           - () => void
 */
export default function TemplatePicker({ onSelectTemplate, onCreateBlank, onClose }) {
  const [templates, setTemplates] = useState(loadTemplates)
  const ref = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleDeleteTemplate = (e, templateId) => {
    e.stopPropagation()
    deleteTemplate(templateId)
    setTemplates(loadTemplates())
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
    >
      <div className="p-2 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1">
          New checklist
        </p>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {/* Blank option */}
        <button
          onClick={onCreateBlank}
          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Blank checklist
        </button>

        {/* Templates */}
        {templates.length > 0 && (
          <>
            <div className="px-4 py-1.5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Templates
              </p>
            </div>
            {templates.map((t) => (
              <div
                key={t.id}
                className="group flex items-center justify-between px-4 py-2 hover:bg-indigo-50 cursor-pointer transition-colors"
                onClick={() => onSelectTemplate(t)}
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 group-hover:text-indigo-700 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.items.length} item{t.items.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={(e) => handleDeleteTemplate(e, t.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 shrink-0"
                  title="Delete template"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {templates.length === 0 && (
        <p className="px-4 py-2 text-xs text-gray-400 italic border-t border-gray-100">
          No saved templates yet. Save a checklist as template using the bookmark icon.
        </p>
      )}
    </div>
  )
}
