import express from 'express'
import {
  getMovieReviews,
  saveMyReview,
  deleteMyReview,
} from '../controllers/reviewController.js'
import { protect, optionalAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// Luku on avointa kaikille (kirjautunut saa lisäksi oman arvostelunsa)
router.get('/movie/:tmdbId', optionalAuth, getMovieReviews)

// Luonti/muokkaus ja poisto vaativat kirjautumisen ja koskevat vain omaa arvostelua
router.put('/movie/:tmdbId', protect, saveMyReview)
router.delete('/movie/:tmdbId', protect, deleteMyReview)

export default router