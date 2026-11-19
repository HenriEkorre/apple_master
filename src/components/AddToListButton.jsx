import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../AuthProvider'
import { CheckIcon } from './Icons'

export default function AddToListButton({ movieId }) {
  const { user } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [addingId, setAddingId] = useState(null)
  const [justAddedId, setJustAddedId] = useState(null)
  const containerRef = useRef(null)

  // Suljetaan valikko ja tyhjennetään tila, kun elokuva vaihtuu
  useEffect(() => {
    setIsOpen(false)
    setLists([])
    setError(null)
    setJustAddedId(null)
  }, [movieId])

  // Valikko sulkeutuu ulkopuolista klikatessa ja Escape-näppäimellä
  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Haetaan omat listat ja tieto siitä, millä listoilla elokuva jo on
  const fetchLists = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`/api/lists/my?movieId=${movieId}`, {
        withCredentials: true,
      })
      setLists(response.data)
    } catch (err) {
      console.error('Virhe listojen haussa:', err)
      setError('Listojen lataaminen epäonnistui.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false)
      return
    }
    setIsOpen(true)
    setJustAddedId(null)
    fetchLists()
  }

  // Lisää elokuva valitulle listalle
  const handleAdd = async (list) => {
    try {
      setAddingId(list.id)
      setError(null)
      await axios.post(
        `/api/lists/${list.id}/movies`,
        { tmdbMovieId: movieId },
        { withCredentials: true },
      )
      setLists((prev) =>
        prev.map((l) =>
          l.id === list.id
            ? { ...l, contains_movie: true, movie_count: l.movie_count + 1 }
            : l,
        ),
      )
      setJustAddedId(list.id)
      window.dispatchEvent(new Event('lists-changed'))
    } catch (err) {
      console.error('Virhe elokuvan lisäyksessä listalle:', err)

      // 409: elokuva on jo listalla (esim. lisätty toisessa välilehdessä)
      if (err.response?.status === 409) {
        setLists((prev) =>
          prev.map((l) => (l.id === list.id ? { ...l, contains_movie: true } : l)),
        )
      }
      setError(err.response?.data?.message || 'Elokuvan lisäys epäonnistui')
    } finally {
      setAddingId(null)
    }
  }

  // Kirjautumaton käyttäjä ei voi lisätä listalle
  if (!user) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Kirjaudu sisään lisätäksesi elokuvan listalle.
      </p>
    )
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow transition cursor-pointer"
      >
        + Lisää listalle
        <span aria-hidden="true" className="text-xs">▾</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-3rem)] z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden text-gray-900 dark:text-white">
          <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
            Valitse lista
          </div>

          {error && (
            <div className="px-4 py-2 text-xs text-red-700 dark:text-red-300 bg-red-500/10 border-b border-red-500/20">
              {error}
            </div>
          )}

          {loading ? (
            <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
              Ladataan listoja...
            </p>
          ) : lists.length === 0 && !error ? (
            <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
              <p className="mb-2">Sinulla ei ole vielä listoja.</p>
              <Link
                to="/lists"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Luo ensimmäinen lista →
              </Link>
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {lists.map((list) => (
                <li
                  key={list.id}
                  className="border-b border-gray-100 dark:border-gray-700/50 last:border-none"
                >
                  {list.contains_movie ? (
                    // Elokuva on jo tällä listalla: ei voi lisätä uudelleen
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm opacity-70">
                      <span className="truncate">{list.title}</span>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                        <span className="inline-flex items-center gap-1">
                          {justAddedId === list.id ? 'Lisätty' : 'Listalla'}
                          <CheckIcon />
                        </span>
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(list)}
                      disabled={addingId === list.id}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
                    >
                      <span className="truncate">{list.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {addingId === list.id
                          ? 'Lisätään...'
                          : `${list.movie_count} elok.`}
                      </span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/lists"
            className="block px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 hover:underline"
          >
            Hallitse listoja →
          </Link>
        </div>
      )}
    </div>
  )
}