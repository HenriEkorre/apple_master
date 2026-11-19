import { useEffect, useState } from 'react'
import axios from 'axios'

export default function CreateGroupListModal({
  groupId,
  isOpen,
  onClose,
  onListCreated,
}) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Suljetaan Escape-näppäimellä (ei kesken tallennuksen)
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        setTitle('')
        setError(null)
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const handleClose = () => {
    setTitle('')
    setError(null)
    onClose()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    // Tyhjää nimeä ei hyväksytä (myöskään pelkkiä välilyöntejä)
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Listan nimi ei voi olla tyhjä')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(
        `/api/lists/groups/${groupId}/lists`,
        { title: trimmedTitle },
        { withCredentials: true },
      )

      if (onListCreated) {
        onListCreated(response.data)
      }

      // Kerrotaan muille komponenteille, että listat ovat muuttuneet
      window.dispatchEvent(new Event('lists-changed'))
      handleClose()
    } catch (requestError) {
      console.error('Virhe ryhmälistan luonnissa:', requestError)
      setError(
        requestError.response?.data?.message ||
          'Ryhmälistan luonti epäonnistui',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) handleClose()
      }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md text-gray-900 dark:text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Luo ryhmälle lista</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Sulje"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg font-bold px-2 cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="group-list-title"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Listan nimi
            </label>
            <input
              id="group-list-title"
              type="text"
              autoFocus
              value={title}
              maxLength={255}
              onChange={(event) => {
                setTitle(event.target.value)
                if (error) setError(null)
              }}
              placeholder="Esim. Ryhmän katsottavat"
              aria-invalid={error ? 'true' : 'false'}
              className={`w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 ${
                error
                  ? 'border-red-500/70'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {error && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-300">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition cursor-pointer disabled:opacity-50"
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Luodaan...' : 'Luo lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
