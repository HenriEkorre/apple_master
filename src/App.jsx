import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Home from './pages/Home'
import Search from './pages/Search'
import Header from './components/Header'
import MovieDetails from './pages/MovieDetails'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import BrowseGroups from './pages/BrowseGroups'

function App() {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-900 text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header />

        <main className="p-6">
          <Routes>
            <Route path="/" element={<Home />}/>
            <Route path="/search" element={<Search />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/groups" element={<Groups/>} />
            <Route path="/groups/:id" element={<GroupDetail />} />
            <Route path="/groups/browse" element={<BrowseGroups />} />
          </Routes>
        </main>
      </div>
      <MobileNav/>
    </div>
  )
}

export default App
