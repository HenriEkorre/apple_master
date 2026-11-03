import { Router } from 'express'
import { getPopularMovies } from '../controllers/movieController.js'

const router = Router()

// Määritellään reitti: GET /api/movies/popular
router.get('/popular', getPopularMovies)

export default router