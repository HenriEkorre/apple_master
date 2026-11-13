import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../AuthProvider'

export default function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState(null)
  const [joining, setJoining] = useState(false)

  // Saadun kutsun hyväksyminen / hylkääminen
  const [respondBusy, setRespondBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  // Kutsun lähettäminen (admin, suljettu ryhmä)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(null)

  // Jäsenten hallinta (admin)
  const [memberError, setMemberError] = useState(null)
  const [busyUserId, setBusyUserId] = useState(null)

  // Haetaan yksittäisen ryhmän tiedot suoraan backendistä.
  // showSpinner = false, kun päivitetään olemassa olevaa näkymää (ei vilkuta koko sivua)
  const fetchGroupDetail = useCallback(
    async (showSpinner = true) => {
      try {
        if (showSpinner) setLoading(true)
        setError(null)
        const response = await axios.get(`/api/groups/${id}`, {
          withCredentials: true,
        })
        setGroup(response.data)
      } catch (err) {
        console.error('Virhe ryhmän haussa:', err)
        setGroup(null)
        setError(
          err.response?.status === 404
            ? 'Ryhmää ei löytynyt.'
            : 'Ryhmän tietojen lataaminen epäonnistui.',
        )
      } finally {
        if (showSpinner) setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    fetchGroupDetail()
  }, [fetchGroupDetail])

  // Suljetaan modaali Escape-näppäimellä
  useEffect(() => {
    if (!isLeaveModalOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !leaving) closeLeaveModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLeaveModalOpen, leaving])

  const openLeaveModal = () => {
    setLeaveError(null)
    setIsLeaveModalOpen(true)
  }

  const closeLeaveModal = () => {
    setIsLeaveModalOpen(false)
    setLeaveError(null)
  }

  // Liity julkiseen ryhmään
  const handleJoinGroup = async () => {
    try {
      setJoining(true)
      setActionError(null)
      await axios.post(`/api/groups/${id}/join`, {}, { withCredentials: true })
      // Haetaan tiedot uudelleen, jotta nappi ja jäsenlista päivittyvät
      await fetchGroupDetail(false)
      window.dispatchEvent(new Event('groups-changed'))
    } catch (err) {
      console.error('Virhe ryhmään liittymisessä:', err)
      alert(err.response?.data?.message || 'Liittyminen epäonnistui')
    } finally {
      setJoining(false)
    }
  }

  // Hyväksy saatu kutsu suljettuun ryhmään
  const handleAcceptInvitation = async () => {
    try {
      setRespondBusy(true)
      setActionError(null)
      await axios.post(`/api/groups/${id}/accept`, {}, { withCredentials: true })
      await fetchGroupDetail(false)
      window.dispatchEvent(new Event('groups-changed'))
    } catch (err) {
      console.error('Virhe kutsun hyväksymisessä:', err)
      setActionError(
        err.response?.data?.message || 'Kutsun hyväksyminen epäonnistui',
      )
    } finally {
      setRespondBusy(false)
    }
  }

  // Hylkää saatu kutsu (poistaa oman odottavan rivin)
  const handleDeclineInvitation = async () => {
    try {
      setRespondBusy(true)
      setActionError(null)
      await axios.delete(`/api/groups/${id}/membership`, {
        withCredentials: true,
      })
      await fetchGroupDetail(false)
      window.dispatchEvent(new Event('invitations-changed'))
    } catch (err) {
      console.error('Virhe kutsun hylkäämisessä:', err)
      setActionError(err.response?.data?.message || 'Kutsun hylkääminen epäonnistui')
    } finally {
      setRespondBusy(false)
    }
  }

  // Poistu ryhmästä
  // Jos olet ryhmän viimeinen jäsen, backend poistaa koko ryhmän
  const handleLeaveGroup = async () => {
    try {
      setLeaving(true)
      setLeaveError(null)
      await axios.delete(`/api/groups/${id}/membership`, {
        withCredentials: true,
      })
      // Kerrotaan sivupalkille, että ryhmälista on muuttunut
      window.dispatchEvent(new Event('groups-changed'))
      setIsLeaveModalOpen(false)
      navigate('/groups')
    } catch (err) {
      console.error('Virhe ryhmästä poistumisessa:', err)
      // Virhe näytetään modaalissa (esim. viimeinen ylläpitäjä ei voi poistua)
      setLeaveError(err.response?.data?.message || 'Poistuminen epäonnistui')
    } finally {
      setLeaving(false)
    }
  }

  // Admin lähettää kutsun käyttäjänimellä
  const handleInvite = async (e) => {
    e.preventDefault()
    const username = inviteUsername.trim()
    if (!username) return

    try {
      setInviting(true)
      setInviteError(null)
      setInviteSuccess(null)
      await axios.post(
        `/api/groups/${id}/invitations`,
        { username },
        { withCredentials: true },
      )
      setInviteUsername('')
      setInviteSuccess(`Kutsu lähetettiin käyttäjälle ${username}`)
      await fetchGroupDetail(false)
    } catch (err) {
      console.error('Virhe kutsun lähetyksessä:', err)
      setInviteError(err.response?.data?.message || 'Kutsun lähetys epäonnistui')
    } finally {
      setInviting(false)
    }
  }

  // Admin poistaa jäsenen tai peruu lähettämänsä kutsun
  const handleRemoveMember = async (member) => {
    const question =
      member.status === 'pending'
        ? `Perutaanko käyttäjän ${member.username} kutsu?`
        : `Poistetaanko ${member.username} ryhmästä?`
    if (!window.confirm(question)) return

    try {
      setBusyUserId(member.user_id)
      setMemberError(null)
      await axios.delete(`/api/groups/${id}/members/${member.user_id}`, {
        withCredentials: true,
      })
      await fetchGroupDetail(false)
    } catch (err) {
      console.error('Virhe jäsenen poistamisessa:', err)
      setMemberError(
        err.response?.data?.message || 'Jäsenen poistaminen epäonnistui',
      )
    } finally {
      setBusyUserId(null)
    }
  }

  // Admin nimeää jäsenen ylläpitäjäksi tai poistaa ylläpitäjän roolin
  const handleChangeRole = async (member, role) => {
    try {
      setBusyUserId(member.user_id)
      setMemberError(null)
      await axios.patch(
        `/api/groups/${id}/members/${member.user_id}`,
        { role },
        { withCredentials: true },
      )
      await fetchGroupDetail(false)
    } catch (err) {
      console.error('Virhe roolin vaihdossa:', err)
      setMemberError(err.response?.data?.message || 'Roolin vaihto epäonnistui')
    } finally {
      setBusyUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-gray-900 dark:text-white text-center">
        <p>Ladataan ryhmää...</p>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-gray-900 dark:text-white">
        <p>{error || 'Ryhmää ei löytynyt.'}</p>
        <Link
          to="/groups"
          className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block"
        >
          ← Takaisin ryhmiin
        </Link>
      </div>
    )
  }

  const isClosed = group.type === 'closed'

  // Suljetun ryhmän jäsenlista näytetään vain jäsenille (backend palauttaa muille null)
  const membersHidden = group.members === null || group.members === undefined
  const members = group.members || []

  // Aktiiviset jäsenet ja lähetetyt kutsut (pending) erikseen
  const activeMembers = members.filter((m) => m.status === 'active')
  const invitedMembers = members.filter((m) => m.status === 'pending')

  // Oma tila ryhmässä: 'active' | 'pending' (kutsuttu) | null
  const myStatus = group.myStatus || (group.isMember ? 'active' : null)
  const isAdmin = group.isMember && group.myRole === 'admin'

  // Poistumissääntöjen esitarkistus (backend tarkistaa nämä aina myös)
  const adminCount = activeMembers.filter((m) => m.role === 'admin').length
  const isOnlyMember = group.isMember && activeMembers.length === 1
  const isLastAdminWithOthers =
    isAdmin && adminCount === 1 && activeMembers.length > 1

  const renderMemberRow = (member) => {
    const isSelf = member.user_id === user?.id
    const isInvited = member.status === 'pending'
    const busy = busyUserId === member.user_id

    return (
      <li
        key={member.id}
        className="text-sm text-gray-700 dark:text-gray-300 flex justify-between items-center gap-2 bg-gray-100 dark:bg-gray-900/40 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700/50"
      >
        <span className="font-medium truncate">
          {member.username}
          {isSelf && ' (sinä)'}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 uppercase font-semibold">
            {isInvited ? 'kutsuttu' : member.role}
          </span>

          {/* Hallintanapit näkyvät vain adminille, eikä omalle rivillesi */}
          {isAdmin && !isSelf && (
            <>
              {!isInvited && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    handleChangeRole(
                      member,
                      member.role === 'admin' ? 'member' : 'admin',
                    )
                  }
                  className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer disabled:opacity-50"
                >
                  {member.role === 'admin' ? 'Poista admin' : 'Nimeä admin'}
                </button>
              )}

              {/* Ylläpitäjää ei voi poistaa suoraan, rooli pitää ensin poistaa */}
              {(isInvited || member.role !== 'admin') && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemoveMember(member)}
                  className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition cursor-pointer disabled:opacity-50"
                >
                  {isInvited ? 'Peru kutsu' : 'Poista'}
                </button>
              )}
            </>
          )}
        </div>
      </li>
    )
  }

  // Otsikkokortin oikean reunan toiminto riippuu käyttäjän tilasta
  const renderHeaderAction = () => {
    if (group.isMember) {
      return (
        <button
          onClick={openLeaveModal}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/30 transition shrink-0 cursor-pointer"
        >
          Poistu ryhmästä
        </button>
      )
    }

    // Käyttäjä on saanut kutsun suljettuun ryhmään
    if (myStatus === 'pending') {
      return (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAcceptInvitation}
            disabled={respondBusy}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow transition cursor-pointer disabled:opacity-50"
          >
            Hyväksy kutsu
          </button>
          <button
            onClick={handleDeclineInvitation}
            disabled={respondBusy}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer disabled:opacity-50"
          >
            Hylkää
          </button>
        </div>
      )
    }

    // Suljettuun ryhmään pääsee vain kutsulla
    if (isClosed) {
      return (
        <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-lg shrink-0">
          Vain kutsulla
        </span>
      )
    }

    // Julkinen ryhmä: liity suoraan
    return (
      <button
        onClick={handleJoinGroup}
        disabled={joining}
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow transition shrink-0 cursor-pointer disabled:opacity-50"
      >
        {joining ? 'Liitytään...' : 'Liity ryhmään'}
      </button>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 text-gray-900 dark:text-white relative">
      <button
        onClick={() => navigate(-1)}
        className="text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-indigo-600 dark:text-indigo-400 font-semibold transition mb-6 inline-flex items-center gap-2 cursor-pointer"
      >
        ← Takaisin
      </button>

      {/* Ryhmän otsikko ja toimintonappi */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded ${
                group.type === 'public'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
              }`}
            >
              {group.type}
            </span>
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {group.description || 'Ei kuvausta'}
          </p>
          {myStatus === 'pending' && (
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
              Sinut on kutsuttu tähän ryhmään.
            </p>
          )}
        </div>

        {renderHeaderAction()}
      </div>

      {actionError && (
        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jäsenet */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-3">Jäsenet</h3>

          {memberError && (
            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
              {memberError}
            </div>
          )}

          {membersHidden ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Jäsenlista näkyy vain ryhmän jäsenille.
              {group.member_count !== undefined &&
                ` Ryhmässä on ${group.member_count} jäsentä.`}
            </p>
          ) : members.length > 0 ? (
            <div className="space-y-4">
              <ul className="space-y-2">
                {activeMembers.map(renderMemberRow)}
              </ul>

              {/* Lähetetyt kutsut näytetään vain ylläpitäjälle */}
              {isAdmin && invitedMembers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    Lähetetyt kutsut
                  </h4>
                  <ul className="space-y-2">
                    {invitedMembers.map(renderMemberRow)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ei jäseniä vielä.</p>
          )}

          {/* Kutsulomake: vain suljetun ryhmän ylläpitäjälle */}
          {isAdmin && isClosed && (
            <form onSubmit={handleInvite} className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Kutsu käyttäjä
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteUsername}
                  onChange={(e) => setInviteUsername(e.target.value)}
                  placeholder="Käyttäjänimi"
                  className="flex-1 min-w-0 px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={inviting || !inviteUsername.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {inviting ? 'Lähetetään...' : 'Kutsu'}
                </button>
              </div>
              {inviteError && (
                <p className="mt-2 text-xs text-red-700 dark:text-red-300">{inviteError}</p>
              )}
              {inviteSuccess && (
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{inviteSuccess}</p>
              )}
            </form>
          )}
        </div>

        {/* Elokuvat */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-4">Ryhmän elokuvat</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ei vielä elokuvia tässä ryhmässä.
          </p>
        </div>
      </div>

      {/* Poistumisen vahvistusmodaali */}
      {isLeaveModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !leaving) closeLeaveModal()
          }}
        >
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-2">Poistu ryhmästä?</h2>

            {isOnlyMember ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
                Olet ryhmän <strong>{group.name}</strong> ainoa jäsen. Jos
                poistut, ryhmä poistetaan pysyvästi.
              </p>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
                Haluatko varmasti poistua ryhmästä{' '}
                <strong>{group.name}</strong>?
                {isClosed && ' Takaisin pääset vain uudella kutsulla.'}
              </p>
            )}

            {isLastAdminWithOthers && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs rounded-xl">
                Olet ryhmän ainoa ylläpitäjä. Nimeä ensin toinen ylläpitäjä
                jäsenlistasta, jotta voit poistua.
              </div>
            )}

            {leaveError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
                {leaveError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeLeaveModal}
                disabled={leaving}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer disabled:opacity-50"
              >
                Peruuta
              </button>
              <button
                type="button"
                onClick={handleLeaveGroup}
                disabled={leaving || isLastAdminWithOthers}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 transition cursor-pointer disabled:opacity-50"
              >
                {leaving
                  ? 'Poistutaan...'
                  : isOnlyMember
                    ? 'Poista ryhmä'
                    : 'Poistu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
