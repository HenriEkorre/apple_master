import express from 'express'
import { getMyReviews, createReview } from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/reviews/me -> Palauttaa kirjautuneen käyttäjän arvostelut
router.get('/me', protect, getMyReviews)

// POST /api/reviews -> Luo uuden arvostelun
router.post('/', protect, createReview)

export default router