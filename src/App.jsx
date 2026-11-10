import './App.css'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Home from './pages/Home'
import Search from './pages/Search'
import Header from './components/Header'
import MovieDetails from './pages/MovieDetails'
import Test from './pages/Test'
import ProtectedRoute from './components/ProtectedRoute'
import AuthOverlay from './components/AuthOverlay'
import { useState } from 'react'

function App() {
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white">
      <Sidebar onOpenAuth={() => setAuthOpen(true)} />
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Header />
        <main className="p-6">
          {/* Routes */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route
              path="/test"
              element={
                <ProtectedRoute>
                  <Test />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
      <MobileNav onOpenAuth={() => setAuthOpen(true)} />
      {authOpen && <AuthOverlay onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

export default App
