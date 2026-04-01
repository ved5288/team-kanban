import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export function useActivity() {
  const [activities, setActivities] = useLocalStorage('kanban_activity', [])

  const logMove = useCallback(({ cardTitle, cardId, fromColumn, toColumn, userId }) => {
    setActivities((prev) => [
      {
        id: crypto.randomUUID(),
        type: 'move',
        cardTitle,
        cardId,
        fromColumn,
        toColumn,
        userId,
        timestamp: new Date().toISOString(),
        reactions: {},
      },
      ...prev,
    ].slice(0, 100))
  }, [setActivities])

  const toggleReaction = useCallback((activityId, emoji, userId) => {
    setActivities((prev) =>
      prev.map((a) => {
        if (a.id !== activityId) return a
        const users = a.reactions[emoji] ?? []
        const already = users.includes(userId)
        return {
          ...a,
          reactions: {
            ...a.reactions,
            [emoji]: already
              ? users.filter((u) => u !== userId)
              : [...users, userId],
          },
        }
      })
    )
  }, [setActivities])

  return { activities, logMove, toggleReaction }
}
