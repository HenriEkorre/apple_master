import { beforeEach, describe, expect, it, vi } from 'vitest'

const { connectMock, clientQueryMock, releaseMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  clientQueryMock: vi.fn(),
  releaseMock: vi.fn(),
}))

vi.mock('../../api/models/db.js', () => ({
  pool: {
    connect: connectMock,
  },
}))

const { createList } = await import('../../api/controllers/listController.js')

describe('createList - käyttäjälistan jakaminen', () => {
  let req
  let res
  let next

  beforeEach(() => {
    connectMock.mockReset()
    clientQueryMock.mockReset()
    releaseMock.mockReset()

    connectMock.mockResolvedValue({
      query: clientQueryMock,
      release: releaseMock,
    })

    req = {
      user: { id: 1 },
      body: {},
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }

    next = vi.fn()
  })

  // Testaa yksityisen käyttäjälistan luonnin ilman ryhmäjakoja
  it('luo yksityisen listan', async () => {
    req.body = {
      title: 'Omat elokuvat',
      visibility: 'private',
      groupIds: [],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 5,
          title: 'Omat elokuvat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO lists'),
      ['Omat elokuvat', 1, 'private'],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'COMMIT')
    expect(clientQueryMock).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO list_groups'),
      expect.anything(),
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      id: 5,
      title: 'Omat elokuvat',
      owner_type: 'user',
      owner_id: 1,
      visibility: 'private',
      movie_count: 0,
      group_ids: [],
    })
    expect(releaseMock).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa yksityisen listan luonnin ilman groupIds-kenttää
  it('luo yksityisen listan ilman groupIds-kenttää', async () => {
    req.body = {
      title: 'Omat elokuvat',
      visibility: 'private',
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 6,
          title: 'Omat elokuvat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO lists'),
      ['Omat elokuvat', 1, 'private'],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'COMMIT')
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 6,
      visibility: 'private',
      group_ids: [],
    }))
    expect(releaseMock).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa käyttäjälistan jakamisen usealle aktiiviselle ryhmälle
  it('luo usealle ryhmälle jaetun listan', async () => {
    req.body = {
      title: 'Viikonlopun elokuvat',
      visibility: 'shared',
      groupIds: [2, 5],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ group_id: 2 }, { group_id: 5 }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Viikonlopun elokuvat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'shared',
        }],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM group_members'),
      [1, [2, 5]],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO lists'),
      ['Viikonlopun elokuvat', 1, 'shared'],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO list_groups'),
      [12, [2, 5]],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(5, 'COMMIT')
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 12,
      visibility: 'shared',
      group_ids: [2, 5],
      movie_count: 0,
    }))
    expect(releaseMock).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei jaettua listaa voi luoda ilman groupIds-kenttää
  it('hylkää jaetun listan ilman groupIds-kenttää', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
    }

    await createList(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Valitse vähintään yksi ryhmä',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei jaettua listaa voi luoda ilman ryhmävalintaa
  it('hylkää jaetun listan ilman ryhmiä', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: [],
    }

    await createList(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Valitse vähintään yksi ryhmä',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa virheellisen näkyvyysarvon
  it('hylkää virheellisen näkyvyyden', async () => {
    req.body = {
      title: 'Julkinen lista',
      visibility: 'public',
      groupIds: [],
    }

    await createList(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen listan näkyvyys',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että groupIds-arvon pitää olla taulukko
  it('hylkää virheellisen groupIds-arvon', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: '2',
    }

    await createList(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Ryhmien tunnusten pitää olla taulukossa',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa saman ryhmän valitsemisen kahdesti
  it('hylkää saman ryhmän valitsemisen useammin kuin kerran', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: [2, 2],
    }

    await createList(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Sama ryhmä on valittu useammin kuin kerran',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa yksityisen listan luonnin, kun näkyvyysarvo puuttuu
  it('käyttää private-näkyvyyttä oletusarvona', async () => {
    req.body = {
      title: 'Lista ilman näkyvyyttä',
      groupIds: [],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 7,
          title: 'Lista ilman näkyvyyttä',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(connectMock).toHaveBeenCalledOnce()
    expect(clientQueryMock).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO lists'),
      ['Lista ilman näkyvyyttä', 1, 'private'],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'COMMIT')

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 7,
      visibility: 'private',
      group_ids: [],
    }))

    expect(releaseMock).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa merkkijonona annetun numeerisen ryhmätunnuksen muuntamisen luvuksi
  it('muuntaa numeerisen merkkijonon ryhmätunnukseksi', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: ['2'],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ group_id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 8,
          title: 'Jaettava lista',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'shared',
        }],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(connectMock).toHaveBeenCalledOnce()
    expect(clientQueryMock).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM group_members'),
      [1, [2]],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO lists'),
      ['Jaettava lista', 1, 'shared'],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO list_groups'),
      [8, [2]],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(5, 'COMMIT')
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 8,
      visibility: 'shared',
      group_ids: [2],
    }))
    expect(releaseMock).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa virheelliset ryhmätunnukset
  it.each([
    { groupId: 0, description: 'nolla' },
    { groupId: -1, description: 'negatiivinen kokonaisluku' },
    { groupId: 1.5, description: 'desimaaliluku' },
    { groupId: null, description: 'null-arvo' },
    { groupId: undefined, description: 'undefined-arvo' },
  ])('hylkää virheellisen ryhmätunnuksen: $description', async ({ groupId }) => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: [groupId],
    }

    await createList(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen ryhmän tunnus',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että kaikki ryhmätunnukset validoidaan
  it('hylkää listan jos yksi useista ryhmätunnuksista on virheellinen', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: [2, -1, 5],
    }

    await createList(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen ryhmän tunnus',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa NaN-arvon ryhmätunnuksena
  it('hylkää NaN-arvon ryhmätunnuksena', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: [Number.NaN],
    }

    await createList(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen ryhmän tunnus',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että käyttäjän pitää kuulua kaikkiin valittuihin ryhmiin
  it('hylkää ryhmän johon käyttäjä ei kuulu', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: [2, 5],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{ group_id: 2 }],
      })
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK')
    expect(clientQueryMock).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO lists'),
      expect.anything(),
    )
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Et kuulu kaikkiin valittuihin ryhmiin',
    })
    expect(releaseMock).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei odottavaa jäsenyyttä hyväksytä aktiiviseksi jäsenyydeksi
  it('hylkää ryhmän johon käyttäjällä ei ole aktiivista jäsenyyttä', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: [2],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM group_members'),
      [1, [2]],
    )
    expect(clientQueryMock.mock.calls[1][0]).toContain('status = \'active\'')
    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK')
    expect(res.status).toHaveBeenCalledWith(403)
    expect(releaseMock).toHaveBeenCalledOnce()
  })

  // Testaa transaktion perumisen, jos ryhmäjakojen lisääminen epäonnistuu
  it('peruu listan luonnin jos ryhmäjakojen lisääminen epäonnistuu', async () => {
    req.body = {
      title: 'Jaettava lista',
      visibility: 'shared',
      groupIds: [2],
    }

    const databaseError = new Error('List groups insert failed')

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ group_id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 20,
          title: 'Jaettava lista',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'shared',
        }],
      })
      .mockRejectedValueOnce(databaseError)
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(5, 'ROLLBACK')
    expect(clientQueryMock).not.toHaveBeenCalledWith('COMMIT')
    expect(res.status).not.toHaveBeenCalledWith(201)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(releaseMock).toHaveBeenCalledOnce()
  })

  // Testaa transaktion perumisen tietokantavirheessä
  it('tekee rollbackin tietokantavirheessä', async () => {
    req.body = {
      title: 'Omat elokuvat',
      visibility: 'private',
      groupIds: [],
    }

    const databaseError = new Error('Database failed')

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(databaseError)
      .mockResolvedValueOnce({})

    await createList(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK')
    expect(clientQueryMock).not.toHaveBeenCalledWith('COMMIT')
    expect(res.status).not.toHaveBeenCalledWith(201)
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(releaseMock).toHaveBeenCalledOnce()
  })

  // Testaa tietokantayhteyden muodostamisen epäonnistumisen
  it('välittää yhteysvirheen virheenkäsittelijälle', async () => {
    req.body = {
      title: 'Omat elokuvat',
      visibility: 'private',
      groupIds: [],
    }

    const connectionError = new Error('Connection failed')
    connectMock.mockRejectedValueOnce(connectionError)

    await createList(req, res, next)

    expect(next).toHaveBeenCalledWith(connectionError)
    expect(clientQueryMock).not.toHaveBeenCalled()
    expect(releaseMock).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
