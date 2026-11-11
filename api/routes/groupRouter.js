import express from 'express'
import { getMyGroups, inviteUserToClosedGroup } from '../controllers/groupController.js'

const router = express.Router()

// get /api/groups/all
router.post('/all', getMyGroups)

// post /api/groups/:groupId/invitations
router.post('/:groupId/invitations', inviteUserToClosedGroup)

export default router