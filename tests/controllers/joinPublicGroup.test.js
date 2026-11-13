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

  // Testaa erilaiset virheelliset ryhmätunnukset
  it.each([
    ['abc'],
    ['0'],
    ['-5'],
    ['1.5'],
    [''],
    [undefined],
    [null]
  ])('palauttaa 400 ryhmätunnuksella %s', async (groupId) => {
    req.params.groupId = groupId

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
      message: 'Suljettuun ryhmään pääsee vain kutsulla'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että kirjautuneen käyttäjän tunnusta käytetään bodyn tunnuksen sijasta
  it('käyttää req.user.id-arvoa jäsenyyden luomisessa', async () => {
    req.user.id = 1
    req.params.groupId = '10'
    req.body.userId = 999

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

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO group_members'),
      [10, 1]
    )

    expect(queryMock).not.toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      [10, 999]
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa saman käyttäjän uudelleen liittymisen
  it('käsittelee olemassa olevan jäsenyyden konfliktin', async () => {
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

    const membershipQuery = queryMock.mock.calls[1][0]

    expect(membershipQuery).toContain(
      'ON CONFLICT (group_id, user_id)'
    )

    expect(membershipQuery).toContain(
      "status = 'active'"
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa pending-jäsenyyden muuttamisen aktiiviseksi
  it('asettaa jäsenyyden statukseksi active konfliktitilanteessa', async () => {
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

    const membershipQuery = queryMock.mock.calls[1][0]

    expect(membershipQuery).toContain(
      "VALUES ($1, $2, 'member', 'active')"
    )

    expect(membershipQuery).toContain(
      "DO UPDATE SET status = 'active'"
    )

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        membership: expect.objectContaining({
          status: 'active'
        })
      })
    )
  })

  // Testaa, ettei olemassa olevan jäsenyyden roolia muuteta
  it('säilyttää käyttäjän olemassa olevan roolin konfliktitilanteessa', async () => {
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
          role: 'admin',
          status: 'active'
        }
      ]
    })

    await joinPublicGroup(req, res, next)

    const membershipQuery = queryMock.mock.calls[1][0]

    expect(membershipQuery).toContain(
      "DO UPDATE SET status = 'active'"
    )

    expect(membershipQuery).not.toMatch(
      /DO UPDATE SET\s+role\s*=/i
    )

    expect(res.json).toHaveBeenCalledWith({
      message: 'Ryhmään liittyminen onnistui',
      membership: {
        id: 20,
        group_id: 10,
        user_id: 1,
        role: 'admin',
        status: 'active'
      }
    })
  })

  // Testaa ryhmän hakemisessa tapahtuvan tietokantavirheen
  it('välittää ryhmän hakemisvirheen next-funktiolle', async () => {
    req.params.groupId = '10'

    const databaseError = new Error('Database error')

    queryMock.mockRejectedValueOnce(databaseError)

    await joinPublicGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa jäsenyyden lisäämisessä tapahtuvan tietokantavirheen
  it('välittää jäsenyyden lisäämisvirheen next-funktiolle', async () => {
    req.params.groupId = '10'

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'public'
        }
      ]
    })

    const databaseError = new Error('Membership insert failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await joinPublicGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})