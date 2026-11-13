import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import CreateGroupModal from '../components/CreateGroupModal'

export default function BrowseGroups() {
  const [groups, setGroups] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true)
        // Haetaan ryhmät backendistä (voit vaihtaa endpointin, kun teette yleisen ryhmien haun)
        const response = await axios.get('/api/groups/browse', { withCredentials: true })
        setGroups(response.data)
      } catch (err) {
        console.error('Virhe ryhmien haussa:', err)
        setError('Ryhmien lataaminen epäonnistui.')
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  // Kun uusi ryhmä on luotu onnistuneesti modaalissa
  const handleGroupCreated = (newGroup) => {
    setGroups((prevGroups) => [newGroup, ...prevGroups])
  }

  // Suodata ryhmiä hakukentän mukaan
  const filteredGroups = groups.filter(g => 
    (g.name && g.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-gray-900 dark:text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Selaa ryhmiä</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Löydä uusia elokuvakerhoja ja siirry tarkastelemaan niitä</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold px-4 py-2 rounded-lg transition shadow cursor-pointer"
          >
            + Luo ryhmä
          </button>
          <Link to="/groups" className="text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold transition">
            ← Omat ryhmät
          </Link>
        </div>
      </div>

      {/* Hakukenttä */}
      <div className="mb-6">
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Hae ryhmiä nimellä tai kuvauksella..."
          className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
          Ladataan ryhmiä...
        </div>
      ) : (
        /* Ryhmälista */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <div 
                key={group.id} 
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/60 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {group.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        group.type === 'public' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      }`}>
                        {group.type}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {group.description || 'Ei kuvausta'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  <span>👥 Ryhmä</span>
                  
                  <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 font-semibold transition flex items-center gap-1">
                    Näytä ryhmä →
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 text-sm">
              <p>Ei löydettyjä ryhmiä.</p>
            </div>
          )}
        </div>
      )}

      {/* Ryhmän luontimodali */}
      <CreateGroupModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  )
}