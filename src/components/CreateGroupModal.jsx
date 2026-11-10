import { useState } from 'react'

export default function CreateGroupModal({ isOpen, onClose, onCreateGroup }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('public') // 'public' tai 'closed'

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    // Lähetetään uuden ryhmän tiedot ylöspäin
    onCreateGroup({
      name,
      description,
      type
    })

    // Tyhjennetään kentät ja suljetaan modaali
    setName('')
    setDescription('')
    setType('public')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Luo uusi ryhmä</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold px-2"
          >
            ✕
          </button>
        </div>

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
              className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="public">Julkinen (kaikki voivat liittyä suoraan)</option>
              <option value="closed">Suljettu (vaatii liittymispyynnön)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-700 hover:bg-gray-600 transition"
            >
              Peruuta
            </button>
            <button 
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 transition shadow"
            >
              Luo ryhmä
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}