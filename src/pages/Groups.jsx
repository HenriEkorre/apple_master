import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import CreateGroupModal from '../components/CreateGroupModal'

export default function Groups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  // Haetaan käyttäjän omat ryhmät backendistä
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/groups/my', { withCredentials: true })
        setGroups(response.data)
      } catch (err) {
        console.error('Virhe ryhmien haussa:', err)
        setError('Omien ryhmien lataaminen epäonnistui.')
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  // Kutsutaan kun uusi ryhmä on luotu onnistuneesti modaalissa
  const handleGroupCreated = (newGroup) => {
    // Lisätään uusi ryhmä suoraan listan alkuun
    setGroups((prevGroups) => [newGroup, ...prevGroups])
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-white">
      {/* Otsikko ja toiminnot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Omat ryhmät</h1>
          <p className="text-sm text-gray-400">Ryhmät, joiden jäsen tai ylläpitäjä olet</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold px-4 py-2 rounded-lg transition shadow cursor-pointer"
          >
            + Luo ryhmä
          </button>
          <Link 
            to="/groups/browse" 
            className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-indigo-400 font-semibold transition"
          >
            ← Selaa muita ryhmiä 
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Ladataan ryhmiä...
        </div>
      ) : (
        /* Ryhmälista */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div 
                key={group.id} 
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/60 hover:bg-gray-800/80 transition cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg group-hover:text-indigo-400 transition">
                      {group.name}
                    </h3>
                    
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      group.type === 'public' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {group.type}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {group.description || 'Ei kuvausta'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-700 text-xs text-gray-400">
                  <span>👥 Jäsen</span>
                  <span className="text-indigo-400 group-hover:text-indigo-300 font-semibold transition flex items-center gap-1">
                    Avaa ryhmä →
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 bg-gray-800/50 border border-gray-700/50 rounded-xl text-gray-400 text-sm">
              <p className="mb-3">Et kuulu vielä mihinkään ryhmään.</p>
              <Link to="/groups/browse" className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-indigo-400 font-semibold transition">
                Etsi kiinnostavia ryhmiä selaamalla →
              </Link>
            </div>
          )}
        </div>
      )}

      <CreateGroupModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  )
}