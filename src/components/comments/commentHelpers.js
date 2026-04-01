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

// Applies an updater function to a single card without mutating the board.
// Named distinctly from the full handleUpdateCard operation in useBoard.
export function patchCard(board, cardId, updater) {
  return {
    ...board,
    cards: {
      ...board.cards,
      [cardId]: updater(board.cards[cardId]),
    },
  }
}
