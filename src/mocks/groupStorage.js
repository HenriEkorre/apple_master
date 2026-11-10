const STORAGE_KEY = 'apple_master_groups'

const DEFAULT_GROUPS = [
  {
    id: 1,
    name: "Perjantain leffakerho",
    description: "Katsotaan ja arvioidaan viikonlopun uutuuselokuvia yhdessä. Perinteet kunniaan!",
    type: "public",
    membersCount: 8,
    isMember: true,
    members: [
      { id: 1, username: "Matti (Admin)", role: "admin" },
      { id: 2, username: "Anna", role: "member" },
      { id: 3, username: "Juha", role: "member" },
      { id: 4, username: "Sinä", role: "member" }
    ],
    movies: [
      { id: 550, title: "Fight Club", release_date: "1999", poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg" },
      { id: 278, title: "The Shawshank Redemption", release_date: "1994", poster_path: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg" },
      { id: 238, title: "The Godfather", release_date: "1972", poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg" }
    ]
  },
  {
    id: 2,
    name: "Kauhuefektit & Klassikot",
    description: "Vain 80- ja 90-luvun kauhuelokuvien ystäville. Ei herkkähipiäisille!",
    type: "closed",
    membersCount: 15,
    isMember: false,
    members: [
      { id: 5, username: "Teemu (Admin)", role: "admin" },
      { id: 6, username: "Laura", role: "member" },
      { id: 7, username: "Ville", role: "member" }
    ],
    movies: [
      { id: 539, title: "Psycho", release_date: "1960", poster_path: "/yz4QVv8macBii1QXODKCnsyWpZu.jpg" },
      { id: 348, title: "Alien", release_date: "1979", poster_path: "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg" }
    ]
  },
  {
    id: 3,
    name: "Sci-Fi & Avaruusmatkat",
    description: "Sukellukset tähtien taakse, kyberpunk ja tulevaisuuden visiot.",
    type: "public",
    membersCount: 22,
    isMember: true,
    members: [
      { id: 4, username: "Sinä", role: "admin" },
      { id: 8, username: "Kari", role: "member" }
    ],
    movies: [
      { id: 157336, title: "Interstellar", release_date: "2014", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg" },
      { id: 27205, title: "Inception", release_date: "2010", poster_path: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg" },
      { id: 11, title: "Star Wars", release_date: "1977", poster_path: "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg" }
    ]
  },
  {
    id: 4,
    name: "Sunnuntain Animation & Feelgood",
    description: "Pehmoisia animaatioita ja hyvän mielen klassikoita sunnuntai-iltoihin.",
    type: "public",
    membersCount: 11,
    isMember: false,
    members: [
      { id: 9, username: "Sofia (Admin)", role: "admin" },
      { id: 10, username: "Eero", role: "member" }
    ],
    movies: [
      { id: 129, title: "Spirited Away", release_date: "2001", poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg" },
      { id: 128, title: "Princess Mononoke", release_date: "1997", poster_path: "/jHunhhjUGqglDntaqR7bT5u2oox.jpg" }
    ]
  },
  {
    id: 5,
    name: "Oscar-voittajat & Draama",
    description: "Syvällisiä tarinoita ja palkittuja mestariteoksia elokuvataiteen huipulta.",
    type: "closed",
    membersCount: 19,
    isMember: true,
    members: [
      { id: 4, username: "Sinä", role: "member" },
      { id: 11, username: "Elina (Admin)", role: "admin" }
    ],
    movies: [
      { id: 496243, title: "Parasite", release_date: "2019", poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
      { id: 13, title: "Forrest Gump", release_date: "1994", poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg" }
    ]
  }
]

// Hae ryhmät localStoragesta (tai palauta oletukset)
export const getStoredGroups = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GROUPS))
    return DEFAULT_GROUPS
  }
  return JSON.parse(saved)
}

// Tallenna ryhmät
export const saveGroups = (groups) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
}