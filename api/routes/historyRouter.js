import express from 'express'
import { getMyHistory, addToHistory } from '../controllers/historyController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/history/me -> Vaatii kirjautumisen (protect-middleware)
router.get('/me', protect, getMyHistory)

// POST /api/history -> Lisää elokuva katseluhistoriaan
router.post('/', protect, addToHistory)

export default router