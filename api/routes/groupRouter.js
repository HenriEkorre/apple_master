import express from 'express'
import { getMyGroups, joinPublicGroup, inviteUserToClosedGroup } from '../controllers/groupController.js'


const router = express.Router()

// get /api/groups/all
router.post('/all', getMyGroups)

// POST /api/groups/:groupId/join
router.post('/:groupId/join', joinPublicGroup)


// post /api/groups/:groupId/invitations
router.post('/:groupId/invitations', inviteUserToClosedGroup)

export default router
