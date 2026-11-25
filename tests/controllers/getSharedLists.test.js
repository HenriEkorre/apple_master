import { beforeEach, describe, expect, it, vi } from 'vitest'

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}))

vi.mock('../../api/models/db.js', () => ({
  pool: {
    query: queryMock,
  },
}))

const {
  getSharedLists,
} = await import('../../api/controllers/listController.js')

describe('getSharedLists - käyttäjälle ryhmien kautta näkyvät listat', () => {
  let req
  let res
  let next

  beforeEach(() => {
    queryMock.mockReset()

    req = {
      user: { id: 1 },
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }

    next = vi.fn()
  })

  // Testaa tyhjän vastauksen, kun käyttäjälle ei ole jaettu listoja
  it('palauttaa tyhjän taulukon kun jaettuja listoja ei ole', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    expect(queryMock).toHaveBeenCalledOnce()
    expect(queryMock).toHaveBeenCalledWith(
      expect.any(String),
      [1],
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa ryhmän omistaman listan palauttamisen nykyisen toiminnan mukaisesti
  it('palauttaa ryhmän omistaman listan', async () => {
    const rows = [{
      id: 5,
      title: 'Ryhmän katsottavat',
      owner_type: 'group',
      owner_id: 2,
      visibility: 'private',
      group_name: 'Elokuvakerho',
      owner_name: null,
      is_group_owned: true,
      movie_count: 4,
    }]

    queryMock.mockResolvedValueOnce({ rows })

    await getSharedLists(req, res, next)

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('l.owner_type = \'group\''),
      [1],
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(rows)
  })

  // Testaa käyttäjän omistaman shared-listan palauttamisen
  it('palauttaa käyttäjän ryhmälle jakaman listan', async () => {
    const rows = [{
      id: 12,
      title: 'Viikonlopun elokuvat',
      owner_type: 'user',
      owner_id: 7,
      visibility: 'shared',
      group_name: 'Elokuvakerho',
      owner_name: 'matti',
      is_group_owned: false,
      movie_count: 2,
    }]

    queryMock.mockResolvedValueOnce({ rows })

    await getSharedLists(req, res, next)

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('l.visibility = \'shared\''),
      [1],
    )
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('JOIN list_groups'),
      [1],
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(rows)
  })

  // Testaa molempien listatyyppien palauttamisen samassa vastauksessa
  it('palauttaa ryhmälistat ja jaetut käyttäjälistat samassa vastauksessa', async () => {
    const rows = [
      {
        id: 5,
        title: 'Ryhmän katsottavat',
        owner_type: 'group',
        owner_id: 2,
        visibility: 'private',
        group_name: 'Elokuvakerho',
        owner_name: null,
        is_group_owned: true,
        movie_count: 4,
      },
      {
        id: 12,
        title: 'Viikonlopun elokuvat',
        owner_type: 'user',
        owner_id: 7,
        visibility: 'shared',
        group_name: 'Elokuvakerho, Kaveriporukka',
        owner_name: 'matti',
        is_group_owned: false,
        movie_count: 2,
      },
    ]

    queryMock.mockResolvedValueOnce({ rows })

    await getSharedLists(req, res, next)

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UNION ALL'),
      [1],
    )
    expect(res.json).toHaveBeenCalledWith(rows)
  })

  // Testaa, että kysely edellyttää aktiivista ryhmäjäsenyyttä
  it('hakee listat vain aktiivisten ryhmäjäsenyyksien kautta', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    const [sql, parameters] = queryMock.mock.calls[0]

    expect(sql.match(/gm\.status = 'active'/g)).toHaveLength(2)
    expect(parameters).toEqual([1])
    expect(res.status).toHaveBeenCalledWith(200)
  })

  // Testaa, ettei käyttäjän oma shared-lista tule jaettujen listojen osioon
  it('jättää käyttäjän oman shared-listan pois jaetuista listoista', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('l.owner_id <> $1'),
      [1],
    )
  })

  // Testaa, että sama jaettu käyttäjälista ryhmitellään yhdeksi tulokseksi
  it('estää saman käyttäjälistan palautumisen useita kertoja', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id: 12,
        title: 'Yhteiset suosikit',
        owner_type: 'user',
        owner_id: 7,
        visibility: 'shared',
        group_name: 'Elokuvakerho, Kaveriporukka',
        owner_name: 'matti',
        is_group_owned: false,
        movie_count: 3,
      }],
    })

    await getSharedLists(req, res, next)

    const [sql] = queryMock.mock.calls[0]

    expect(sql).toContain('STRING_AGG')
    expect(sql).toContain('DISTINCT g.name')
    expect(sql).toContain('GROUP BY')
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 12,
        group_name: 'Elokuvakerho, Kaveriporukka',
      }),
    ])
  })

  // Testaa elokuvien määrän sisällyttämisen molemmille listatyypeille
  it('sisältää movie_count-kentän molemmille listatyypeille', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    const [sql] = queryMock.mock.calls[0]
    const movieCountMatches = sql.match(/AS movie_count/g)

    expect(movieCountMatches).toHaveLength(2)
  })

  // Testaa, ettei yksityisiä käyttäjälistoja sisällytetä tuloksiin
  it('hakee käyttäjälistoista vain shared-näkyvyydellä jaetut listat', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    const [sql, parameters] = queryMock.mock.calls[0]

    expect(sql).toContain('l.owner_type = \'user\'')
    expect(sql).toContain('l.visibility = \'shared\'')
    expect(parameters).toEqual([1])
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että ryhmäjäsenyyden ja listan jakoryhmän pitää vastata toisiaan
  it('rajaa jaetut käyttäjälistat käyttäjän omiin aktiivisiin ryhmiin', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    const [sql, parameters] = queryMock.mock.calls[0]

    expect(sql).toContain('JOIN list_groups')
    expect(sql).toContain('JOIN group_members')
    expect(sql).toMatch(/gm\.group_id\s*=\s*lg\.group_id/)
    expect(sql).toContain('gm.status = \'active\'')
    expect(parameters).toEqual([1])
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei pending-jäsenyys oikeuta jaettujen listojen hakemiseen
  it('ei hyväksy odottavaa ryhmäjäsenyyttä', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    const [sql] = queryMock.mock.calls[0]
    const activeMembershipChecks = sql.match(/gm\.status = 'active'/g) ?? []

    expect(activeMembershipChecks).toHaveLength(2)
    expect(sql).not.toMatch(/gm\.status\s*=\s*'pending'/)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että käyttäjän oma lista rajataan pois vain käyttäjälistojen osiosta
  it('rajaa oman shared-listan pois mutta säilyttää käyttäjän ryhmälistat', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    const [sql] = queryMock.mock.calls[0]
    const sections = sql.split('UNION ALL')

    expect(sections).toHaveLength(2)
    expect(sections[0]).toContain('l.owner_type = \'group\'')
    expect(sections[0]).not.toContain('l.owner_id <> $1')
    expect(sections[1]).toContain('l.owner_type = \'user\'')
    expect(sections[1]).toContain('l.owner_id <> $1')
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa movie_count-arvon laskemisen erillisellä alikyselyllä
  it('laskee listan elokuvat ilman jakoryhmien aiheuttamia duplikaatteja', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    const [sql] = queryMock.mock.calls[0]
    const movieCountSubqueries = sql.match(
      /SELECT\s+COUNT\(\*\)\s+FROM\s+list_movies\s+lm\s+WHERE\s+lm\.list_id\s*=\s*l\.id/gi,
    ) ?? []

    expect(movieCountSubqueries).toHaveLength(2)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa listojen vakaan järjestyksen nykyisen toiminnan mukaisesti
  it('järjestää jaetut listat vanhimmasta uusimpaan', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getSharedLists(req, res, next)

    const [sql] = queryMock.mock.calls[0]

    expect(sql).toMatch(
      /ORDER BY\s+shared_lists\.created_at\s+ASC,\s+shared_lists\.id\s+ASC/i,
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa vastauksen rakenteen usealla eri listatyypillä
  it('säilyttää listatyyppien erottelukentät vastauksessa', async () => {
    const rows = [
      {
        id: 5,
        title: 'Ryhmälista',
        owner_type: 'group',
        owner_id: 2,
        visibility: 'private',
        group_name: 'Elokuvakerho',
        owner_name: null,
        is_group_owned: true,
        movie_count: 0,
      },
      {
        id: 12,
        title: 'Jaettu käyttäjälista',
        owner_type: 'user',
        owner_id: 7,
        visibility: 'shared',
        group_name: 'Elokuvakerho',
        owner_name: 'matti',
        is_group_owned: false,
        movie_count: 0,
      },
    ]

    queryMock.mockResolvedValueOnce({ rows })

    await getSharedLists(req, res, next)

    expect(queryMock).toHaveBeenCalledOnce()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledOnce()
    expect(res.json).toHaveBeenCalledWith(rows)
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa tietokantavirheen välittämisen next-funktiolle
  it('välittää tietokantavirheen next-funktiolle', async () => {
    const databaseError = new Error('Database failed')
    queryMock.mockRejectedValueOnce(databaseError)

    await getSharedLists(req, res, next)

    expect(queryMock).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })
})
