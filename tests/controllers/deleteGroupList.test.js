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
  deleteGroupList
} = await import('../../api/controllers/listController.js')

describe('deleteGroupList', () => {
  let req
  let res
  let next

  beforeEach(() => {
    queryMock.mockReset()

    req = {
      user: { id: 1 },
      params: {}
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }

    next = vi.fn()
  })

  // Testaa onnistuneen poistamisen
  it('antaa ylläpitäjän poistaa ryhmälistan', async () => {
    req.params.id = '5'

    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 5, owner_id: 10 }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1 }]
      })
      .mockResolvedValueOnce({})

    await deleteGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
  })

  // Testaa virheellisen listatunnuksen
  it('palauttaa 400 virheellisellä listatunnuksella', async () => {
    req.params.id = 'abc'

    await deleteGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  // Testaa tilanteen jossa listaa ei löydy
  it('palauttaa 404 jos listaa ei löydy', async () => {
    req.params.id = '5'

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await deleteGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  // Testaa ettei tavallinen jäsen voi poistaa listaa
  it('estää tavallista jäsentä poistamasta listaa', async () => {
    req.params.id = '5'

    queryMock
      .mockResolvedValueOnce({
        rows: [{ id: 5, owner_id: 10 }]
      })
      .mockResolvedValueOnce({
        rows: []
      })

    await deleteGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  // Testaa tietokantavirheen välittämisen next-funktiolle
  it('välittää tietokantavirheen next-funktiolle', async () => {
    const error = new Error('Database error')

    req.params.id = '5'

    queryMock.mockRejectedValueOnce(error)

    await deleteGroupList(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})