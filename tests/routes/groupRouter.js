import express from 'express'
import { getMyGroups } from '../controllers/groupController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/groups/my-groups -> Vaatii kirjautumisen (protect)
router.get('/my-groups', protect, getMyGroups)

export default router