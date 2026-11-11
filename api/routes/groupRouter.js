import express from 'express'
import { getMyGroups, joinPublicGroup } from '../controllers/groupController.js'

const router = express.Router()

// get /api/groups/all
router.post('/all', getMyGroups)

// POST /api/groups/:groupId/join
router.post('/:groupId/join', joinPublicGroup)

export default router
