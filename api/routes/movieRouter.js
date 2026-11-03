import { Router } from 'express'
import { getPopularMovies, searchMovies } from '../controllers/movieController.js'

const router = Router()

// Reitti suosituille elokuville: GET /api/movies/popular
router.get('/popular', getPopularMovies)

// Reitti elokuvien hakuun: GET /api/movies/search?q=hakutermi
router.get('/search', searchMovies)

export default router