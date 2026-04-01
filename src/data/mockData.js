/**
 * Initial board data.
 * This is loaded only on first visit. After that, data lives in localStorage.
 *
 * Data structure:
 *  - cards:       flat map of cardId → card object
 *  - columns:     flat map of columnId → { id, title, cardIds[] }
 *  - columnOrder: array of columnIds (controls left-to-right display order)
 */

const now = Date.now()
const DAY = 24 * 60 * 60 * 1000

export const INITIAL_BOARD = {
  cards: {
    'card-1': {
      id: 'card-1',
      title: 'Set up project repository',
      description: 'Initialize the GitHub repo, configure branch protection on main, and document the setup process in the README.',
      priority: 'High',
      assignee: 'vedant',
      columnId: 'done',
      createdAt: new Date(now - 7 * DAY).toISOString(),
    },
    'card-2': {
      id: 'card-2',
      title: 'Configure authentication flow',
      description: 'Implement login and logout with session persistence in localStorage. Redirect unauthenticated users to the login page.',
      priority: 'High',
      assignee: 'shritilekha',
      columnId: 'done',
      createdAt: new Date(now - 5 * DAY).toISOString(),
    },
    'card-3': {
      id: 'card-3',
      title: 'Add dark mode support',
      description: 'Add a dark/light theme toggle in the header. Persist the user\'s preference in localStorage so it survives page reloads.',
      priority: 'Medium',
      assignee: 'malvika',
      columnId: 'in-review',
      createdAt: new Date(now - 4 * DAY).toISOString(),
      checklists: [
        {
          id: 'cl-1',
          title: 'QA Checklist',
          items: [
            { id: 'cli-1', text: 'Test in Chrome', completed: true, createdAt: new Date(now - 3 * DAY).toISOString() },
            { id: 'cli-2', text: 'Test in Firefox', completed: true, createdAt: new Date(now - 3 * DAY).toISOString() },
            { id: 'cli-3', text: 'Test in Safari', completed: false, createdAt: new Date(now - 3 * DAY).toISOString() },
          ],
        },
      ],
    },
    'card-4': {
      id: 'card-4',
      title: 'Audit and fix slow renders',
      description: 'Profile the board with React DevTools. Wrap expensive components in React.memo and move state down where possible.',
      priority: 'High',
      assignee: 'vaidehie',
      columnId: 'in-review',
      createdAt: new Date(now - 3 * DAY).toISOString(),
    },
    'card-5': {
      id: 'card-5',
      title: 'Build global search',
      description: 'Add a search input in the header that filters cards in real-time by title and description across all columns.',
      priority: 'High',
      assignee: 'yash',
      columnId: 'in-progress',
      createdAt: new Date(now - 2 * DAY).toISOString(),
      checklists: [
        {
          id: 'cl-2',
          title: 'Implementation Steps',
          items: [
            { id: 'cli-4', text: 'Add search input to header', completed: true, createdAt: new Date(now - 2 * DAY).toISOString() },
            { id: 'cli-5', text: 'Wire up filter logic across columns', completed: false, createdAt: new Date(now - 2 * DAY).toISOString() },
            { id: 'cli-6', text: 'Highlight matching text', completed: false, createdAt: new Date(now - 2 * DAY).toISOString() },
            { id: 'cli-7', text: 'Handle empty results state', completed: false, createdAt: new Date(now - 2 * DAY).toISOString() },
          ],
        },
      ],
    },
    'card-6': {
      id: 'card-6',
      title: 'Fix mobile layout issues',
      description: 'Columns overflow horizontally on small screens. Columns should stack vertically on mobile and scroll horizontally on tablet+.',
      priority: 'Medium',
      assignee: 'riya',
      columnId: 'in-progress',
      createdAt: new Date(now - 1 * DAY).toISOString(),
    },
    'card-7': {
      id: 'card-7',
      title: 'Design user profile page',
      description: 'Create a /profile route showing the logged-in user\'s name, initials avatar, and a list of cards assigned to them.',
      priority: 'Medium',
      assignee: 'jitesh',
      columnId: 'todo',
      createdAt: new Date(now - 0.5 * DAY).toISOString(),
    },
    'card-8': {
      id: 'card-8',
      title: 'Add card due dates',
      description: 'Allow users to set a due date on a card. Display the date on the card and highlight it red when overdue.',
      priority: 'Medium',
      assignee: 'nithish',
      columnId: 'todo',
      createdAt: new Date(now - 0.4 * DAY).toISOString(),
    },
    'card-9': {
      id: 'card-9',
      title: 'Write component documentation',
      description: 'Add JSDoc comments to all components explaining props, state, and key behaviours. Keep it concise and accurate.',
      priority: 'Low',
      assignee: 'bhavya',
      columnId: 'todo',
      createdAt: new Date(now - 0.3 * DAY).toISOString(),
    },
    'card-10': {
      id: 'card-10',
      title: 'Set up CI/CD with GitHub Actions',
      description: 'Create a workflow that runs on every PR to the develop branch: install deps, lint, build. Block merging on failure.',
      priority: 'High',
      assignee: 'rahul',
      columnId: 'todo',
      createdAt: new Date(now - 0.2 * DAY).toISOString(),
    },
  },

  columns: {
    'todo':        { id: 'todo',        title: 'To Do',       cardIds: ['card-7', 'card-8', 'card-9', 'card-10'] },
    'in-progress': { id: 'in-progress', title: 'In Progress', cardIds: ['card-5', 'card-6'] },
    'in-review':   { id: 'in-review',   title: 'In Review',   cardIds: ['card-3', 'card-4'] },
    'done':        { id: 'done',        title: 'Done',        cardIds: ['card-1', 'card-2'] },
  },

  columnOrder: ['todo', 'in-progress', 'in-review', 'done'],
}
