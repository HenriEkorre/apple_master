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
  createGroupList
} = await import('../../api/controllers/listController.js')

describe('createGroupList', () => {
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

  // Testaa onnistuneen ryhmälistan luonnin
  it('antaa ylläpitäjän luoda ryhmälistan', async () => {
    req.params.groupId = '10'
    req.body.title = 'Kauhuelokuvat'

    queryMock.mockResolvedValueOnce({
      rows: [{ id: 10 }]
    })

    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1 }]
    })

    queryMock.mockResolvedValueOnce({
      rows: [{
        id: 5,
        title: 'Kauhuelokuvat',
        owner_type: 'group',
        owner_id: 10
      }]
    })

    await createGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)

    expect(res.json).toHaveBeenCalledWith({
      id: 5,
      title: 'Kauhuelokuvat',
      owner_type: 'group',
      owner_id: 10,
      movie_count: 0
    })

    expect(next).not.toHaveBeenCalled()
  })

  // Testaa tilanteen, jossa ryhmää ei löydy
  it('palauttaa 404 jos ryhmää ei löydy', async () => {
    req.params.groupId = '999'
    req.body.title = 'Testi'

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await createGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Ryhmää ei löytynyt'
    })
  })

  // Testaa, ettei tavallinen jäsen voi luoda listaa
  it('estää tavallista jäsentä luomasta ryhmälistaa', async () => {
    req.params.groupId = '10'
    req.body.title = 'Testi'

    queryMock.mockResolvedValueOnce({
      rows: [{ id: 10 }]
    })

    queryMock.mockResolvedValueOnce({
      rows: []
    })

    await createGroupList(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Vain ryhmän ylläpitäjä voi luoda listoja'
    })
  })

  // Testaa tyhjän listan nimen
  it('palauttaa 400 tyhjällä nimellä', async () => {
    req.params.groupId = '10'
    req.body.title = '   '

    await createGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)
  })

  // Testaa virheellisen ryhmätunnuksen
  it.each([
    ['abc'],
    ['0'],
    ['-1'],
    ['1.5'],
    [''],
    [undefined]
  ])('palauttaa 400 ryhmätunnuksella %s', async (groupId) => {
    req.params.groupId = groupId
    req.body.title = 'Testi'

    await createGroupList(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()

    expect(res.status).toHaveBeenCalledWith(400)

    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen ryhmän tunnus'
    })
  })

  // Testaa tietokantavirheen välittämisen next-funktiolle
  it('välittää tietokantavirheen next-funktiolle', async () => {
    req.params.groupId = '10'
    req.body.title = 'Testi'

    const databaseError = new Error('Database failed')

    queryMock.mockRejectedValueOnce(databaseError)

    await createGroupList(req, res, next)

    expect(next).toHaveBeenCalledWith(databaseError)
  })
})