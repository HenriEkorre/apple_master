export default function MovieCard({ movie }) {
  const imageUrl = movie.poster_path?.startsWith('http')
    ? movie.poster_path
    : movie.poster_path 
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
      : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=80'

  // Esimerkkiarvot: myöhemmin suoraan propsina tai API
  const worldRating = movie.vote_average ? movie.vote_average.toFixed(1) : '-'
  const friendsRating = movie.friends_average ? movie.friends_average.toFixed(1) : 'Ei arvioita'

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700/60 hover:border-indigo-500 transition-all duration-300 flex flex-col group">
      {/* Elokuvan juliste / Kuva */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
        <img 
          src={imageUrl} 
          alt={movie.title || movie.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

      </div>

      {/* Tiedot */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-semibold text-white text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {movie.title || movie.name}
          </h3>
          <p className="text-xs text-gray-400 mt-1 mb-3">
            {movie.release_date ? movie.release_date.split('-')[0] : 'Ei julkaisupäivää'}
          </p>

          {/* Arviot eriteltynä */}
          <div className="space-y-1.5 bg-gray-900/50 p-2.5 rounded-lg border border-gray-700/50 text-xs">
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Kaikki:</span>
              <span className="font-semibold text-amber-400">⭐ {worldRating} / 10</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-400">Kaverit:</span>
              <span className="font-semibold text-indigo-400">👥 {friendsRating}</span>
            </div>
          </div>
        </div>

        <button className="mt-4 w-full py-2 bg-gray-700/50 hover:bg-indigo-600 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition">
          Katso tiedot
        </button>
      </div>
    </div>
  )
}