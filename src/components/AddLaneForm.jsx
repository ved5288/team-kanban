import { useState, useRef, useEffect } from 'react'

// onAddLane(name) must return true on success or false to keep the form open
// (e.g. when the name is a duplicate). See useBoard.addLane.
export default function AddLaneForm({ onAddLane }) {
  const [isAddingLane, setIsAddingLane] = useState(false)
  const [newLaneName, setNewLaneName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isAddingLane && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAddingLane])

  const handleAdd = () => {
    const name = newLaneName.trim()
    if (!name) return
    const success = onAddLane(name)
    if (success) {
      setNewLaneName('')
      setIsAddingLane(false)
    }
  }

  const handleCancel = () => {
    setIsAddingLane(false)
    setNewLaneName('')
  }

  if (!isAddingLane) {
    return (
      <button
        onClick={() => setIsAddingLane(true)}
        className="w-full py-3 text-sm font-medium text-gray-500 hover:text-indigo-700
                   bg-gray-100 hover:bg-white border-2 border-dashed border-gray-300
                   hover:border-indigo-300 rounded-xl transition-all"
      >
        + Add lane
      </button>
    )
  }

  return (
    <div className="bg-gray-100 rounded-xl border border-gray-200 p-3">
      <input
        ref={inputRef}
        type="text"
        value={newLaneName}
        onChange={(e) => setNewLaneName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd()
          if (e.key === 'Escape') handleCancel()
        }}
        placeholder="Enter lane name..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleAdd}
          className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600
                     hover:bg-indigo-700 rounded-lg transition-colors"
        >
          Add Lane
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700
                     bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
