import express from 'express'
import {
  getMyLists,
  createList,
  getListById,
  updateList,
  deleteList,
  addMovieToList,
  removeMovieFromList,
} from '../controllers/listController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/my', protect, getMyLists)
router.post('/', protect, createList)

router.get('/:id', protect, getListById)
router.patch('/:id', protect, updateList)
router.delete('/:id', protect, deleteList)
router.post('/:id/movies', protect, addMovieToList)
router.delete('/:id/movies/:tmdbMovieId', protect, removeMovieFromList)

export default router