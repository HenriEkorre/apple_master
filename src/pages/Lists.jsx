import { useState, useEffect } from 'react'
import axios from 'axios'
import CreateListModal from '../components/CreateListModal'
import { Link } from 'react-router-dom'

export default function Lists() {
  const [lists, setLists] = useState([])
  const [sharedLists, setSharedLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Haetaan käyttäjän omat ja ryhmien kautta jaetut listat backendistä
  useEffect(() => {
    let cancelled = false

    const fetchLists = async () => {
      try {
        setLoading(true)
        setError(null)
        // Haetaan omat ja jaetut listat samanaikaisesti
        const [myListsResponse, sharedListsResponse] = await Promise.all([
          axios.get('/api/lists/my', {
            withCredentials: true,
          }),
          axios.get('/api/lists/shared', {
            withCredentials: true,
          }),
        ])

        if (!cancelled) {
          setLists(myListsResponse.data)
          setSharedLists(sharedListsResponse.data)
        }
      } catch (err) {
        console.error('Virhe listojen haussa:', err)
        if (!cancelled) setError('Listojen lataaminen epäonnistui.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchLists()

    return () => {
      cancelled = true
    }
  }, [])

  // Uusi lista lisätään listan loppuun (backend palauttaa vanhimmat ensin)
  const handleListCreated = (newList) => {
    setLists((prevLists) => [...prevLists, newList])
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-gray-900 dark:text-white">
      {/* Otsikko ja toiminnot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Omat listat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Omat elokuvalistasi, esimerkiksi "Katso yksin" tai "Katso ryhmässä"
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow cursor-pointer shrink-0"
        >
          + Luo lista
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
          Ladataan listoja...
        </div>
      ) : lists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => (
            <Link
              key={list.id}
              to={`/lists/${list.id}`}
              className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500/60 rounded-xl p-5 transition"
            >
              <h3 className="font-bold text-lg truncate">{list.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {list.movie_count === 1
                  ? '1 elokuva'
                  : `${list.movie_count ?? 0} elokuvaa`}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        !error && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 text-sm">
            <p className="mb-3">Sinulla ei ole vielä yhtään listaa.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold transition cursor-pointer"
            >
              Luo ensimmäinen lista →
            </button>
          </div>
        )
      )}

      {/* Ryhmien kautta käyttäjälle jaetut listat */}
      {!loading && (
        <div className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Jaetut listat</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ryhmiesi kautta sinulle jaetut elokuvalistat
            </p>
          </div>

          {sharedLists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedLists.map((list) => (
                <Link
                  key={list.id}
                  to={`/lists/${list.id}`}
                  className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500/60 rounded-xl p-5 transition"
                >
                  <h3 className="font-bold text-lg truncate">{list.title}</h3>

                  {/* Näytetään listan ryhmä, jos backend palauttaa ryhmän nimen */}
                  {list.group_name && (
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                      {list.group_name}
                    </p>
                  )}

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {list.movie_count === 1
                      ? '1 elokuva'
                      : `${list.movie_count ?? 0} elokuvaa`}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            !error && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 text-sm">
                Sinulle ei ole vielä jaettu ryhmien listoja.
              </div>
            )
          )}
        </div>
      )}

      <CreateListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onListCreated={handleListCreated}
      />
    </div>
  )
}