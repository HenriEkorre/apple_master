// Latausanimaatio, joka jäljittelee MovieDetails-sivun asettelua
export default function MovieDetailsSkeleton() {
  return (
    <div
      className="max-w-4xl mx-auto p-6 animate-pulse"
      aria-busy="true"
    >
      {/* Ruudunlukijoille */}
      <span className="sr-only">Ladataan elokuvan tietoja...</span>

      {/* Takaisin-painike */}
      {/* Sama teksti ja samat luokat kuin oikeassa linkissä, mutta läpinäkyvä teksti, jotta koko täsmää tarkasti */}
      <span
        className="text-sm border border-transparent bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg text-transparent font-semibold mb-6 inline-flex items-center gap-2 select-none"
        aria-hidden="true"
      >
        ← Takaisin
      </span>

      <div
        className="flex flex-col md:flex-row gap-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
        aria-hidden="true"
      >
        {/* Juliste */}
        <div className="w-full md:w-72 aspect-[2/3] shrink-0 rounded-xl bg-gray-200 dark:bg-gray-700" />

        {/* Tiedot */}
        <div className="flex-1">
          {/* Otsikko */}
          <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
          {/* Tagline */}
          <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 mb-6" />

          {/* Metatiedot: julkaisupäivä, kesto, arvosana */}
          <div className="flex flex-wrap gap-4 mb-5">
            <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Genret */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-6 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Juoni */}
          <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
          <div className="space-y-2.5">
            <div className="h-3.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3.5 w-11/12 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3.5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  )
}
