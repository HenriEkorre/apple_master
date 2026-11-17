import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import MovieCard from '../components/MovieCard'

export default function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [list, setList] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Nimen vaihto
  const [isRenaming, setIsRenaming] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)
  const [titleError, setTitleError] = useState(null)

  // Listan poisto
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Elokuvan poisto listalta
  const [removingId, setRemovingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  // Elokuvahaku ja lisäys
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState(null)
  const [searchError, setSearchError] = useState(null)

  // Haetaan lista elokuvineen
  useEffect(() => {
    let cancelled = false

    const fetchList = async () => {
      try {
        setLoading(true)
        setError(null)
        setQuery('')
        setResults([])
        setIsRenaming(false)
        setIsDeleteModalOpen(false)
        const response = await axios.get(`/api/lists/${id}`, {
          withCredentials: true,
        })
        if (!cancelled) setList(response.data)
      } catch (err) {
        console.error('Virhe listan haussa:', err)
        if (!cancelled) {
          setList(null)
          setError(
            err.response?.status === 404
              ? 'Listaa ei löytynyt.'
              : 'Listan lataaminen epäonnistui.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchList()

    return () => {
      cancelled = true
    }
  }, [id])

  // Elokuvahaku (debounce 400 ms)
  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    let cancelled = false
    setSearching(true)

    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(
          `/api/movies/search?q=${encodeURIComponent(trimmed)}`,
        )
        if (cancelled) return
        const data = response.data.results || response.data
        setResults(data.slice(0, 6))
      } catch (err) {
        console.error('Virhe elokuvahaussa:', err)
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  // Poistovahvistuksen sulkeminen Escape-näppäimellä (ei kesken poiston)
  useEffect(() => {
    if (!isDeleteModalOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !deleting) closeDeleteModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDeleteModalOpen, deleting])

  // --- Nimen vaihto ---

  const startRename = () => {
    setEditTitle(list.title)
    setTitleError(null)
    setIsRenaming(true)
  }

  const cancelRename = () => {
    setIsRenaming(false)
    setTitleError(null)
  }

  const handleRename = async (e) => {
    e.preventDefault()

    // Tyhjää nimeä ei hyväksytä (myöskään pelkkiä välilyöntejä)
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) {
      setTitleError('Listan nimi ei voi olla tyhjä')
      return
    }

    // Ei muutosta: suljetaan muokkaus ilman pyyntöä
    if (trimmedTitle === list.title) {
      cancelRename()
      return
    }

    try {
      setSavingTitle(true)
      setTitleError(null)
      const response = await axios.patch(
        `/api/lists/${id}`,
        { title: trimmedTitle },
        { withCredentials: true },
      )
      setList((prev) => ({ ...prev, title: response.data.title }))
      setIsRenaming(false)
      window.dispatchEvent(new Event('lists-changed'))
    } catch (err) {
      console.error('Virhe nimen vaihdossa:', err)
      setTitleError(err.response?.data?.message || 'Nimen vaihto epäonnistui')
    } finally {
      setSavingTitle(false)
    }
  }

  // --- Koko listan poisto ---

  const openDeleteModal = () => {
    setDeleteError(null)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeleteError(null)
  }

  const handleDeleteList = async () => {
    try {
      setDeleting(true)
      setDeleteError(null)
      await axios.delete(`/api/lists/${id}`, { withCredentials: true })
      window.dispatchEvent(new Event('lists-changed'))
      navigate('/lists')
    } catch (err) {
      console.error('Virhe listan poistossa:', err)
      setDeleteError(err.response?.data?.message || 'Listan poisto epäonnistui')
      setDeleting(false)
    }
  }

  // --- Elokuvat ---

  // Lisää elokuva listalle
  const handleAddMovie = async (movie) => {
    try {
      setAddingId(movie.id)
      setSearchError(null)
      const response = await axios.post(
        `/api/lists/${id}/movies`,
        { tmdbMovieId: movie.id },
        { withCredentials: true },
      )
      // Uusin elokuva listan alkuun
      setList((prev) => ({
        ...prev,
        movies: [response.data.movie, ...prev.movies],
      }))
    } catch (err) {
      console.error('Virhe elokuvan lisäyksessä:', err)
      setSearchError(err.response?.data?.message || 'Elokuvan lisäys epäonnistui')
    } finally {
      setAddingId(null)
    }
  }

  // Poista elokuva listalta
  const handleRemoveMovie = async (movie) => {
    const name = movie.title || 'tämä elokuva'
    if (!window.confirm(`Poistetaanko "${name}" listalta?`)) return

    try {
      setRemovingId(movie.id)
      setActionError(null)
      await axios.delete(`/api/lists/${id}/movies/${movie.id}`, {
        withCredentials: true,
      })
      setList((prev) => ({
        ...prev,
        movies: prev.movies.filter((m) => m.id !== movie.id),
      }))
    } catch (err) {
      console.error('Virhe elokuvan poistossa:', err)
      setActionError(err.response?.data?.message || 'Elokuvan poisto epäonnistui')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-gray-900 dark:text-white text-center">
        <p>Ladataan listaa...</p>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-gray-900 dark:text-white">
        <p>{error || 'Listaa ei löytynyt.'}</p>
        <Link
          to="/lists"
          className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
        >
          ← Takaisin listoihin
        </Link>
      </div>
    )
  }

  const movieIdsInList = new Set(list.movies.map((m) => m.id))
  const showResults = query.trim().length >= 2

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 text-gray-900 dark:text-white">
      <Link
        to="/lists"
        className="text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold transition mb-6 inline-flex items-center gap-2"
      >
        ← Omat listat
      </Link>

      {/* Otsikko ja toiminnot */}
      <div className="mb-6">
        {isRenaming ? (
          <form onSubmit={handleRename} noValidate>
            <label
              htmlFor="rename-title"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Listan nimi
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="rename-title"
                type="text"
                autoFocus
                value={editTitle}
                maxLength={255}
                onChange={(e) => {
                  setEditTitle(e.target.value)
                  if (titleError) setTitleError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelRename()
                }}
                aria-invalid={titleError ? 'true' : 'false'}
                className={`flex-1 min-w-0 px-3.5 py-2.5 bg-gray-100 dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white text-lg font-bold focus:outline-none focus:border-indigo-500 ${
                  titleError ? 'border-red-500/70' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={savingTitle}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer disabled:opacity-50"
                >
                  {savingTitle ? 'Tallennetaan...' : 'Tallenna'}
                </button>
                <button
                  type="button"
                  onClick={cancelRename}
                  disabled={savingTitle}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition cursor-pointer disabled:opacity-50"
                >
                  Peruuta
                </button>
              </div>
            </div>
            {titleError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-300">{titleError}</p>
            )}
          </form>
        ) : (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold break-words">{list.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {list.movies.length === 1
                  ? '1 elokuva'
                  : `${list.movies.length} elokuvaa`}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={startRename}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transition cursor-pointer"
              >
                Nimeä uudelleen
              </button>
              <button
                type="button"
                onClick={openDeleteModal}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/30 transition cursor-pointer"
              >
                Poista lista
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Elokuvan lisäys hakemalla */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
        <label
          htmlFor="add-movie"
          className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"
        >
          Lisää elokuva listalle
        </label>
        <input
          id="add-movie"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSearchError(null)
          }}
          placeholder="Hae elokuvaa nimellä..."
          className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
        />

        {searchError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-300">{searchError}</p>
        )}

        {showResults && (
          <div className="mt-3">
            {searching ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Haetaan...</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ei hakutuloksia.
              </p>
            ) : (
              <ul className="space-y-2">
                {results.map((movie) => {
                  const alreadyInList = movieIdsInList.has(movie.id)

                  return (
                    <li
                      key={movie.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/50"
                    >
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt=""
                          className="w-10 h-14 object-cover rounded shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-14 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{movie.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {movie.release_date
                            ? movie.release_date.split('-')[0]
                            : 'Ei vuotta'}
                        </p>
                      </div>

                      {alreadyInList ? (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                          Listalla
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddMovie(movie)}
                          disabled={addingId === movie.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {addingId === movie.id ? 'Lisätään...' : '+ Lisää'}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
          {actionError}
        </div>
      )}

      {/* Listan elokuvat */}
      {list.movies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 text-sm">
          Listalla ei ole vielä elokuvia. Hae elokuvia yllä olevasta kentästä.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
          {list.movies.map((movie) => (
            <div key={movie.id} className="relative">
              {movie.unavailable ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl aspect-[2/3] flex items-center justify-center text-center p-4 text-xs text-gray-500 dark:text-gray-400">
                  Elokuvan tietoja ei saatu ladattua (tunnus {movie.id})
                </div>
              ) : (
                <MovieCard movie={movie} />
              )}

              <button
                type="button"
                onClick={() => handleRemoveMovie(movie)}
                disabled={removingId === movie.id}
                aria-label={`Poista ${movie.title || 'elokuva'} listalta`}
                className="absolute top-2 right-2 z-10 px-2 py-1 rounded-lg text-xs font-semibold bg-black/70 hover:bg-red-600 text-white transition cursor-pointer disabled:opacity-50"
              >
                {removingId === movie.id ? '...' : '✕ Poista'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Listan poiston vahvistus */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) closeDeleteModal()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-list-title"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-gray-900 dark:text-white"
          >
            <h2 id="delete-list-title" className="text-lg font-bold mb-2">
              Poistetaanko lista?
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
              Lista <strong>{list.title}</strong>
              {list.movies.length > 0 &&
                ` ja sen ${list.movies.length} elokuvaa`}{' '}
              poistetaan pysyvästi. Toimintoa ei voi perua.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition cursor-pointer disabled:opacity-50"
              >
                Peruuta
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Poistetaan...' : 'Poista lista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}