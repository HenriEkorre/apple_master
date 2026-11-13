import express from 'express'
import {
  getMyGroups,
  getAllGroups,
  getMyInvitations,
  joinPublicGroup,
  inviteUserToClosedGroup,
  acceptInvitation,
  createGroup,
  getGroupById,
  leaveGroup,
  removeMember,
  updateMemberRole,
  searchGroups
} from '../controllers/groupController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Staattiset reitit ENSIN
router.get('/my', protect, getMyGroups)
router.get('/browse', getAllGroups)
router.get('/search', protect, searchGroups)
router.get('/invitations', protect, getMyInvitations)

// Parametrireitti vasta näiden jälkeen
router.get('/:groupId', protect, getGroupById)

router.post('/:groupId/join', protect, joinPublicGroup)
router.post('/:groupId/invitations', protect, inviteUserToClosedGroup)
router.post('/:groupId/accept', protect, acceptInvitation)
router.post('/', protect, createGroup)

router.delete('/:groupId/membership', protect, leaveGroup)
router.delete('/:groupId/members/:userId', protect, removeMember)
router.patch('/:groupId/members/:userId', protect, updateMemberRole)

export default router