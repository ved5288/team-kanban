import { INITIAL_BOARD } from './mockData'

/**
 * The workspace is the top-level data structure that holds all boards.
 *
 * Shape:
 *   {
 *     activeBoardId: string,
 *     boards: {
 *       [boardId]: {
 *         id: string,
 *         name: string,
 *         createdAt: ISO string,
 *         cards: { [cardId]: card },
 *         columns: { [columnId]: column },
 *         columnOrder: [columnId],
 *       }
 *     }
 *   }
 *
 * Cards can also carry:
 *   externalLinks?: [{ cardId: string, boardId: string }]
 * for cross-board associations.
 *
 * On first load, any existing kanban_board data is migrated into the workspace
 * so users don't lose their previous work.
 */

const DEFAULT_BOARD_ID = 'board-default'

function buildInitialWorkspace() {
  // Migrate existing single-board data if present
  try {
    const raw = localStorage.getItem('kanban_board')
    if (raw) {
      const existingBoard = JSON.parse(raw)
      if (existingBoard?.cards && existingBoard?.columns) {
        return {
          activeBoardId: DEFAULT_BOARD_ID,
          boards: {
            [DEFAULT_BOARD_ID]: {
              id: DEFAULT_BOARD_ID,
              name: 'My Kanban',
              createdAt: new Date().toISOString(),
              ...existingBoard,
            },
          },
        }
      }
    }
  } catch {
    // Fall through to default
  }

  return {
    activeBoardId: DEFAULT_BOARD_ID,
    boards: {
      [DEFAULT_BOARD_ID]: {
        id: DEFAULT_BOARD_ID,
        name: 'My Kanban',
        createdAt: new Date().toISOString(),
        ...INITIAL_BOARD,
      },
    },
  }
}

export const INITIAL_WORKSPACE = buildInitialWorkspace()

/** Default column structure for a freshly created board */
export const DEFAULT_COLUMNS = {
  columns: {
    todo:          { id: 'todo',        title: 'To Do',       cardIds: [] },
    'in-progress': { id: 'in-progress', title: 'In Progress', cardIds: [] },
    'in-review':   { id: 'in-review',   title: 'In Review',   cardIds: [] },
    done:          { id: 'done',        title: 'Done',        cardIds: [] },
  },
  columnOrder: ['todo', 'in-progress', 'in-review', 'done'],
}
