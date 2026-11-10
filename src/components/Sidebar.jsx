import { Link } from 'react-router-dom'
import { useState } from 'react'
import ProfileEntry from './ProfileEntry'

export default function Sidebar({ onOpenAuth }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
  /* hidden md:flex: piilossa mobiilissa, näkyy md-koosta ylöspäin */
    <aside
      className={`hidden md:flex flex-col ${collapsed ? 'w-20' : 'w-64'} bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-r border-gray-200 dark:border-gray-800 h-screen shrink-0 transition-[width] duration-200`}
    >
      {/* 1. Logo vie etusivulle */}
      <Link
        to="/"
        className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition group cursor-pointer"
      >
        {!collapsed && (
          <h1 className="text-lg font-bold tracking-wider text-gray-900 dark:text-white group-hover:text-indigo-400 transition">
            apple_master
          </h1>
        )}
      </Link>

      {/* Sivupalkin rullattava sisältö */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <ProfileEntry collapsed={collapsed} onOpenAuth={onOpenAuth} />
        </div>

        <div>
          {!collapsed && (
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-3">
              Ryhmät
            </h3>
          )}
          <ul className="space-y-1">
            <li>
              <Link
                to="/groups"
                className="flex items-center justify-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
                title="Omat ryhmät"
              >
                <svg
                  className="size-5 shrink-0 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M16 11a4 4 0 1 0-3.99-4A4 4 0 0 0 16 11Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4ZM8 13c-2.33 0-7 1.17-7 3.5V19h5v-2c0-1.11.59-2.08 1.51-2.72A7.6 7.6 0 0 1 12 13.18 11.6 11.6 0 0 0 8 13Z" />
                </svg>
                {!collapsed && 'Omat ryhmät'}
              </Link>
            </li>
            <li>
              <Link
                to="/groups/browse"
                className="flex items-center justify-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
                title="Selaa ryhmiä"
              >
                <svg
                  className="size-5 shrink-0 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm6.92 9h-3.03a15.7 15.7 0 0 0-1.17-5.13A8.03 8.03 0 0 1 18.92 11ZM12 4c.83 1.13 1.6 3.56 1.87 7h-3.74c.27-3.44 1.04-5.87 1.87-7ZM9.28 5.87A15.7 15.7 0 0 0 8.11 11H5.08a8.03 8.03 0 0 1 4.2-5.13ZM5.08 13h3.03c.16 1.91.57 3.72 1.17 5.13A8.03 8.03 0 0 1 5.08 13Zm6.92 7c-.83-1.13-1.6-3.56-1.87-7h3.74c-.27 3.44-1.04 5.87-1.87 7Zm2.72-1.87A15.7 15.7 0 0 0 15.89 13h3.03a8.03 8.03 0 0 1-4.2 5.13Z" />
                </svg>
                {!collapsed && 'Selaa ryhmiä'}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          {!collapsed && (
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3 px-3">
              Elokuvalistat
            </h3>
          )}
          <ul className="space-y-1">
            <li>
              <Link
                to="/favorites"
                className="flex items-center justify-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
                title="Suosikit"
              >
                <svg
                  className="size-5 shrink-0 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0 1 15.5 4 4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" />
                </svg>
                {!collapsed && 'Suosikit'}
              </Link>
            </li>
            <li>
              <Link
                to="/watchlist"
                className="flex items-center justify-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
                title="Katselulista"
              >
                <svg
                  className="size-5 shrink-0 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4v2h10V7H7Zm0 4v2h10v-2H7Zm0 4v2h6v-2H7Z" />
                </svg>
                {!collapsed && 'Katselulista'}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition group"
        >
          <span className="text-lg" aria-hidden="true">
            <svg className="size-5 fill-current" viewBox="0 0 24 24">
              <path d="m19.43 12.98 1.31 1.03-1.5 2.6-1.58-.64a7.1 7.1 0 0 1-1.3.75L16.12 18.4h-3l-.24-1.68a7.1 7.1 0 0 1-1.3-.75L10 16.61l-1.5-2.6 1.31-1.03a6.7 6.7 0 0 1 0-1.5L8.5 10.45 10 7.85l1.58.64c.4-.3.84-.55 1.3-.75L13.12 6h3l.24 1.68c.46.2.9.45 1.3.75l1.58-.64 1.5 2.6-1.31 1.03a6.7 6.7 0 0 1 0 1.56ZM14.62 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
          </span>
          {!collapsed && <span className="text-sm font-medium">Asetukset</span>}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label={collapsed ? 'Laajenna sivupalkki' : 'Pienennä sivupalkki'}
        >
          <svg
            aria-hidden="true"
            className={`mx-auto rotate-90 size-4 fill-current transition-transform ${collapsed ? 'rotate-270' : ''}`}
            viewBox="0 0 12 12"
          >
            <path d="M5.9 9.4.5 4l1.4-1.4 4 4 4-4L11.3 4z" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
