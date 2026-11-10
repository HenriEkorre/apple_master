import { Link } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

function getInitial(user) {
  return (user?.username || user?.email || '?').trim().charAt(0).toUpperCase()
}

export default function ProfileEntry({ collapsed = false, onOpenAuth }) {
  const { user } = useAuth()

  if (!user) {
    return (
      <button
        type="button"
        onClick={onOpenAuth}
        className={`flex w-full items-center ${collapsed ? 'justify-center' : ''} gap-3 rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-left transition hover:bg-gray-200 dark:border-gray-700/50 dark:bg-gray-800/60 dark:hover:bg-gray-800`}
      >
        <div className="flex size-10 shrink-0 aspect-square items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
          ?
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Kirjaudu
            </h4>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              Avaa profiili
            </p>
          </div>
        )}
      </button>
    )
  }

  return (
    <Link
      to="/profile"
      className={`flex w-full items-center ${collapsed ? 'justify-center' : ''} gap-3 rounded-xl border border-gray-200 bg-gray-100 p-2.5 transition hover:bg-gray-200 dark:border-gray-700/50 dark:bg-gray-800/60 dark:hover:bg-gray-800`}
    >
      <div className="flex size-10 shrink-0 aspect-square items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
        {getInitial(user)}
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {user.username || user.email}
          </h4>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            Oma profiili
          </p>
        </div>
      )}
    </Link>
  )
}
