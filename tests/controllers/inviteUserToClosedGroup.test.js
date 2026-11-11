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
  inviteUserToClosedGroup
} = await import('../../api/controllers/groupController.js')

describe('inviteUserToClosedGroup', () => {
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

  it('antaa aktiivisen ylläpitäjän kutsua käyttäjän suljettuun ryhmään', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    // 1. Ryhmä löytyy ja on suljettu
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    // 2. Lähettäjä on aktiivinen ylläpitäjä
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 5
        }
      ]
    })

    // 3. Kutsuttava käyttäjä löytyy
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 2
        }
      ]
    })

    // 4. Käyttäjällä ei ole jäsenyyttä tai kutsua
    queryMock.mockResolvedValueOnce({
      rows: []
    })

    // 5. Luotu kutsu
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 30,
          group_id: 10,
          user_id: 2,
          role: 'member',
          status: 'pending'
        }
      ]
    })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(5)

    expect(queryMock).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('INSERT INTO group_members'),
      [10, 2]
    )

    expect(res.status).toHaveBeenCalledWith(201)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Ryhmäkutsu lähetettiin onnistuneesti',
      invitation: {
        id: 30,
        group_id: 10,
        user_id: 2,
        role: 'member',
        status: 'pending'
      }
    })

    expect(next).not.toHaveBeenCalled()
  })

  it('palauttaa 400, jos ryhmän tunnus on virheellinen', async () => {
    req.params.groupId = 'abc'
    req.body.userId = 2

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen ryhmän tunnus'
    })
  })

  it('palauttaa 400, jos kutsuttavan käyttäjän tunnus on virheellinen', async () => {
    req.params.groupId = '10'
    req.body.userId = 'abc'

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen käyttäjän tunnus'
    })
  })

  it('estää ylläpitäjää kutsumasta itseään', async () => {
    req.user.id = 1
    req.params.groupId = '10'
    req.body.userId = 1

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Et voi kutsua itseäsi ryhmään'
    })
  })

  it('palauttaa 404, jos ryhmää ei löydy', async () => {
    req.params.groupId = '999'
    req.body.userId = 2

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Ryhmää ei löytynyt'
    })
  })

  it('estää kutsun lähettämisen julkiseen ryhmään', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'public'
        }
      ]
    })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Kutsuja voi lähettää vain suljettuun ryhmään'
    })
  })

  it('estää tavallista käyttäjää lähettämästä kutsua', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    // Ryhmä on suljettu
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    // Aktiivista admin-jäsenyyttä ei löydy
    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Vain ryhmän ylläpitäjä voi lähettää kutsuja'
    })

    expect(next).not.toHaveBeenCalled()
  })

  it('palauttaa 404, jos kutsuttavaa käyttäjää ei löydy', async () => {
    req.params.groupId = '10'
    req.body.userId = 999

    // Ryhmä on suljettu
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    // Lähettäjä on aktiivinen ylläpitäjä
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 5
        }
      ]
    })

    // Kutsuttavaa käyttäjää ei löydy
    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(3)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Kutsuttavaa käyttäjää ei löytynyt'
    })
  })

  it('estää jo aktiivisen jäsenen kutsumisen', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            type: 'closed'
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 30,
            role: 'member',
            status: 'active'
          }
        ]
      })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(4)

    expect(res.status).toHaveBeenCalledWith(409)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Käyttäjä on jo ryhmän jäsen'
    })
  })

  it('estää uuden kutsun, jos pending-kutsu on jo olemassa', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            type: 'closed'
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 5
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2
          }
        ]
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 30,
            role: 'member',
            status: 'pending'
          }
        ]
      })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(4)

    expect(res.status).toHaveBeenCalledWith(409)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Käyttäjällä on jo odottava kutsu tai jäsenyyspyyntö'
    })
  })

  it('välittää tietokantavirheen next-funktiolle', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    const databaseError = new Error('Database error')

    queryMock.mockRejectedValueOnce(databaseError)

    await inviteUserToClosedGroup(req, res, next)

    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})