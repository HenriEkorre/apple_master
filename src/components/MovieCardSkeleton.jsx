// Latausanimaatio, joka näyttää MovieCard-kortin muotoiselta paikkamerkiltä
export default function MovieCardSkeleton() {
  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg flex flex-col animate-pulse"
      aria-hidden="true"
    >
      {/* Juliste */}
      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700" />

      {/* Tiedot */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Otsikko */}
          <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
          {/* Vuosi */}
          <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700 mt-2 mb-3" />

          {/* Arviot */}
          <div className="space-y-2 bg-gray-100 dark:bg-gray-700/40 p-2.5 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>

        {/* Painike */}
        <div className="mt-4 h-8 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  )
}
