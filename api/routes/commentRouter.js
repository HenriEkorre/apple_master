import express from 'express'
import { getMyComments } from '../controllers/commentController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/me', protect, getMyComments)

export default router