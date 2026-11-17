import express from 'express'
import { getMyHistory } from '../controllers/historyController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/history/me -> Vaatii kirjautumisen (protect-middleware)
router.get('/me', protect, getMyHistory)

export default router