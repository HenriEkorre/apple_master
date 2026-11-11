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
  createGroup
} = await import('../../api/controllers/groupController.js')

describe('createGroup', () => {
  let req
  let res
  let next

  beforeEach(() => {
    queryMock.mockReset()

    req = {
      user: {
        id: 1
      },
      body: {}
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  // Testaa julkisen ryhmän onnistuneen luonnin
  it('luo julkisen ryhmän ja lisää luojan ylläpitäjäksi', async () => {
    req.body = {
      name: 'Elokuvakerho',
      description: 'Ryhmä elokuvista keskustelemiseen',
      type: 'public'
    }

    const createdGroup = {
      id: 10,
      name: 'Elokuvakerho',
      description: 'Ryhmä elokuvista keskustelemiseen',
      type: 'public',
      creator_id: 1
    }

    queryMock.mockResolvedValueOnce({
      rows: [createdGroup]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await createGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO groups'),
      [
        'Elokuvakerho',
        'Ryhmä elokuvista keskustelemiseen',
        'public',
        1
      ]
    )

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO group_members'),
      [10, 1]
    )

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(createdGroup)
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa suljetun ryhmän onnistuneen luonnin
  it('luo suljetun ryhmän', async () => {
    req.body = {
      name: 'Suljettu elokuvakerho',
      description: 'Vain kutsutuille käyttäjille',
      type: 'closed'
    }

    const createdGroup = {
      id: 20,
      name: 'Suljettu elokuvakerho',
      description: 'Vain kutsutuille käyttäjille',
      type: 'closed',
      creator_id: 1
    }

    queryMock.mockResolvedValueOnce({
      rows: [createdGroup]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await createGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO groups'),
      [
        'Suljettu elokuvakerho',
        'Vain kutsutuille käyttäjille',
        'closed',
        1
      ]
    )

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(createdGroup)
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa ryhmän luonnin ilman vapaaehtoista kuvausta
  it('luo ryhmän ilman kuvausta', async () => {
    req.body = {
      name: 'Ryhmä ilman kuvausta',
      type: 'public'
    }

    const createdGroup = {
      id: 30,
      name: 'Ryhmä ilman kuvausta',
      description: null,
      type: 'public',
      creator_id: 1
    }

    queryMock.mockResolvedValueOnce({
      rows: [createdGroup]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await createGroup(req, res, next)

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO groups'),
      ['Ryhmä ilman kuvausta', undefined, 'public', 1]
    )

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(createdGroup)
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa puuttuvan ryhmän nimen käsittelyn
  it('palauttaa 400, jos ryhmän nimi puuttuu', async () => {
    req.body = {
      description: 'Ryhmän kuvaus',
      type: 'public'
    }

    await createGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Nimi ja ryhmän tyyppi ovat pakollisia'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa puuttuvan ryhmätyypin käsittelyn
  it('palauttaa 400, jos ryhmän tyyppi puuttuu', async () => {
    req.body = {
      name: 'Elokuvakerho',
      description: 'Ryhmän kuvaus'
    }

    await createGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Nimi ja ryhmän tyyppi ovat pakollisia'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa virheellisen ryhmätyypin käsittelyn
  it.each([
    ['private'],
    ['PUBLIC'],
    ['open'],
    ['admin']
  ])('palauttaa 400 ryhmätyypillä %s', async (type) => {
    req.body = {
      name: 'Elokuvakerho',
      description: 'Ryhmän kuvaus',
      type
    }

    await createGroup(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Ryhmän tyyppi täytyy olla joko public tai closed'
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että creator_id otetaan kirjautuneelta käyttäjältä
  it('käyttää req.user.id-arvoa ryhmän luojana', async () => {
    req.user.id = 7

    req.body = {
      name: 'Käyttäjän ryhmä',
      description: 'Testikuvaus',
      type: 'public',
      creatorId: 999
    }

    const createdGroup = {
      id: 40,
      name: 'Käyttäjän ryhmä',
      description: 'Testikuvaus',
      type: 'public',
      creator_id: 7
    }

    queryMock.mockResolvedValueOnce({
      rows: [createdGroup]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await createGroup(req, res, next)

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO groups'),
      ['Käyttäjän ryhmä', 'Testikuvaus', 'public', 7]
    )

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO group_members'),
      [40, 7]
    )

    expect(res.status).toHaveBeenCalledWith(201)
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että ryhmän luoja lisätään aktiiviseksi ylläpitäjäksi
  it('lisää ryhmän luojan admin-roolilla ja active-statuksella', async () => {
    req.body = {
      name: 'Elokuvakerho',
      description: 'Ryhmän kuvaus',
      type: 'closed'
    }

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 50,
          name: 'Elokuvakerho',
          description: 'Ryhmän kuvaus',
          type: 'closed',
          creator_id: 1
        }
      ]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await createGroup(req, res, next)

    const membershipQuery = queryMock.mock.calls[1][0]

    expect(membershipQuery).toContain('INSERT INTO group_members')
    expect(membershipQuery).toContain("'admin'")
    expect(membershipQuery).toContain("'active'")

    expect(queryMock.mock.calls[1][1]).toEqual([50, 1])
    expect(res.status).toHaveBeenCalledWith(201)
  })

  // Testaa ryhmän lisäämisessä tapahtuvan tietokantavirheen
  it('välittää ryhmän lisäämisvirheen next-funktiolle', async () => {
    req.body = {
      name: 'Elokuvakerho',
      description: 'Ryhmän kuvaus',
      type: 'public'
    }

    const databaseError = new Error('Group insert failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await createGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa ylläpitäjäjäsenyyden lisäämisessä tapahtuvan virheen
  it('välittää ylläpitäjän lisäämisvirheen next-funktiolle', async () => {
    req.body = {
      name: 'Elokuvakerho',
      description: 'Ryhmän kuvaus',
      type: 'public'
    }

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 60,
          name: 'Elokuvakerho',
          description: 'Ryhmän kuvaus',
          type: 'public',
          creator_id: 1
        }
      ]
    })

    const databaseError = new Error('Admin membership insert failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await createGroup(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})