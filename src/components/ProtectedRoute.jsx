import { Navigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="py-10 text-center text-white">Tarkistetaan kirjautumista...</div>
  }

  return user ? children : <Navigate to="/" replace />
}
