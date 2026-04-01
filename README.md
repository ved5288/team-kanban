# Team Kanban — Starter Project

A simple Kanban board built with **React + Vite + Tailwind CSS**.
Data lives entirely in `localStorage` — no server required.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) (recommended)

### Run locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open your browser at http://localhost:5173
```

### Demo accounts

| Username | Password  |
|----------|-----------|
| alice    | pass123   |
| bob      | pass123   |
| carol    | pass123   |
| dave     | pass123   |
| admin    | admin123  |

---

## Project Structure

```
src/
├── App.jsx                  ← Router + Auth context
├── main.jsx                 ← React entry point
├── index.css                ← Tailwind imports
│
├── data/
│   ├── users.js             ← Hardcoded user accounts
│   └── mockData.js          ← Initial board data (loaded on first visit)
│
├── hooks/
│   └── useLocalStorage.js   ← Custom hook: state that persists in localStorage
│
└── components/
    ├── Login.jsx            ← Login page
    ├── Header.jsx           ← Top navigation bar
    ├── Board.jsx            ← Main board view (owns all state)
    ├── Column.jsx           ← Single column
    ├── Card.jsx             ← Single card
    └── AddCardModal.jsx     ← Modal for creating new cards
```

## Branch Strategy

| Branch    | Purpose                      |
|-----------|------------------------------|
| `main`    | Production — always stable   |
| `develop` | Staging — integrate features |

All new features should be branched off `develop`:

```bash
git checkout develop
git checkout -b feature/your-feature-name
# ... make changes ...
git push origin feature/your-feature-name
# Then open a Pull Request → develop
```

## How the Board State Works

All board data is stored in a single object in `localStorage` under the key `kanban_board`.

```
board = {
  cards:       { [cardId]: { id, title, description, priority, assignee, columnId, createdAt } }
  columns:     { [columnId]: { id, title, cardIds: [] } }
  columnOrder: ['todo', 'in-progress', 'in-review', 'done']
}
```

The `Board.jsx` component owns this state and passes down callbacks to children:
- `onAddCard(card)`   — adds a card to a column
- `onDeleteCard(id)` — removes a card from the board

> **Tip:** Click "↺ Reset board" in the toolbar to restore the original demo data.
