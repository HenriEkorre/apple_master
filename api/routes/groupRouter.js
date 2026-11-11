import express from 'express'
import { getMyGroups, inviteUserToCloseGroup } from '../controllers/groupController.js'

const router = express.Router()

// get /api/groups/all
router.post('/all', getMyGroups)

// post /api/groups/:groupId/invitations
router.post('/:groupId/invitations', inviteUserToCloseGroup)

export default router