import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import StarRating from '../components/StarRating'

const SORT_OPTIONS = {
  newest: 'Uusimmat ensin',
  highest: 'Korkein arvosana ensin',
  lowest: 'Matalin arvosana ensin',
  title: 'Nimen mukaan (A–Ö)',
}

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('fi-FI') : ''

export default function MyReviews() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    let cancelled = false

    const fetchReviews = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get('/api/reviews/my', {
          withCredentials: true,
        })
        if (!cancelled) setReviews(response.data)
      } catch (err) {
        console.error('Virhe omien arvostelujen haussa:', err)
        if (!cancelled) setError('Arvostelujen lataaminen epäonnistui.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchReviews()

    return () => {
      cancelled = true
    }
  }, [])

  // Järjestys tehdään selaimessa
  const sortedReviews = useMemo(() => {
    const list = [...reviews]
    const byDateDesc = (a, b) => new Date(b.created_at) - new Date(a.created_at)

    if (sortBy === 'highest') {
      return list.sort((a, b) => b.rating - a.rating || byDateDesc(a, b))
    }
    if (sortBy === 'lowest') {
      return list.sort((a, b) => a.rating - b.rating || byDateDesc(a, b))
    }
    if (sortBy === 'title') {
      return list.sort((a, b) => {
        // Elokuvat, joiden tietoja ei saatu, menevät loppuun
        if (!a.movie.title) return 1
        if (!b.movie.title) return -1
        return a.movie.title.localeCompare(b.movie.title, 'fi')
      })
    }
    return list.sort(byDateDesc)
  }, [reviews, sortBy])

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-gray-900 dark:text-white">
      {/* Otsikko ja yhteenveto */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Arvostelusi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading
              ? 'Ladataan...'
              : reviews.length === 0
                ? 'Et ole vielä arvostellut yhtään elokuvaa'
                : `${reviews.length === 1 ? '1 arvostelu' : `${reviews.length} arvostelua`} · keskiarvosi ${averageRating
                    .toFixed(1)
                    .replace('.', ',')} / 5`}
          </p>
        </div>

        {reviews.length > 1 && (
          <div>
            <label htmlFor="review-sort" className="sr-only">
              Järjestys
            </label>
            <select
              id="review-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse" aria-busy="true">
          <span className="sr-only">Ladataan arvosteluja...</span>
          {[0, 1, 2].map((n) => (
            <div key={n} className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        !error && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 text-sm">
            <p className="mb-3">Arvostele elokuvia, niin ne ilmestyvät tänne.</p>
            <Link
              to="/"
              className="text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold transition"
            >
              Selaa elokuvia →
            </Link>
          </div>
        )
      ) : (
        <ul className="space-y-3">
          {sortedReviews.map((review) => {
            const { movie } = review
            const year = movie.release_date ? movie.release_date.split('-')[0] : null
            const targetUrl = `/movie/${movie.id}`

            const handleCardClick = (e) => {
              if (e.target.closest('a, button')) return
              if (window.getSelection()?.toString()) return
              navigate(targetUrl)
            }

            const handleCardKeyDown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(targetUrl)
              }
            }

            return (
              <li
                key={review.id}
                role="link"
                tabIndex={0}
                onClick={handleCardClick}
                onKeyDown={handleCardKeyDown}
                className="group flex gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500/60 rounded-xl p-4 cursor-pointer transition focus:outline-none focus:border-indigo-500/60"
              >
                {/* Juliste */}
                <div className="shrink-0">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                      alt={movie.title || `Elokuva ${movie.id}`}
                      loading="lazy"
                      className="w-20 aspect-[2/3] object-cover rounded-lg bg-gray-200 dark:bg-gray-700"
                    />
                  ) : (
                    <div className="w-20 aspect-[2/3] rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400 text-center p-1">
                      Ei kuvaa
                    </div>
                  )}
                </div>

                {/* Tiedot */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <Link
                      to={targetUrl}
                      className="font-bold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate"
                    >
                      {movie.title || `Elokuva ${movie.id}`}
                      {year && (
                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                          ({year})
                        </span>
                      )}
                    </Link>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(review.created_at)}
                    </span>
                  </div>

                  {movie.unavailable && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Elokuvan tietoja ei saatu ladattua.
                    </p>
                  )}

                  <div className="mt-1.5 flex items-center gap-2">
                    <StarRating value={review.rating} size="sm" />
                    <span className="text-sm font-semibold">{review.rating} / 5</span>
                  </div>

                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {review.comment}
                    </p>
                  )}

                  <Link
                    to={targetUrl}
                    className="inline-block mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline"
                  >
                    Avaa elokuva ja muokkaa arvostelua →
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}