import { useCallback, useEffect, useRef, useState } from 'react'
import MovieCard from './MovieCard'
import MovieCardSkeleton from './MovieCardSkeleton'

export default function MovieRow({
  title,
  movies = [],
  loading = false,
  error = null,
}) {
  const rowRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = rowRef.current
    if (!el) return

    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollButtons()
    const el = rowRef.current
    if (!el) return

    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons)

    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [movies, loading, updateScrollButtons])

  const scrollByAmount = (direction) => {
    const el = rowRef.current
    if (!el) return

    const amount = Math.max(240, Math.round(el.clientWidth * 0.75))
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  const rowClass =
    'flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-4'

  return (
    <section className="group/row relative space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">
          {title}
        </h2>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-6 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      ) : loading ? (
        <div aria-busy="true" className={rowClass}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="w-36 shrink-0 snap-start sm:w-40 md:w-44"
            >
              <MovieCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Vasen nuoli */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByAmount('left')}
              aria-label={`Vieritä vasemmalle: ${title}`}
              className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/80 bg-white/90 p-2 text-gray-800 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 dark:border-gray-700/80 dark:bg-gray-900/90 dark:text-gray-100 dark:hover:bg-gray-800 sm:flex"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}

          {/* Korttirivi */}
          <div ref={rowRef} className={rowClass}>
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="w-36 shrink-0 snap-start sm:w-40 md:w-44"
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>

          {/* Oikea nuoli */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByAmount('right')}
              aria-label={`Vieritä oikealle: ${title}`}
              className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/80 bg-white/90 p-2 text-gray-800 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white active:scale-95 dark:border-gray-700/80 dark:bg-gray-900/90 dark:text-gray-100 dark:hover:bg-gray-800 sm:flex"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  )
}