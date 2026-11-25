import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

export default function MobileNav({ onOpenAuth }) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const navRef = useRef(null)
  const itemRefs = useRef({})
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })

  const initial = (user?.username || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase()

  const isHomeActive = pathname === '/'
  const isReviewsActive = pathname.startsWith('/reviews')
  const isListsActive = pathname.startsWith('/lists')
  const isGroupsActive = pathname.startsWith('/groups')
  const isProfileActive = pathname.startsWith('/profile')

  const activeKey = isHomeActive
    ? 'home'
    : isReviewsActive
      ? 'reviews'
      : isListsActive
        ? 'lists'
        : isGroupsActive
          ? 'groups'
          : isProfileActive
            ? 'profile'
            : null

  const updatePill = useCallback(() => {
    const navEl = navRef.current
    const activeEl = activeKey ? itemRefs.current[activeKey] : null

    if (!navEl || !activeEl) {
      setPill((prev) => ({ ...prev, ready: false }))
      return
    }

    const navRect = navEl.getBoundingClientRect()
    const itemRect = activeEl.getBoundingClientRect()
    const inset = 2

    setPill({
      left: itemRect.left - navRect.left + inset,
      width: Math.max(0, itemRect.width - inset * 2),
      ready: true,
    })
  }, [activeKey])

  useLayoutEffect(() => {
    updatePill()
    const rafId = window.requestAnimationFrame(updatePill)
    return () => window.cancelAnimationFrame(rafId)
  }, [updatePill, user])

  useEffect(() => {
    const navEl = navRef.current
    if (!navEl) return

    window.addEventListener('resize', updatePill)

    let observer
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updatePill)
      observer.observe(navEl)
    }

    return () => {
      window.removeEventListener('resize', updatePill)
      observer?.disconnect()
    }
  }, [updatePill])

  const gridColsClass = user ? 'grid-cols-5' : 'grid-cols-3'

  const getItemClass = (active) =>
    `group relative z-10 flex w-full flex-col items-center justify-center rounded-xl py-1.5 transition-colors duration-200 motion-reduce:transition-none ${
      active
        ? 'text-gray-950 dark:text-white'
        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
    }`

  const getVisualClass = (active) =>
    `transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none ${
      active ? '-translate-y-0.5 scale-105' : 'group-active:scale-95'
    }`

  return (
    <nav
      ref={navRef}
      aria-label="Mobiilinavigaatio"
      className={`fixed bottom-0 left-0 right-0 z-50 grid ${gridColsClass} items-center gap-1 border-t border-gray-200/80 bg-white/95 px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] text-xs backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-900/95 md:hidden`}
    >
      {/* Liukuva aktiivisen kohdan taustapilleri */}
      <span
        aria-hidden="true"
        style={{
          width: `${pill.width}px`,
          transform: `translate3d(${pill.left}px, 0, 0)`,
        }}
        className={`pointer-events-none absolute top-1.5 bottom-[calc(0.375rem+env(safe-area-inset-bottom))] left-0 rounded-xl bg-gray-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-gray-800/95 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] motion-reduce:transition-none ${
          pill.ready ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Etusivu: kaikille */}
      <Link
        ref={(el) => {
          itemRefs.current.home = el
        }}
        to="/"
        aria-current={isHomeActive ? 'page' : undefined}
        className={getItemClass(isHomeActive)}
      >
        <svg
          className={`size-5 fill-current ${getVisualClass(isHomeActive)}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m12 3 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9l9-8Z" />
        </svg>
        <span
          className={`mt-0.5 leading-none text-[10px] ${
            isHomeActive ? 'font-semibold' : 'font-medium'
          }`}
        >
          Etusivu
        </span>
      </Link>

      {/* Vain kirjautuneelle: arvostelut ja listat */}
{user && (
  <>
    <Link
      ref={(el) => {
        itemRefs.current.reviews = el
      }}
      to="/reviews"
      aria-current={isReviewsActive ? 'page' : undefined}
      className={getItemClass(isReviewsActive)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="75 30 236 230"
        fill="none"
        aria-hidden="true"
        className={`size-5 ${getVisualClass(isReviewsActive)}`}
      >
        <g
          transform="translate(48 16) scale(1.22)"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M118 70C108 56 86 50 68 62C42 80 32 108 36 136C42 168 74 192 118 194C162 192 196 168 202 136C206 108 196 80 170 62C152 50 128 56 118 70Z" />
          <path d="M118 66C122 50 132 40 142 34" />
          <path d="M142 34C156 18 186 16 198 30C182 36 158 42 144 40Z" />
        </g>
      </svg>
      <span
        className={`mt-0.5 leading-none text-[10px] ${
          isReviewsActive ? 'font-semibold' : 'font-medium'
        }`}
      >
        Arvostelut
      </span>
    </Link>

          <Link
            ref={(el) => {
              itemRefs.current.lists = el
            }}
            to="/lists"
            aria-current={isListsActive ? 'page' : undefined}
            className={getItemClass(isListsActive)}
          >
            <svg
              className={`size-5 fill-current ${getVisualClass(isListsActive)}`}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0 1 15.5 4 4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" />
            </svg>
            <span
              className={`mt-0.5 leading-none text-[10px] ${
                isListsActive ? 'font-semibold' : 'font-medium'
              }`}
            >
              Listat
            </span>
          </Link>
        </>
      )}

      {/* Ryhmät: kirjautumattomalle selaussivu, kirjautuneelle omat ryhmät */}
      <Link
        ref={(el) => {
          itemRefs.current.groups = el
        }}
        to={user ? '/groups' : '/groups/browse'}
        aria-current={isGroupsActive ? 'page' : undefined}
        className={getItemClass(isGroupsActive)}
      >
        <svg
          className={`size-5 fill-current ${getVisualClass(isGroupsActive)}`}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M16 11a4 4 0 1 0-3.99-4A4 4 0 0 0 16 11Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4ZM8 13c-2.33 0-7 1.17-7 3.5V19h5v-2c0-1.11.59-2.08 1.51-2.72A7.6 7.6 0 0 1 12 13.18 11.6 11.6 0 0 0 8 13Z" />
        </svg>
        <span
          className={`mt-0.5 leading-none text-[10px] ${
            isGroupsActive ? 'font-semibold' : 'font-medium'
          }`}
        >
          Ryhmät
        </span>
      </Link>

      {/* Profiili (kirjautunut) tai Kirjaudu (kirjautumaton) */}
      {user ? (
        <Link
          ref={(el) => {
            itemRefs.current.profile = el
          }}
          to="/profile"
          aria-current={isProfileActive ? 'page' : undefined}
          className={getItemClass(isProfileActive)}
        >
          <span
            className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 motion-reduce:transition-none ${getVisualClass(
              isProfileActive
            )} ${
              isProfileActive
                ? 'bg-gray-900 text-white ring-2 ring-gray-900/15 dark:bg-white dark:text-gray-900 dark:ring-white/20'
                : 'bg-gray-700 text-white dark:bg-gray-600'
            }`}
          >
            {initial}
          </span>
          <span
            className={`mt-0.5 max-w-full truncate px-1 leading-none text-[10px] ${
              isProfileActive ? 'font-semibold' : 'font-medium'
            }`}
          >
            {user.username || user.email}
          </span>
        </Link>
      ) : (
        <button
          ref={(el) => {
            itemRefs.current.login = el
          }}
          type="button"
          onClick={onOpenAuth}
          className={`${getItemClass(false)} cursor-pointer`}
        >
          <svg
            className={`size-5 fill-current ${getVisualClass(false)}`}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
          </svg>
          <span className="mt-0.5 leading-none text-[10px] font-medium">
            Kirjaudu
          </span>
        </button>
      )}
    </nav>
  )
}