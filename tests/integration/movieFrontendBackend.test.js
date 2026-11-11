import express from 'express'
import request from 'supertest'
import axios from 'axios'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import errorHandler from '../../api/middleware/errorHandler.js'
import movieRouter from '../../api/routes/movieRouter.js'

vi.mock('axios')

const app = express()
app.use(express.json())
app.use('/api/movies', movieRouter)
app.use(errorHandler)

describe('frontend-backend movie contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Home frontend request receives an array of popular movies', async () => {
    axios.get.mockResolvedValueOnce({
      data: { results: [{ id: 1, title: 'Inception' }] },
    })

    const response = await request(app).get('/api/movies/popular')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body[0]).toMatchObject({ id: 1, title: 'Inception' })
  })

  test('Search frontend request receives movies directly as an array', async () => {
    axios.get.mockResolvedValueOnce({
      data: { results: [{ id: 2, title: 'Interstellar' }] },
    })

    const response = await request(app).get('/api/movies/search?q=interstellar')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ id: 2, title: 'Interstellar' }])
  })

  test('MovieDetails frontend request receives a movie object', async () => {
    axios.get.mockResolvedValueOnce({
      data: { id: 550, title: 'Fight Club', overview: 'A story' },
    })

    const response = await request(app).get('/api/movies/550')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: 550,
      title: 'Fight Club',
      overview: 'A story',
    })
  })

  test('frontend receives a consistent error contract when search fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('TMDB unavailable'))

    const response = await request(app).get('/api/movies/search?q=batman')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: {
        message: 'TMDB unavailable',
        status: 500,
      },
    })
  })
})
