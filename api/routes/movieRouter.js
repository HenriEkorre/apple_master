import { Router } from 'express'
import { getPopularMovies, searchMovies, getMovieDetails, getTopRatedMovies } from '../controllers/movieController.js'
import { optionalAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Reitti suosituille elokuville: GET /api/movies/popular
router.get('/popular', optionalAuth, getPopularMovies)

router.get('/top-rated', optionalAuth, getTopRatedMovies)

// Reitti elokuvien hakuun: GET /api/movies/search?q=hakutermi
router.get('/search', searchMovies)

// Reitti yksittäisen elokuvan tiedoille ID:n perusteella: GET /api/movies/:id
router.get('/:id', getMovieDetails)

export default router