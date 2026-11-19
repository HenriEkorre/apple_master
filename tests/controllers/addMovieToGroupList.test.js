import { beforeEach, describe, expect, it, vi } from 'vitest'

const { queryMock, fetchMovieSummaryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  fetchMovieSummaryMock: vi.fn()
}))

vi.mock('../../api/models/db.js', () => ({
  pool: {
    query: queryMock
  }
}))

vi.mock('axios', () => ({
  default: {
    get: fetchMovieSummaryMock
  }
}))

const {
  addMovieToGroupList
} = await import('../../api/controllers/listController.js')

describe('addMovieToGroupList', () => {
  let req
  let res
  let next

  beforeEach(() => {
    queryMock.mockReset()
    fetchMovieSummaryMock.mockReset()

    req = {
      user: {
        id: 1
      },
      params: {},
      body: {}
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  // Testaa onnistuneen elokuvan lisäämisen ryhmälistalle
  it('antaa ylläpitäjän lisätä elokuvan ryhmälistalle', async () => {
    req.params.id = '5'
    req.body.tmdbMovieId = 550

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            owner_id: 10
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            count: 0
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            added_at: '2026-01-01T00:00:00.000Z'
          }
        ]
      })

    fetchMovieSummaryMock.mockResolvedValueOnce({
      data: {
        id: 550,
        title: 'Fight Club',
        poster_path: '/poster.jpg',
        release_date: '1999-10-15',
        vote_average: 8.8
      }
    })

    await addMovieToGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa virheellisen listatunnuksen
  it.each([
    ['abc'],
    ['0'],
    ['-1'],
    ['1.5'],
    [''],
    [undefined]
  ])('palauttaa 400 listatunnuksella %s', async (listId) => {
    req.params.id = listId
    req.body.tmdbMovieId = 550

    await addMovieToGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen listan tunnus'
    })
  })

  // Testaa virheellisen elokuvatunnuksen
  it.each([
    ['abc'],
    ['0'],
    ['-1'],
    ['1.5'],
    [''],
    [undefined]
  ])('palauttaa 400 elokuvatunnuksella %s', async (movieId) => {
    req.params.id = '5'
    req.body.tmdbMovieId = movieId

    await addMovieToGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen elokuvan tunnus'
    })
  })

  // Testaa tilanteen jossa listaa ei löydy
  it('palauttaa 404 jos listaa ei löydy', async () => {
    req.params.id = '5'
    req.body.tmdbMovieId = 550

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await addMovieToGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Listaa ei löytynyt'
    })
  })

  // Testaa ettei tavallinen jäsen voi lisätä elokuvaa
  it('estää tavallista jäsentä lisäämästä elokuvaa', async () => {
    req.params.id = '5'
    req.body.tmdbMovieId = 550

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            owner_id: 10
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: []
      })

    await addMovieToGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Vain ryhmän ylläpitäjä voi lisätä elokuvia'
    })
  })

  // Testaa ettei listan maksimikokoa voi ylittää
  it('estää lisäämisen täyteen listaan', async () => {
    req.params.id = '5'
    req.body.tmdbMovieId = 550

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            owner_id: 10
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            count: 50
          }
        ]
      })

    await addMovieToGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json.mock.calls[0][0].message)
      .toContain('enintään')
  })

  // Testaa tilanteen jossa TMDB:stä ei löydy elokuvaa
  it('palauttaa 404 jos elokuvaa ei löydy TMDB:stä', async () => {
    req.params.id = '5'
    req.body.tmdbMovieId = 999999

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            owner_id: 10
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            count: 0
          }
        ]
      })

    const error = new Error('Not found')
    error.response = { status: 404 }

    fetchMovieSummaryMock.mockRejectedValueOnce(error)

    await addMovieToGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Elokuvaa ei löytynyt'
    })
  })

  // Testaa ettei samaa elokuvaa voi lisätä kahdesti
  it('estää saman elokuvan lisäämisen kahdesti', async () => {
    req.params.id = '5'
    req.body.tmdbMovieId = 550

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            owner_id: 10
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            count: 0
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: []
      })

    fetchMovieSummaryMock.mockResolvedValueOnce({
      data: {
        id: 550,
        title: 'Fight Club'
      }
    })

    await addMovieToGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(409)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Elokuva on jo listalla'
    })
  })

  // Testaa tietokantavirheen välittämisen next-funktiolle
  it('välittää tietokantavirheen next-funktiolle', async () => {
    req.params.id = '5'
    req.body.tmdbMovieId = 550

    const databaseError = new Error('Database failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await addMovieToGroupList(req, res, next)

    expect(next).toHaveBeenCalledWith(databaseError)
  })

  // Testaa TMDB-virheen välittämisen next-funktiolle
  it('välittää TMDB-virheen next-funktiolle', async () => {
    req.params.id = '5'
    req.body.tmdbMovieId = 550

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5,
            owner_id: 10
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            count: 0
          }
        ]
      })

    const tmdbError = new Error('TMDB unavailable')

    fetchMovieSummaryMock.mockRejectedValueOnce(tmdbError)

    await addMovieToGroupList(req, res, next)

    expect(next).toHaveBeenCalledWith(tmdbError)
  })
})