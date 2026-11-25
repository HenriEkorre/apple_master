import { beforeEach, describe, expect, it, vi } from 'vitest'

const { queryMock, axiosGetMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  axiosGetMock: vi.fn(),
}))

vi.mock('../../api/models/db.js', () => ({
  pool: {
    query: queryMock,
  },
}))

vi.mock('axios', () => ({
  default: {
    get: axiosGetMock,
  },
}))

const {
  getListById,
} = await import('../../api/controllers/listController.js')

describe('getListById - käyttäjälistan jakaminen', () => {
  let req
  let res
  let next

  beforeEach(() => {
    queryMock.mockReset()
    axiosGetMock.mockReset()

    req = {
      user: { id: 1 },
      params: { id: '12' },
    }

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }

    next = vi.fn()
  })

  // Testaa listan tunnuksen validoinnin ennen tietokantahakua
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

    await getListById(req, res, next)

    expect(queryMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Virheellinen listan tunnus',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa omistajan yksityisen listan ja hallintaoikeuden
  it('palauttaa omistajan yksityisen listan', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Omat elokuvat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
          can_manage: true,
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('l.owner_type = \'user\''),
      [12, 1],
    )
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM list_groups'),
      [12, 1, true],
    )
    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM list_movies'),
      [12],
    )
    expect(axiosGetMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      id: 12,
      title: 'Omat elokuvat',
      owner_type: 'user',
      owner_id: 1,
      visibility: 'private',
      can_manage: true,
      groups: [],
      movies: [],
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa omistajalle kaikkien jaettujen ryhmien palauttamisen
  it('palauttaa omistajalle kaikki jaetun listan ryhmät', async () => {
    const groups = [
      { id: 2, name: 'Elokuvakerho' },
      { id: 5, name: 'Kaveriporukka' },
    ]

    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Viikonlopun elokuvat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'shared',
          can_manage: true,
        }],
      })
      .mockResolvedValueOnce({ rows: groups })
      .mockResolvedValueOnce({ rows: [] })

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('$3::boolean = true'),
      [12, 1, true],
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      visibility: 'shared',
      can_manage: true,
      groups,
      movies: [],
    }))
  })

  // Testaa jaetun listan aktiivisen ryhmäjäsenen katseluoikeuden
  it('palauttaa jaetun listan aktiiviselle ryhmäjäsenelle', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Elokuvavinkit',
          owner_type: 'user',
          owner_id: 7,
          visibility: 'shared',
          can_manage: false,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 2, name: 'Elokuvakerho' }],
      })
      .mockResolvedValueOnce({ rows: [] })

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('l.visibility = \'shared\''),
      [12, 1],
    )
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('gm.status = \'active\''),
      [12, 1, false],
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      owner_id: 7,
      visibility: 'shared',
      can_manage: false,
      groups: [{ id: 2, name: 'Elokuvakerho' }],
    }))
  })

  // Testaa tietovuodon eston: katselijalle palautetaan vain yhteinen ryhmä
  it('ei paljasta katselijalle muiden jakoryhmien nimiä', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Jaettu lista',
          owner_type: 'user',
          owner_id: 7,
          visibility: 'shared',
          can_manage: false,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 2, name: 'Elokuvakerho' }],
      })
      .mockResolvedValueOnce({ rows: [] })

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('OR EXISTS'),
      [12, 1, false],
    )
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      groups: [{ id: 2, name: 'Elokuvakerho' }],
    }))
    expect(res.json).not.toHaveBeenCalledWith(expect.objectContaining({
      groups: expect.arrayContaining([
        expect.objectContaining({ name: 'Salainen ryhmä' }),
      ]),
    }))
  })

  // Testaa, ettei käyttöoikeudettomalle käyttäjälle palauteta listaa
  it('palauttaa 404 kun käyttäjällä ei ole listan katseluoikeutta', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenCalledOnce()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Listaa ei löytynyt',
    })
    expect(axiosGetMock).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa listan elokuvien hakemisen TMDB:stä
  it('palauttaa listan elokuvat uusimmasta vanhimpaan', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Katsottavat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
          can_manage: true,
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          { tmdb_movie_id: 101 },
          { tmdb_movie_id: 202 },
        ],
      })

    axiosGetMock
      .mockResolvedValueOnce({
        data: {
          id: 101,
          title: 'Ensimmäinen elokuva',
          poster_path: '/first.jpg',
          release_date: '2025-01-01',
          vote_average: 8.1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 202,
          title: 'Toinen elokuva',
          poster_path: '/second.jpg',
          release_date: '2024-01-01',
          vote_average: 7.2,
        },
      })

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('ORDER BY added_at DESC, id DESC'),
      [12],
    )
    expect(axiosGetMock).toHaveBeenNthCalledWith(
      1,
      'https://api.themoviedb.org/3/movie/101',
      expect.objectContaining({
        params: expect.objectContaining({ language: 'fi-FI' }),
        timeout: 8000,
      }),
    )
    expect(axiosGetMock).toHaveBeenNthCalledWith(
      2,
      'https://api.themoviedb.org/3/movie/202',
      expect.any(Object),
    )
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      movies: [
        {
          id: 101,
          title: 'Ensimmäinen elokuva',
          poster_path: '/first.jpg',
          release_date: '2025-01-01',
          vote_average: 8.1,
        },
        {
          id: 202,
          title: 'Toinen elokuva',
          poster_path: '/second.jpg',
          release_date: '2024-01-01',
          vote_average: 7.2,
        },
      ],
    }))
  })

  // Testaa paikkamerkin, jos yksittäisen elokuvan TMDB-haku epäonnistuu
  it('palauttaa paikkamerkin kun elokuvan tietoja ei saada', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Katsottavat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
          can_manage: true,
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ tmdb_movie_id: 404 }],
      })

    axiosGetMock.mockRejectedValueOnce(new Error('TMDB failed'))

    await getListById(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      movies: [{
        id: 404,
        title: null,
        unavailable: true,
      }],
    }))
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei odottava ryhmäjäsen saa nähdä jaettua listaa
  it('palauttaa 404 jaetulle listalle kun ryhmäjäsenyys ei ole aktiivinen', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenCalledOnce()
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('gm.status = \'active\''),
      [12, 1],
    )
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Listaa ei löytynyt',
    })
    expect(axiosGetMock).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, että yhden yhteisen ryhmän jäsenyys riittää usealle ryhmälle jaetun listan katseluun
  it('palauttaa listan kun käyttäjä kuuluu yhteen listan jaetuista ryhmistä', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Usealle ryhmälle jaettu lista',
          owner_type: 'user',
          owner_id: 7,
          visibility: 'shared',
          can_manage: false,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 5, name: 'Yhteinen ryhmä' }],
      })
      .mockResolvedValueOnce({ rows: [] })

    await getListById(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: 12,
      can_manage: false,
      groups: [{ id: 5, name: 'Yhteinen ryhmä' }],
      movies: [],
    }))
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa, ettei oikeudettomalle käyttäjälle haeta ryhmiä tai elokuvia
  it('pysäyttää käsittelyn käyttöoikeustarkistukseen', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(1)
    expect(axiosGetMock).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Listaa ei löytynyt',
    })
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa ryhmien hakemisen tietokantavirheen
  it('välittää ryhmien hakemisen tietokantavirheen next-funktiolle', async () => {
    const databaseError = new Error('Group query failed')

    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Jaettu lista',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'shared',
          can_manage: true,
        }],
      })
      .mockRejectedValueOnce(databaseError)

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(2)
    expect(axiosGetMock).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa elokuvien hakemisen tietokantavirheen
  it('välittää elokuvien hakemisen tietokantavirheen next-funktiolle', async () => {
    const databaseError = new Error('Movie query failed')

    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Omat elokuvat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
          can_manage: true,
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockRejectedValueOnce(databaseError)

    await getListById(req, res, next)

    expect(queryMock).toHaveBeenCalledTimes(3)
    expect(axiosGetMock).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  // Testaa, että yhden TMDB-haun virhe ei estä muiden elokuvien palauttamista
  it('palauttaa muut elokuvat vaikka yhden elokuvan TMDB-haku epäonnistuu', async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [{
          id: 12,
          title: 'Katsottavat',
          owner_type: 'user',
          owner_id: 1,
          visibility: 'private',
          can_manage: true,
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          { tmdb_movie_id: 101 },
          { tmdb_movie_id: 404 },
        ],
      })

    axiosGetMock
      .mockResolvedValueOnce({
        data: {
          id: 101,
          title: 'Saatavilla oleva elokuva',
          poster_path: '/available.jpg',
          release_date: '2025-01-01',
          vote_average: 8,
        },
      })
      .mockRejectedValueOnce(new Error('TMDB failed'))

    await getListById(req, res, next)

    expect(axiosGetMock).toHaveBeenCalledTimes(2)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      movies: [
        {
          id: 101,
          title: 'Saatavilla oleva elokuva',
          poster_path: '/available.jpg',
          release_date: '2025-01-01',
          vote_average: 8,
        },
        {
          id: 404,
          title: null,
          unavailable: true,
        },
      ],
    }))
    expect(next).not.toHaveBeenCalled()
  })

  // Testaa tietokantavirheen välittämisen next-funktiolle
  it('välittää tietokantavirheen next-funktiolle', async () => {
    const databaseError = new Error('Database failed')
    queryMock.mockRejectedValueOnce(databaseError)

    await getListById(req, res, next)

    expect(next).toHaveBeenCalledWith(databaseError)
    expect(res.status).not.toHaveBeenCalled()
  })
})
