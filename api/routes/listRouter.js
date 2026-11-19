import express from 'express'
import {
  getMyLists,
  getSharedLists,
  createList,
  getListById,
  updateList,
  deleteList,
  addMovieToList,
  removeMovieFromList,
  createGroupList,
  updateGroupList,
  deleteGroupList,
  addMovieToGroupList,
  removeMovieFromGroupList,
} from '../controllers/listController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/my', protect, getMyLists)
router.get('/shared', protect, getSharedLists)
router.post('/', protect, createList)
router.post('/groups/:groupId/lists', protect, createGroupList)
router.patch('/groups/lists/:id', protect, updateGroupList)
router.delete('/groups/lists/:id', protect, deleteGroupList)
router.post('/groups/lists/:id/movies', protect, addMovieToGroupList)
router.delete('/groups/lists/:id/movies/:tmdbMovieId', protect, removeMovieFromGroupList)

router.get('/:id', protect, getListById)
router.patch('/:id', protect, updateList)
router.delete('/:id', protect, deleteList)
router.post('/:id/movies', protect, addMovieToList)
router.delete('/:id/movies/:tmdbMovieId', protect, removeMovieFromList)

export default router