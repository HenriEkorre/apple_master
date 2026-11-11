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
  joinPublicGroup
} = await import('../../api/controllers/groupController.js')

describe('joinPublicGroup', () => {
  let req
  let res
  let next

  beforeEach(() => {
    queryMock.mockReset()

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

  // Testaa onnistuneen liittymisen julkiseen ryhmään
  it('lisää käyttäjän julkiseen ryhmään aktiiviseksi jäseneksi', async () => {
    req.params.groupId = '10'

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'public'
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 20,
          group_id: 10,
          user_id: 1,
          role: 'member',
          status: 'active'
        }
      ]
    })

    await joinPublicGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM groups'),
      [10]
    )

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO group_members'),
      [10, 1]
    )

    expect(res.status).toHaveBeenCalledWith(200)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Ryhmään liittyminen onnistui',
      membership: {
        id: 20,
        group_id: 10,
        user_id: 1,
        role: 'member',
        status: 'active'
      }
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa virheellisen ryhmätunnuksen käsittelyn
  it('palauttaa 400, jos ryhmän tunnus on virheellinen', async () => {
    req.params.groupId = 'abc'

    await joinPublicGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen ryhmän tunnus'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa tilanteen, jossa ryhmää ei löydy
  it('palauttaa 404, jos ryhmää ei löydy', async () => {
    req.params.groupId = '999'

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await joinPublicGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Ryhmää ei löytynyt'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei suljettuun ryhmään voi liittyä suoraan
  it('palauttaa 403, jos ryhmä on suljettu', async () => {
    req.params.groupId = '10'

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    await joinPublicGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Suljettuun ryhmään ei voi liittyä suoraan'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa tietokantavirheen välittämisen virheenkäsittelijälle
  it('välittää tietokantavirheen next-funktiolle', async () => {
    req.params.groupId = '10'

    const databaseError = new Error('Database error')

    queryMock.mockRejectedValueOnce(databaseError)

    await joinPublicGroup(req, res, next)

    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})