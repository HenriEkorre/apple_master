import express from 'express'
import { getMyReviews } from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/reviews/me -> Palauttaa kirjautuneen käyttäjän arvostelut
router.get('/me', protect, getMyReviews)

export default router