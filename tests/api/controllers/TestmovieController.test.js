import request from 'supertest'
import express from 'express'
import movieRouter from '../../../api/routes/movieRouter.js'
import axios from 'axios'
import { describe, test, expect, beforeEach, vi } from 'vitest'

// Mokataan axios Vitestin omalla vi.mock-funktiolla, jotta se korvaa oikean kirjaston valekirjastolla
vi.mock('axios')

// Luodaan erillinen Express-sovellus testausta varten
const app = express()
app.use(express.json())
// Otetaan testattavat elokuvien reitit käyttöön testipalvelimella
app.use('/api/movies', movieRouter)

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
          { id: 2, title: 'Interstellar' }
        ] 
      }
    })

    // Tehdään HTTP GET -pyyntö testipalvelimelle
    const res = await request(app).get('/api/movies/popular')

    // Tarkistetaan odotustulokset
    expect(res.statusCode).toBe(200) // Varmistetaan, että vastauskoodi on OK
    expect(res.body).toHaveLength(2) // Varmistetaan, että elokuvia tuli kaksi kappaletta
    expect(res.body[0].title).toBe('Inception') // Varmistetaan ensimmäisen elokuvan nimi
  })

  // 2. TESTI: Elokuvien haku hakutermin avulla (virhetilanne / puuttuva termi)
  test('GET /api/movies/search ilman q-parametria palauttaa virheen (status 400)', async () => {
    // Tehdään pyyntö ilman pakollista ?q=... -hakutermiä
    const res = await request(app).get('/api/movies/search')

    // Tarkistetaan, että palvelin hylkää pyynnön virhekoodilla 400 ja palauttaa virheviestin
    expect(res.statusCode).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  // 3. TESTI: Yksittäisen elokuvan tietojen haku ID:n perusteella
  test('GET /api/movies/:id palauttaa yksittäisen elokuvan tiedot (status 200)', async () => {
    // Valmistellaan valevastaus tietylle elokuvalle (esim. ID 550)
    axios.get.mockResolvedValueOnce({
      data: { id: 550, title: 'Fight Club', overview: 'Kuvaus elokuvasta...' }
    })

    // Tehdään pyyntö tietyn elokuvan ID:llä
    const res = await request(app).get('/api/movies/550')

    // Tarkistetaan tulokset
    expect(res.statusCode).toBe(200)
    expect(res.body.id).toBe(550)
    expect(res.body.title).toBe('Fight Club')
  })
})