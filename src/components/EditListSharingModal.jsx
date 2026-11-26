import { useEffect, useState } from 'react'
import axios from 'axios'
import { CloseIcon } from './Icons'

export default function EditListSharingModal({
  list,
  isOpen,
  onClose,
  onSharingUpdated,
}) {
  const [visibility, setVisibility] = useState(
    list?.visibility === 'shared' ? 'shared' : 'private',
  )
  const [groups, setGroups] = useState([])
  const [selectedGroupIds, setSelectedGroupIds] = useState(() =>
    Array.isArray(list?.groups)
      ? list.groups.map((group) => group.id)
      : [],
  )
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Haetaan käyttäjän aktiiviset ryhmät modaalin avautuessa
  useEffect(() => {
    if (!isOpen) return undefined

    let cancelled = false

    const fetchGroups = async () => {
      try {
        setGroupsLoading(true)

        const response = await axios.get('/api/groups/my', {
          withCredentials: true,
        })

        if (!cancelled) {
          setGroups(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        console.error('Virhe ryhmien haussa:', err)

        if (!cancelled) {
          setError(
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
      if (e.key === 'Escape' && !saving) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, saving])

  if (!isOpen || !list) return null


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

    // Jaetulle listalle pitää valita vähintään yksi ryhmä
    if (visibility === 'shared' && selectedGroupIds.length === 0) {
      setError('Valitse vähintään yksi ryhmä')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const response = await axios.patch(
        `/api/lists/${list.id}/sharing`,
        {
          visibility,
          groupIds: visibility === 'shared' ? selectedGroupIds : [],
        },
        { withCredentials: true },
      )

      if (onSharingUpdated) {
        onSharingUpdated(response.data)
      }

      // Kerrotaan muille komponenteille, että listan tiedot ovat muuttuneet
      window.dispatchEvent(new Event('lists-changed'))
      onClose()
    } catch (err) {
      console.error('Virhe listan näkyvyyden muuttamisessa:', err)
      setError(
        err.response?.data?.message ||
          'Listan näkyvyyden muuttaminen epäonnistui',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-900 dark:text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Muokkaa näkyvyyttä</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Sulje"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-lg font-bold px-2 cursor-pointer disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Valitaan, näkyykö lista vain käyttäjälle vai myös ryhmille */}
          <fieldset>
            <legend className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Näkyvyys
            </legend>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer">
                <input
                  type="radio"
                  name="list-sharing-visibility"
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
                  name="list-sharing-visibility"
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
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition cursor-pointer disabled:opacity-50"
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                (visibility === 'shared' && groupsLoading)
              }
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
