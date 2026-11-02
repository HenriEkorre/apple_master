import MovieCard from "../components/MovieCard";


// esimerkkidataa kokeiluun
const sampleMovies = [
  {
    id: 1,
    title: 'Inception',
    vote_average: 8.8,
    friends_average: 8.0,
    release_date: '2010-07-16',
    poster_path: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg'
  },
  {
    id: 2,
    title: 'Interstellar',
    vote_average: 8.7,
    friends_average: 8.3,
    release_date: '2014-11-05',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'
  },
  {
    id: 3,
    title: 'Dune: Part Two',
    vote_average: 8.5,
    friends_average: 7.,
    release_date: '2024-02-27',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'
  }
]

export default function Home() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white">Suositut elokuvat</h2>
      
      {/* Korttiruudukko */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {sampleMovies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  )
}