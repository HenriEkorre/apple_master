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

const {
  updateListSharing,
} = await import('../../api/controllers/listController.js')

describe('updateListSharing', () => {
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
      params: { id: '12' },
      body: {},
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }

    next = vi.fn()
  })

  // Testaa listatunnuksen validoinnin ennen tietokantayhteyden avaamista
  it.each([
    ['abc'],
    ['0'],
    ['-1'],
    ['1.5'],
    [''],
    ['   '],
    [null],
    [undefined],
  ])('palauttaa 400 listatunnuksella %s', async (listId) => {
    req.params.id = listId
    req.body = {
      visibility: 'private',
      groupIds: [],
    }

    await updateListSharing(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen listan tunnus',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa puuttuvan näkyvyysarvon
  it('hylkää puuttuvan näkyvyysarvon', async () => {
    req.body = { groupIds: [] }

    await updateListSharing(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen listan näkyvyys',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa tyhjän ja tuntemattoman näkyvyysarvon
  it.each(['', 'public', 'PRIVATE', null])(
    'hylkää virheellisen näkyvyysarvon %s',
    async (visibility) => {
      req.body = { visibility, groupIds: [] }

      await updateListSharing(req, res, next)

      expect(connectMock).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Virheellinen listan näkyvyys',
      })
      expect(next).not.toHaveBeenCalled()
    },
  )

  // Testaa groupIds-kentän tyypin
  it.each(['2', 2, null, {}])(
    'hylkää groupIds-arvon joka ei ole taulukko',
    async (groupIds) => {
      req.body = { visibility: 'shared', groupIds }

      await updateListSharing(req, res, next)

      expect(connectMock).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Ryhmien tunnusten pitää olla taulukossa',
      })
      expect(next).not.toHaveBeenCalled()
    },
  )

  // Testaa virheelliset ryhmätunnukset
  it.each([
    { groupId: 0, description: 'nolla' },
    { groupId: -1, description: 'negatiivinen kokonaisluku' },
    { groupId: 1.5, description: 'desimaaliluku' },
    { groupId: null, description: 'null-arvo' },
    { groupId: undefined, description: 'undefined-arvo' },
    { groupId: Number.NaN, description: 'NaN-arvo' },
  ])('hylkää virheellisen ryhmätunnuksen: $description', async ({ groupId }) => {
    req.body = {
      visibility: 'shared',
      groupIds: [groupId],
    }

    await updateListSharing(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen ryhmän tunnus',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa saman ryhmän valitsemisen useammin kuin kerran
  it('hylkää ryhmätunnusten duplikaatit', async () => {
    req.body = {
      visibility: 'shared',
      groupIds: [2, 2],
    }

    await updateListSharing(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Sama ryhmä on valittu useammin kuin kerran',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa yksityisen listan muuttamisen jaetuksi
  it('muuttaa yksityisen listan jaetuksi', async () => {
    req.body = {
      visibility: 'shared',
      groupIds: [2, 5],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Katsottavat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ group_id: 2 }, { group_id: 5 }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Katsottavat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'shared',
        }],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          { id: 2, name: 'Elokuvakerho' },
          { id: 5, name: 'Kaveriporukka' },
        ],
      })
      .mockResolvedValueOnce({})

    await updateListSharing(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FOR UPDATE'),
      [12, 1],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM group_members'),
      [1, [2, 5]],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('UPDATE lists'),
      ['shared', 12, 1],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('DELETE FROM list_groups'),
      [12],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining('INSERT INTO list_groups'),
      [12, [2, 5]],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(8, 'COMMIT')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 12,
      visibility: 'shared',
      group_ids: [2, 5],
      can_manage: true,
      groups: [
        { id: 2, name: 'Elokuvakerho' },
        { id: 5, name: 'Kaveriporukka' },
      ],
    }))
    expect(releaseMock).toHaveBeenCalledOnce()
  })

  // Testaa jaetun listan muuttamisen yksityiseksi
  it('muuttaa jaetun listan yksityiseksi ja poistaa ryhmäjaot', async () => {
    req.body = {
      visibility: 'private',
      groupIds: [],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Katsottavat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'shared',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Katsottavat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})

    await updateListSharing(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE lists'),
      ['private', 12, 1],
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('DELETE FROM list_groups'),
      [12],
    )
    expect(clientQueryMock).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO list_groups'),
      expect.anything(),
    )
    expect(clientQueryMock).toHaveBeenNthCalledWith(6, 'COMMIT')
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      visibility: 'private',
      groups: [],
      group_ids: [],
      can_manage: true,
    }))
  })

  // Testaa jaetun listan ilman ryhmävalintaa
  it('hylkää jaetun listan ilman ryhmiä', async () => {
    req.body = {
      visibility: 'shared',
      groupIds: [],
    }

    await updateListSharing(req, res, next)

    expect(connectMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Valitse vähintään yksi ryhmä',
    })
  })

  // Testaa, ettei toisen käyttäjän tai ryhmän omistamaa listaa voi jakaa
  it('hylkää listan jota käyttäjä ei omista', async () => {
    req.body = {
      visibility: 'private',
      groupIds: [],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})

    await updateListSharing(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK')
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Listaa ei löytynyt',
    })
    expect(releaseMock).toHaveBeenCalledOnce()
  })

  // Testaa, että käyttäjän pitää kuulua kaikkiin valittuihin ryhmiin
  it('hylkää ryhmän johon käyttäjä ei kuulu', async () => {
    req.body = {
      visibility: 'shared',
      groupIds: [2, 5],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ group_id: 2 }],
      })
      .mockResolvedValueOnce({})

    await updateListSharing(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(4, 'ROLLBACK')
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Et kuulu kaikkiin valittuihin ryhmiin',
    })
  })

  // Testaa, ettei odottavaa jäsenyyttä hyväksytä aktiiviseksi jäsenyydeksi
  it('hylkää ryhmän johon käyttäjällä ei ole aktiivista jäsenyyttä', async () => {
    req.body = {
      visibility: 'shared',
      groupIds: [2],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})

    await updateListSharing(req, res, next)

    expect(clientQueryMock.mock.calls[2][0]).toContain('status = \'active\'')
    expect(clientQueryMock).toHaveBeenNthCalledWith(4, 'ROLLBACK')
    expect(clientQueryMock).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE lists'),
      expect.anything(),
    )
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Et kuulu kaikkiin valittuihin ryhmiin',
    })
    expect(releaseMock).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että osittain sallittu ryhmävalinta hylätään kokonaan
  it('ei päivitä listaa jos yksi valituista ryhmistä ei ole sallittu', async () => {
    req.body = {
      visibility: 'shared',
      groupIds: [2, 5],
    }

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({ rows: [{ group_id: 2 }] })
      .mockResolvedValueOnce({})

    await updateListSharing(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(4, 'ROLLBACK')
    expect(clientQueryMock).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE lists'),
      expect.anything(),
    )
    expect(clientQueryMock).not.toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM list_groups'),
      expect.anything(),
    )
    expect(clientQueryMock).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO list_groups'),
      expect.anything(),
    )
    expect(res.status).toHaveBeenCalledWith(403)
    expect(releaseMock).toHaveBeenCalledOnce()
  })

  // Testaa transaktion perumisen, jos uusien ryhmäjakojen lisääminen epäonnistuu
  it('peruu kaikki muutokset jos ryhmäjakojen lisääminen epäonnistuu', async () => {
    req.body = {
      visibility: 'shared',
      groupIds: [2],
    }

    const databaseError = new Error('List groups insert failed')

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
        }],
      })
      .mockResolvedValueOnce({ rows: [{ group_id: 2 }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          owner_type: 'user',
          owner_id: 1,
          visibility: 'shared',
        }],
      })
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(databaseError)
      .mockResolvedValueOnce({})

    await updateListSharing(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(7, 'ROLLBACK')
    expect(clientQueryMock).not.toHaveBeenCalledWith('COMMIT')
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(releaseMock).toHaveBeenCalledOnce()
  })

  // Testaa tietokantayhteyden muodostamisen epäonnistumisen
  it('välittää yhteysvirheen virheenkäsittelijälle', async () => {
    req.body = {
      visibility: 'private',
      groupIds: [],
    }

    const connectionError = new Error('Connection failed')
    connectMock.mockRejectedValueOnce(connectionError)

    await updateListSharing(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(connectionError)
    expect(clientQueryMock).not.toHaveBeenCalled()
    expect(releaseMock).not.toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa transaktion perumisen tietokantavirheessä
  it('tekee rollbackin tietokantavirheessä', async () => {
    req.body = {
      visibility: 'private',
      groupIds: [],
    }

    const databaseError = new Error('Database failed')

    clientQueryMock
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(databaseError)
      .mockResolvedValueOnce({})

    await updateListSharing(req, res, next)

    expect(clientQueryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK')
    expect(clientQueryMock).not.toHaveBeenCalledWith('COMMIT')
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(releaseMock).toHaveBeenCalledOnce()
  })
})
