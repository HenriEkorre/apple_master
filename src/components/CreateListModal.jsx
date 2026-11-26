import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { CloseIcon } from './Icons'

export default function CreateListModal({ isOpen, onClose, onListCreated }) {
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [groups, setGroups] = useState([])
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleClose = useCallback(() => {
    setTitle('')
    setVisibility('private')
    setGroups([])
    setSelectedGroupIds([])
    setGroupsLoading(false)
    setGroupsError(null)
    setError(null)
    onClose()
  }, [onClose])

  // Haetaan käyttäjän aktiiviset ryhmät modaalin avautuessa
  useEffect(() => {
    if (!isOpen) return undefined

    let cancelled = false

    const fetchGroups = async () => {
      try {
        setGroupsLoading(true)
        setGroupsError(null)

        const response = await axios.get('/api/groups/my', {
          withCredentials: true,
        })

        if (!cancelled) {
          setGroups(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        console.error('Virhe ryhmien haussa:', err)

        if (!cancelled) {
          setGroupsError(
            err.response?.status === 401
              ? 'Istunto on vanhentunut. Kirjaudu uudelleen.'
              : 'Ryhmien lataaminen epäonnistui.',
          )
        }
      } finally {
        if (!cancelled) {
          setGroupsLoading(false)
        }
      }
    }

    fetchGroups()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Suljetaan Escape-näppäimellä (ei kesken tallennuksen)
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) handleClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, isOpen, loading])

  if (!isOpen) return null

  // Lisätään tai poistetaan ryhmä listan jakovalinnasta
  const handleGroupSelection = (groupId, checked) => {
    setSelectedGroupIds((previousGroupIds) => {
      if (checked) {
        return previousGroupIds.includes(groupId)
          ? previousGroupIds
          : [...previousGroupIds, groupId]
      }

      return previousGroupIds.filter((id) => id !== groupId)
    })

    if (error) setError(null)
  }

  // Yksityiselle listalle ei tallenneta ryhmävalintoja
  const handleVisibilityChange = (nextVisibility) => {
    setVisibility(nextVisibility)
    setError(null)

    if (nextVisibility === 'private') {
      setSelectedGroupIds([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Tyhjää nimeä ei hyväksytä (myöskään pelkkiä välilyöntejä)
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Listan nimi ei voi olla tyhjä')
      return
    }

    // Jaetulle listalle pitää valita vähintään yksi ryhmä
    if (visibility === 'shared' && selectedGroupIds.length === 0) {
      setError('Valitse vähintään yksi ryhmä')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(
        '/api/lists',
        {
          title: trimmedTitle,
          visibility,
          groupIds: visibility === 'shared' ? selectedGroupIds : [],
        },
        { withCredentials: true },
      )

      if (onListCreated) {
        onListCreated(response.data)
      }

      // Kerrotaan muille komponenteille (esim. sivupalkille), että listat ovat muuttuneet
      window.dispatchEvent(new Event('lists-changed'))
      handleClose()
    } catch (err) {
      console.error('Virhe listan luonnissa:', err)
      setError(err.response?.data?.message || 'Listan luonti epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose()
      }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Luo uusi lista</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Sulje"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg font-bold px-2 cursor-pointer disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="list-title"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1"
            >
              Listan nimi
            </label>
            <input
              id="list-title"
              type="text"
              autoFocus
              value={title}
              maxLength={255}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Esim. Katso yksin"
              aria-invalid={error ? 'true' : 'false'}
              className={`w-full px-3.5 py-2.5 bg-gray-100 dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 ${
                error
                  ? 'border-red-500/70'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            />
          </div>

          {/* Valitaan, näkyykö lista vain käyttäjälle vai myös ryhmille */}
          <fieldset>
            <legend className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Näkyvyys
            </legend>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="list-visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => handleVisibilityChange('private')}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    Vain minulle
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Lista näkyy vain sinulle.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="list-visibility"
                  value="shared"
                  checked={visibility === 'shared'}
                  onChange={() => handleVisibilityChange('shared')}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold">
                    Jaa ryhmille
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Valitse yksi tai useampi ryhmä, joissa lista näkyy.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          {/* Ryhmävalinnat näytetään vain jaetulle listalle */}
          {visibility === 'shared' && (
            <fieldset>
              <legend className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Valitse ryhmät
              </legend>

              {groupsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ladataan ryhmiä...
                </p>
              ) : groupsError ? (
                <p className="text-sm text-red-600 dark:text-red-300">
                  {groupsError}
                </p>
              ) : groups.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Et kuulu vielä yhteenkään ryhmään.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={(e) =>
                          handleGroupSelection(group.id, e.target.checked)
                        }
                      />
                      <span className="text-sm font-medium">{group.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {error && (
            <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
          )}

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
              disabled={loading || (visibility === 'shared' && groupsLoading)}
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
