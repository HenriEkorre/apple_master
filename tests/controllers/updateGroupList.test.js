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
  updateGroupList
} = await import('../../api/controllers/listController.js')

describe('updateGroupList', () => {
  let req
  let res
  let next

  beforeEach(() => {
    queryMock.mockReset()

    req = {
      user: { id: 1 },
      params: {},
      body: {}
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  // Testaa onnistuneen ryhmälistan nimen päivityksen
  it('antaa ylläpitäjän päivittää ryhmälistan nimen', async () => {
    req.params.id = '5'
    req.body.title = 'Uusi nimi'

    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 5, owner_id: 10 }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1 }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: 5, title: 'Uusi nimi' }]
      })

    await updateGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
  })

  // Testaa virheellisen listatunnuksen
  it('palauttaa 400 virheellisellä listatunnuksella', async () => {
    req.params.id = 'abc'

    await updateGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  // Testaa puuttuvan nimen
  it('palauttaa 400 jos nimi puuttuu', async () => {
    req.params.id = '5'

    await updateGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  // Testaa tyhjän nimen
  it('palauttaa 400 tyhjällä nimellä', async () => {
    req.params.id = '5'
    req.body.title = '   '

    await updateGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  // Testaa tilanteen jossa listaa ei löydy
  it('palauttaa 404 jos listaa ei löydy', async () => {
    req.params.id = '5'
    req.body.title = 'Uusi nimi'

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await updateGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  // Testaa ettei tavallinen jäsen voi muokata listaa
  it('estää tavallista jäsentä muokkaamasta listaa', async () => {
    req.params.id = '5'
    req.body.title = 'Uusi nimi'

    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 5, owner_id: 10 }]
      })
      .mockResolvedValueOnce({
        rows: []
      })

    await updateGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  // Testaa tietokantavirheen välittämisen next-funktiolle
  it('välittää tietokantavirheen next-funktiolle', async () => {
    const error = new Error('Database error')

    req.params.id = '5'
    req.body.title = 'Uusi nimi'

    queryMock.mockRejectedValueOnce(error)

    await updateGroupList(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})