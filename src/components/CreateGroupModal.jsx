import { useState } from 'react'
import axios from 'axios'

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('public') // 'public' tai 'closed'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Lähetetään tiedot suoraan backendin endpointille
      const response = await axios.post(
        '/api/groups',
        { 
          name: name.trim(), 
          description: description.trim(), 
          type 
        },
        { withCredentials: true } // Varmistaa, että evästekirjautuminen välittyy mukaan
      )

      // Jos ylätason komponentti antoi funktion, kerrotaan sille luodusta ryhmästä
      if (onGroupCreated) {
        onGroupCreated(response.data)
      }

      // Tyhjennetään kentät ja suljetaan modaali
      setName('')
      setDescription('')
      setType('public')
      onClose()
    } catch (err) {
      console.error('Virhe ryhmän luonnissa:', err)
      setError(err.response?.data?.message || 'Ryhmän luonti epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Luo uusi ryhmä</h2>
          <button 
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-white text-lg font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Ryhmän nimi
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Esim. Sunnuntain scifi-illat"
              required
              className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Kuvaus
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kerro lyhyesti mitä ryhmässä tehdään..."
              rows="3"
              className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Ryhmän tyyppi
            </label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="public">Julkinen (kaikki voivat liittyä suoraan)</option>
              <option value="closed">Suljettu (vaatii liittymispyynnön)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-700 hover:bg-gray-600 transition cursor-pointer"
            >
              Peruuta
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 transition shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Luodaan...' : 'Luo ryhmä'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}