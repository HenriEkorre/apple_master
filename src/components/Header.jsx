export default function Header() {
  return (
    <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center w-full max-w-md">
        {/* Hakukenttä */}
        <input 
          type="text" 
          placeholder="Kirjoita elokuvan nimi..." 
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Hae
        </button>
      </div>
    </header>
  )
}