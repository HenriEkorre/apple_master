import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

function getInitial(user) {
  return (user?.username || user?.email || 'U').trim().charAt(0).toUpperCase()
}

export default function Profile() {
  const { id } = useParams()
  const { user: loggedInUser, loading: authLoading } = useAuth()
  const profileId = id || loggedInUser?.id
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (!profileId) return

    let cancelled = false

    async function fetchProfile() {
      try {
        setLoading(true)
        setError('')
        const response = await axios.get(`/api/profile/${profileId}`)
        if (!cancelled) setProfile(response.data)
      } catch (requestError) {
        console.error('Virhe profiilin haussa:', requestError)
        if (!cancelled) setError('Profiilin lataaminen epäonnistui.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProfile()
    return () => {
      cancelled = true
    }
  }, [authLoading, profileId])

  if (!authLoading && !profileId) {
    return (
      <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
        Kirjaudu sisään nähdäksesi profiilin.
      </p>
    )
  }

  if (loading) {
    return (
      <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
        Ladataan profiilia...
      </p>
    )
  }

  if (error) {
    return (
      <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
        {error}
      </p>
    )
  }

  const user = Array.isArray(profile?.user) ? profile.user[0] : profile?.user
  const groups = profile?.groups || []

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-1 text-gray-900 dark:text-white md:p-4">
      <ProfileHeader user={user} groupCount={groups.length} />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Reviews />
        <Groups groups={groups} />
      </div>
    </div>
  )
}

function ProfileHeader({ user, groupCount }) {
  const memberYear = user?.created_at
    ? new Date(user.created_at).getFullYear()
    : '—'

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-4xl font-bold text-white">
          {getInitial(user)}
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
            Profiili
          </p>
          <h1 className="truncate text-3xl font-bold">
            {user?.username || 'Movie lover'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Jäsen vuodesta {memberYear}
          </p>
        </div>
      </div>
    </section>
  )
}

function Reviews() {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
          Mielipiteet
        </p>
        <h2 className="mt-1 text-2xl font-bold">Omat arvostelut</h2>
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        WIP
      </div>
    </section>
  )
}

function Groups({ groups }) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
          Yhteisö
        </p>
        <h2 className="mt-1 text-2xl font-bold">Ryhmät</h2>
      </div>
      {groups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Et kuulu vielä mihinkään ryhmään.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={group.link || `/groups/${group.id}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-indigo-500/60 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {group.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-bold">{group.name}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {group.type || 'Ryhmän jäsen'}
                </p>
              </div>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
