import express from 'express'
import { getMyComments, createComment } from '../controllers/commentController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/comments/me -> Palauttaa kirjautuneen käyttäjän kommentit
router.get('/me', protect, getMyComments)

// POST /api/comments -> Lisää uuden kommentin
router.post('/', protect, createComment)

export default router