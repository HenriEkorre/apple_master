import request from 'supertest'
import express from 'express'
import movieRouter from '../../api/routes/movieRouter.js'
import errorHandler from '../../api/middleware/errorHandler.js'
import axios from 'axios'
import { describe, test, expect, beforeEach, vi } from 'vitest'

// Mokataan axios Vitestin omalla vi.mock-funktiolla, jotta se korvaa oikean kirjaston valekirjastolla
vi.mock('axios')

// Luodaan erillinen Express-sovellus testausta varten
const app = express()
app.use(express.json())
// Otetaan testattavat elokuvien reitit käyttöön testipalvelimella
app.use('/api/movies', movieRouter)
app.use(errorHandler)

describe('Movie Controller - API Endpointit', () => {
  // Nollataan mokit jokaisen testin jälkeen
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. TESTI: Suosittujen elokuvien haku
  test('GET /api/movies/popular palauttaa suositut elokuvat (status 200)', async () => {
    // Valmistellaan valevastaus (mock), jonka axios palauttaa kutsuessa TMDB:tä
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          { id: 1, title: 'Inception' },
          { id: 2, title: 'Interstellar' },
        ],
      },
    })

    // Tehdään HTTP GET -pyyntö testipalvelimelle
    const res = await request(app).get('/api/movies/popular')

    // Tarkistetaan odotustulokset
    expect(res.statusCode).toBe(200) // Varmistetaan, että vastauskoodi on OK
    expect(res.body).toHaveLength(2) // Varmistetaan, että elokuvia tuli kaksi kappaletta
    expect(res.body[0].title).toBe('Inception') // Varmistetaan ensimmäisen elokuvan nimi
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/popular',
      {
        params: {
          api_key: undefined,
          language: 'fi-FI',
        },
      },
    )
  })

  test('GET /api/movies/popular palauttaa palvelinvirheen, kun TMDB epäonnistuu', async () => {
    axios.get.mockRejectedValueOnce(new Error('TMDB unavailable'))

    const res = await request(app).get('/api/movies/popular')

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({
      error: {
        message: 'TMDB unavailable',
        status: 500,
      },
    })
  })

  test('GET /api/movies/popular palauttaa tyhjän taulukon ilman results-kenttää', async () => {
    axios.get.mockResolvedValueOnce({ data: {} })

    const res = await request(app).get('/api/movies/popular')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })

  // 2. TESTI: Elokuvien haku hakutermin avulla (virhetilanne / puuttuva termi)
  test('GET /api/movies/search ilman q-parametria palauttaa virheen (status 400)', async () => {
    // Tehdään pyyntö ilman pakollista ?q=... -hakutermiä
    const res = await request(app).get('/api/movies/search')
    // Tarkistetaan, että palvelin hylkää pyynnön virhekoodilla 400 ja palauttaa virheviestin
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.error.status).toBe(400)
    expect(res.error.message).toBeDefined()
    expect(axios.get).not.toHaveBeenCalled()
  })

  // 3. TESTI: Yksittäisen elokuvan tietojen haku ID:n perusteella
  test('GET /api/movies/:id palauttaa yksittäisen elokuvan tiedot (status 200)', async () => {
    // Valmistellaan valevastaus tietylle elokuvalle (esim. ID 550)
    axios.get.mockResolvedValueOnce({
      data: { id: 550, title: 'Fight Club', overview: 'Kuvaus elokuvasta...' },
    })

    // Tehdään pyyntö tietyn elokuvan ID:llä
    const res = await request(app).get('/api/movies/550')

    // Tarkistetaan tulokset
    expect(res.statusCode).toBe(200)
    expect(res.body.id).toBe(550)
    expect(res.body.title).toBe('Fight Club')
  })

  test('GET /api/movies/:id välittää TMDB:n virheen errorHandlerille', async () => {
    axios.get.mockRejectedValueOnce(new Error('Movie not found'))

    const res = await request(app).get('/api/movies/999999')

    expect(res.statusCode).toBe(500)
    expect(res.body.error.message).toBe('Movie not found')
    expect(res.body.error.status).toBe(500)
  })

  test('GET /api/movies/search?q=hakutermi palauttaa haetut elokuvat (status 200)', async () => {
    // Valmistellaan valevastaus (mock), jonka axios palauttaa kutsuessa TMDB:tä
    axios.get.mockResolvedValueOnce({
      data: {
        results: [
          { id: 1, title: 'Inception' },
          { id: 2, title: 'Interstellar' },
        ],
      },
    })

    // Tehdään HTTP GET -pyyntö testipalvelimelle
    const res = await request(app).get('/api/movies/search?q=hakutermi')

    // Tarkistetaan odotustulokset
    expect(res.statusCode).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].title).toBe('Inception')
  })

  test('GET /api/movies/search palauttaa tyhjän taulukon ilman results-kenttää', async () => {
    axios.get.mockResolvedValueOnce({ data: {} })

    const res = await request(app).get('/api/movies/search?q=unknown')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([])
  })

  test('GET /api/movies/search välittää TMDB:n virheen errorHandlerille', async () => {
    axios.get.mockRejectedValueOnce(new Error('Search service unavailable'))

    const res = await request(app).get('/api/movies/search?q=batman')

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({
      error: {
        message: 'Search service unavailable',
        status: 500,
      },
    })
  })
})
