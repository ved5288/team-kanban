/**
 * Hardcoded user accounts for the demo app.
 * In a real app, this would come from a backend/database.
 *
 * Format: { password, name, id }
 * All demo accounts share password: pass123
 */
export const USERS = {
  admin:       { password: 'admin123', name: 'Vedant (Admin)', id: 'admin'       },
  shritilekha: { password: 'pass123',  name: 'Shritilekha',   id: 'shritilekha' },
  malvika:     { password: 'pass123',  name: 'Malvika',        id: 'malvika'     },
  vaidehie:    { password: 'pass123',  name: 'Vaidehie',       id: 'vaidehie'    },
  yash:        { password: 'pass123',  name: 'Yash',           id: 'yash'        },
  riya:        { password: 'pass123',  name: 'Riya',           id: 'riya'        },
  jitesh:      { password: 'pass123',  name: 'Jitesh',         id: 'jitesh'      },
  nithish:     { password: 'pass123',  name: 'Nithish',        id: 'nithish'     },
  bhavya:      { password: 'pass123',  name: 'Bhavya',         id: 'bhavya'      },
  vedant:      { password: 'pass123',  name: 'Vedant',         id: 'vedant'      },
  rahul:       { password: 'pass123',  name: 'Rahul',          id: 'rahul'       },
}

/**
 * Returns the display name for a given user ID.
 */
export function getUserName(userId) {
  return USERS[userId]?.name ?? userId
}

/**
 * Returns the initials for a given user ID (e.g. "Alice Chen" → "AC")
 */
export function getUserInitials(userId) {
  const name = getUserName(userId)
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Assigns a consistent background color to each user based on their ID.
 * This ensures the same person always gets the same avatar color.
 */
export function getUserColor(userId) {
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ]
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[index % colors.length]
}
