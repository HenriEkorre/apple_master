import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStoredGroups, saveGroups } from '../mocks/groupStorage'
import CreateGroupModal from '../components/CreateGroupModal'

export default function BrowseGroups() {
  const [groups, setGroups] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setGroups(getStoredGroups())
  }, [])

  // Uuden ryhmän luonti
  const handleCreateGroup = (newGroupData) => {
    const newGroup = {
      id: Date.now(),
      name: newGroupData.name,
      description: newGroupData.description,
      type: newGroupData.type,
      membersCount: 1,
      isMember: true, // Luoja liittyy ryhmään automaattisesti
      members: [
        { id: Date.now(), username: "Sinä (Admin)", role: "admin" }
      ],
      movies: []
    }

    const updatedGroups = [newGroup, ...groups]
    setGroups(updatedGroups)
    saveGroups(updatedGroups)
  }

  // Suodata ryhmiä hakukentän mukaan
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Selaa ryhmiä</h1>
          <p className="text-sm text-gray-400">Löydä uusia elokuvakerhoja ja siirry tarkastelemaan niitä</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold px-4 py-2 rounded-lg transition shadow"
          >
            + Luo ryhmä
          </button>
          <Link to="/groups" className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-indigo-400 font-semibold transition">
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
          className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Ryhmälista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGroups.map((group) => (
          <div 
            key={group.id} 
            onClick={() => navigate(`/groups/${group.id}`)}
            className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-indigo-500/60 hover:bg-gray-800/80 transition cursor-pointer group"
          >
            <div>
              {/* Otsikko, tyyppi ja jäsenyysilmaisin */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-lg group-hover:text-indigo-400 transition">
                  {group.name}
                </h3>
                
                <div className="flex items-center gap-2 shrink-0">
                  {/* Jäsenyystila-badge */}
                  {group.isMember ? (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      ✓ Olet jäsen
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                      Ei jäsenyyttä
                    </span>
                  )}

                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    group.type === 'public' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {group.type}
                  </span>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{group.description}</p>
            </div>

            {/* Alapalkki: Henkilömäärä ja siirtymäteksti */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-700 text-xs text-gray-400">
              <span>👥 {group.membersCount} jäsentä</span>
              
              <span className="text-indigo-400 group-hover:text-indigo-300 font-semibold transition flex items-center gap-1">
                Näytä ryhmä →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Ryhmän luontimodali */}
      <CreateGroupModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  )
}