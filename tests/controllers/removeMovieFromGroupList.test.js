import { beforeEach, describe, expect, it, vi } from 'vitest'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn()
}))

vi.mock('../../api/models/db.js', () => ({
  pool: {
    query: queryMock
  }
}))

const {
  removeMovieFromGroupList
} = await import('../../api/controllers/listController.js')

describe('removeMovieFromGroupList', () => {
  let req
  let res
  let next

  beforeEach(() => {
    queryMock.mockReset()

    req = {
      user: {
        id: 1
      },
      params: {}
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  // Testaa onnistuneen elokuvan poistamisen ryhmälistalta
  it('antaa ylläpitäjän poistaa elokuvan ryhmälistalta', async () => {
    req.params.id = '5'
    req.params.tmdbMovieId = '550'

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
            id: 123
          }
        ]
      })

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(3)

    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('DELETE FROM list_movies'),
      [5, 550]
    )

    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Elokuva poistettiin listalta'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa erilaiset virheelliset listatunnukset
  it.each([
    ['abc'],
    ['0'],
    ['-5'],
    ['1.5'],
    [''],
    [undefined],
    [null]
  ])('palauttaa 400 listatunnuksella %s', async (listId) => {
    req.params.id = listId
    req.params.tmdbMovieId = '550'

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen tunnus'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa erilaiset virheelliset elokuvatunnukset
  it.each([
    ['abc'],
    ['0'],
    ['-5'],
    ['1.5'],
    [''],
    [undefined],
    [null]
  ])('palauttaa 400 elokuvatunnuksella %s', async (movieId) => {
    req.params.id = '5'
    req.params.tmdbMovieId = movieId

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen tunnus'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa tilanteen, jossa listaa ei löydy
  it('palauttaa 404 jos listaa ei löydy', async () => {
    req.params.id = '5'
    req.params.tmdbMovieId = '550'

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Listaa ei löytynyt'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei tavallinen jäsen voi poistaa elokuvaa
  it('estää tavallista jäsentä poistamasta elokuvaa ryhmälistalta', async () => {
    req.params.id = '5'
    req.params.tmdbMovieId = '550'

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

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Vain ryhmän ylläpitäjä voi poistaa elokuvia'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että ylläpitäjän jäsenyyden pitää olla aktiivinen
  it('tarkistaa active-statuksen SQL-kyselyssä', async () => {
    req.params.id = '5'
    req.params.tmdbMovieId = '550'

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

    await removeMovieFromGroupList(req, res, next)

    const adminQuery = queryMock.mock.calls[1][0]

    expect(adminQuery).toContain("role = 'admin'")
    expect(adminQuery).toContain("status = 'active'")

    expect(res.status).toHaveBeenCalledWith(403)
  })

  // Testaa tilanteen, jossa elokuvaa ei löydy listalta
  it('palauttaa 404 jos elokuvaa ei löydy listalta', async () => {
    req.params.id = '5'
    req.params.tmdbMovieId = '550'

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
        rows: []
      })

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(3)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Elokuvaa ei löytynyt listalta'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa listan haussa tapahtuvan tietokantavirheen
  it('välittää listan hakemisvirheen next-funktiolle', async () => {
    req.params.id = '5'
    req.params.tmdbMovieId = '550'

    const databaseError = new Error('List query failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)

    expect(next).toHaveBeenCalledWith(databaseError)

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa ylläpitäjän tarkistuksessa tapahtuvan tietokantavirheen
  it('välittää ylläpitäjän tarkistusvirheen next-funktiolle', async () => {
    req.params.id = '5'
    req.params.tmdbMovieId = '550'

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          owner_id: 10
        }
      ]
    })

    const databaseError = new Error('Admin query failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)

    expect(next).toHaveBeenCalledWith(databaseError)

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa poistossa tapahtuvan tietokantavirheen
  it('välittää poistovirheen next-funktiolle', async () => {
    req.params.id = '5'
    req.params.tmdbMovieId = '550'

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

    const databaseError = new Error('Delete failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await removeMovieFromGroupList(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(3)

    expect(next).toHaveBeenCalledWith(databaseError)

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})