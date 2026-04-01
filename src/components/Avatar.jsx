import { getUserColor, getUserInitials } from '../data/users'

/**
 * Consistent user avatar circle.
 * size: 'sm' = w-7/h-7, 'md' = w-9/h-9
 */
export default function Avatar({ userId, size = 'sm' }) {
  const cls = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'
  return (
    <div
      className={`${cls} ${getUserColor(userId)} rounded-full flex items-center
                  justify-center text-white font-bold shrink-0`}
    >
      {getUserInitials(userId)}
    </div>
  )
}
