import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getStoredGroups, saveGroups } from '../mocks/groupStorage'

export default function GroupDetail() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  
  // Tila vahvistusmodaalin näkyvyydelle ja mahdolliselle virheviestille
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveError, setLeaveError] = useState('')

  useEffect(() => {
    const allGroups = getStoredGroups()
    const found = allGroups.find(g => String(g.id) === String(id))
    setGroup(found)
  }, [id])

  // Kun käyttäjä klikkaa "Poistu ryhmästä" -nappia
  const handleOpenLeaveModal = () => {
    const currentMember = (group?.members || []).find(m => m.username === "Sinä")
    const isAdmin = currentMember?.role === 'admin'
    const adminCount = (group?.members || []).filter(m => m.role === 'admin').length

    // Turvatarkistus: Jos olet ainoa admin, näytetään virheilmoitus modaalissa
    if (isAdmin && adminCount === 1) {
      setLeaveError("Et voi poistua ryhmästä, koska olet sen ainoa ylläpitäjä! Ylennä ensin toinen jäsen adminiksi.")
    } else {
      setLeaveError("")
    }

    setIsLeaveModalOpen(true)
  }

  // Todellinen poistumisen toteutus, kun käyttäjä vahvistaa modaalissa
  const confirmLeaveGroup = () => {
    const currentMember = (group?.members || []).find(m => m.username === "Sinä")
    const isAdmin = currentMember?.role === 'admin'
    const adminCount = (group?.members || []).filter(m => m.role === 'admin').length

    if (isAdmin && adminCount === 1) {
      return // Estetään poistuminen varmuudeksi myös tässä
    }

    const allGroups = getStoredGroups()
    const updatedGroups = allGroups.map(g => {
      if (String(g.id) === String(id)) {
        return {
          ...g,
          isMember: false,
          membersCount: g.membersCount - 1,
          members: (g.members || []).filter(m => m.username !== "Sinä")
        }
      }
      return g
    })

    saveGroups(updatedGroups)
    
    // ILMOITETAAN MUUTOKSESTA SIDEBARILLE:
    window.dispatchEvent(new Event('groups-changed'))

    setGroup(updatedGroups.find(g => String(g.id) === String(id)))
    setIsLeaveModalOpen(false)
  }

  // Roolin vaihto
  const handleToggleAdminRole = (memberId) => {
    const allGroups = getStoredGroups()
    const updatedGroups = allGroups.map(g => {
      if (String(g.id) === String(id)) {
        const updatedMembers = (g.members || []).map(m => {
          if (m.id === memberId) {
            return { ...m, role: m.role === 'admin' ? 'member' : 'admin' }
          }
          return m
        })
        return { ...g, members: updatedMembers }
      }
      return g
    })

    saveGroups(updatedGroups)
    setGroup(updatedGroups.find(g => String(g.id) === String(id)))
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-white">
        <p>Ryhmää ei löytynyt.</p>
        <Link to="/groups" className="text-indigo-400 hover:underline mt-2 inline-block">← Takaisin ryhmiin</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-white relative">
      <Link to="/groups" className="text-sm text-gray-400 hover:text-white mb-4 inline-block">
        ← Takaisin ryhmiin
      </Link>

      {/* Ryhmän otsikko ja toimintonappi */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded ${
              group.type === 'public' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {group.type}
            </span>
          </div>
          <p className="text-gray-300 text-sm">{group.description}</p>
        </div>

        {group.isMember ? (
          <button 
            onClick={handleOpenLeaveModal}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition shrink-0"
          >
            Poistu ryhmästä
          </button>
        ) : (
          <button 
            onClick={() => {
              const allGroups = getStoredGroups()
              const updated = allGroups.map(g => String(g.id) === String(id) ? { 
                ...g, 
                isMember: true, 
                membersCount: g.membersCount + 1, 
                members: [...(g.members || []), { id: Date.now(), username: "Sinä", role: "member" }] 
              } : g)
              
              saveGroups(updated)

              // ILMOITETAAN MUUTOKSESTA SIDEBARILLE:
              window.dispatchEvent(new Event('groups-changed'))

              setGroup(updated.find(g => String(g.id) === String(id)))
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow transition shrink-0"
          >
            Liity ryhmään
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jäsenet */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-3">Jäsenet ({group.members ? group.members.length : 0})</h3>
          <ul className="space-y-2">
            {group.members && group.members.map(member => (
              <li key={member.id} className="flex items-center justify-between text-sm bg-gray-900/50 p-2.5 rounded-lg border border-gray-700/40">
                <div className="flex items-center gap-2">
                  <span>{member.username}</span>
                  {member.role === 'admin' && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-semibold">Admin</span>
                  )}
                </div>
                <button 
                  onClick={() => handleToggleAdminRole(member.id)}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  {member.role === 'admin' ? 'Poista admin' : 'Tee adminiksi'}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Elokuvat */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-4">Ryhmän elokuvat ({group.movies ? group.movies.length : 0})</h3>
          {group.movies && group.movies.length > 0 ? (
            <div className="space-y-3">
              {group.movies.map((movie) => (
                <Link 
                  key={movie.id} 
                  to={`/movie/${movie.id}`}
                  className="flex items-center gap-3 bg-gray-900/60 p-2.5 rounded-lg border border-gray-700/50 hover:border-indigo-500 transition group"
                >
                  <img 
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : 'https://via.placeholder.com/40x60?text=Ei+kuvaa'} 
                    alt={movie.title}
                    className="w-10 h-14 object-cover rounded shadow shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition truncate">
                      {movie.title}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {movie.release_date ? movie.release_date.split('-')[0] : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Ei vielä elokuvia tässä ryhmässä.</p>
          )}
        </div>
      </div>

      {/* --- VAHVISTUSMODAALI (Poistuminen) --- */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm text-white shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Poistu ryhmästä?</h3>
            
            {leaveError ? (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">
                {leaveError}
              </div>
            ) : (
              <p className="text-gray-300 text-sm mb-6">
                Haluatko varmasti poistua ryhmästä <span className="font-semibold text-white">"{group.name}"</span>? Voit liittyä takaisin myöhemmin, jos ryhmä on julkinen.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-700 hover:bg-gray-600 transition"
              >
                {leaveError ? 'Selvä' : 'Peruuta'}
              </button>
              
              {!leaveError && (
                <button 
                  onClick={confirmLeaveGroup}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition shadow"
                >
                  Kyllä, poistu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}