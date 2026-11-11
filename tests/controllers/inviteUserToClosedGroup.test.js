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

  // Testaa onnistuneen kutsun suljettuun ryhmään
  it('antaa aktiivisen ylläpitäjän kutsua käyttäjän suljettuun ryhmään', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 5
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 2
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

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
    req.body.userId = 2

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen ryhmän tunnus'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa erilaiset virheelliset käyttäjätunnukset
  it.each([
    ['abc'],
    ['0'],
    ['-5'],
    ['1.5'],
    [''],
    [undefined],
    [null]
  ])('palauttaa 400 käyttäjätunnuksella %s', async (userId) => {
    req.params.groupId = '10'
    req.body.userId = userId

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen käyttäjän tunnus'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei ylläpitäjä voi kutsua itseään
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

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa tilanteen, jossa ryhmää ei löydy
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

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei kutsua voi lähettää julkiseen ryhmään
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

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei tavallinen jäsen voi lähettää kutsua
  it('estää tavallista käyttäjää lähettämästä kutsua', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

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

  // Testaa, ettei toisen ryhmän ylläpitäjä voi lähettää kutsua
  it('vaatii ylläpitäjäroolin juuri kyseisessä ryhmässä', async () => {
    req.user.id = 1
    req.params.groupId = '10'
    req.body.userId = 2

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM group_members'),
      [10, 1]
    )

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Vain ryhmän ylläpitäjä voi lähettää kutsuja'
    })
  })

  // Testaa, että ylläpitäjän jäsenyyden pitää olla aktiivinen
  it('tarkistaa ylläpitäjän active-statuksen SQL-kyselyssä', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await inviteUserToClosedGroup(req, res, next)

    const adminQuery = queryMock.mock.calls[1][0]

    expect(adminQuery).toContain("role = 'admin'")
    expect(adminQuery).toContain("status = 'active'")
    expect(res.status).toHaveBeenCalledWith(403)
  })

  // Testaa tilanteen, jossa kutsuttavaa käyttäjää ei löydy
  it('palauttaa 404, jos kutsuttavaa käyttäjää ei löydy', async () => {
    req.params.groupId = '10'
    req.body.userId = 999

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 5
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(3)
    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Kutsuttavaa käyttäjää ei löytynyt'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei aktiivista jäsentä voi kutsua uudelleen
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

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei samaa pending-kutsua voi lähettää uudelleen
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

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että kutsu tallennetaan pending-tilassa member-roolilla
  it('luo kutsun member-roolilla ja pending-statuksella', async () => {
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
        rows: []
      })
      .mockResolvedValueOnce({
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

    const insertQuery = queryMock.mock.calls[4][0]

    expect(insertQuery).toContain(
      "VALUES ($1, $2, 'member', 'pending')"
    )

    expect(queryMock).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('INSERT INTO group_members'),
      [10, 2]
    )

    expect(res.status).toHaveBeenCalledWith(201)
  })

  // Testaa ryhmän hakemisessa tapahtuvan tietokantavirheen
  it('välittää ryhmän hakemisvirheen next-funktiolle', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    const databaseError = new Error('Group query failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa ylläpitäjän tarkistamisessa tapahtuvan tietokantavirheen
  it('välittää ylläpitäjän tarkistusvirheen next-funktiolle', async () => {
    req.params.groupId = '10'
    req.body.userId = 2

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          type: 'closed'
        }
      ]
    })

    const databaseError = new Error('Admin query failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa kutsun lisäämisessä tapahtuvan tietokantavirheen
  it('välittää kutsun lisäämisvirheen next-funktiolle', async () => {
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
        rows: []
      })

    const databaseError = new Error('Invitation insert failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await inviteUserToClosedGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(5)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})