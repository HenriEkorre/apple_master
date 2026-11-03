import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Sidebar from './components/Sidebar'
import Home from './pages/Home'

import Header from './components/Header'

function App() {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-900 text-white">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header />

        <main className="p-6">
          <Routes>
            <Route path="/" element={<Home />}/>
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
