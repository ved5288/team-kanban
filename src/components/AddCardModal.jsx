import { useState } from 'react'
import { USERS } from '../data/users'
import { useAuth } from '../App'

const PRIORITIES = ['High', 'Medium', 'Low']

const COLUMNS = [
  { id: 'todo',        label: 'To Do'       },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'in-review',   label: 'In Review'   },
  { id: 'done',        label: 'Done'        },
]

/**
 * Modal dialog for creating a new card.
 *
 * Props:
 *  defaultColumnId - the column that the "Add card" button was clicked in
 *  onSave          - (newCard) => void   called with the new card data
 *  onClose         - () => void          called when the modal is dismissed
 */
export default function AddCardModal({ defaultColumnId, onSave, onClose }) {
  const { user } = useAuth()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [priority,    setPriority]    = useState('Medium')
  const [assignee,    setAssignee]    = useState(user?.id ?? 'alice')
  const [columnId,    setColumnId]    = useState(defaultColumnId ?? 'todo')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    onSave({
      id:          crypto.randomUUID(),
      title:       title.trim(),
      description: description.trim(),
      priority,
      assignee,
      columnId,
      createdAt:   new Date().toISOString(),
    })
  }

  // Close when clicking the backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Add New Card</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Add more detail..."
              rows={3}
            />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {Object.values(USERS).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add to column</label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>{col.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                         hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600
                         hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Add Card
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
