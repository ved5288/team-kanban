export const EMOJI_LIST = ['👍', '👎', '❤️', '😂', '😮', '🎉', '🚀', '👀']

// Splices @username into text at the given cursor position, replacing any
// partial @mention that was already being typed.
export function spliceUsername(text, cursor, username) {
  return (
    text.slice(0, cursor).replace(/@\w*$/, '') +
    '@' + username + ' ' +
    text.slice(cursor)
  )
}

// Extracts the in-progress @mention query from text up to the cursor.
// Returns null when the cursor is not inside a @mention.
export function getMentionQuery(value, cursorPos) {
  const match = value.slice(0, cursorPos).match(/@(\w*)$/)
  return match ? match[1] : null
}

// Shallow board update — avoids repeating the nested spread pattern.
export function updateCard(board, cardId, updater) {
  return {
    ...board,
    cards: {
      ...board.cards,
      [cardId]: updater(board.cards[cardId]),
    },
  }
}
