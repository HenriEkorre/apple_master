import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthProvider";

export default function Header({ onOpenAuth }) {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const navigate = useNavigate();
	const { user, logout } = useAuth();

	// Live-haku: tekee pyynnön aina kun query muuttuu (pienellä viiveellä)
	useEffect(() => {
		if (query.trim() === "") {
			setSuggestions([]);
			return;
		}

		const delayDebounceFn = setTimeout(() => {
			axios
				.get(`/api/movies/search?q=${encodeURIComponent(query.trim())}`)
				.then((response) => {
					setSuggestions(response.data.slice(0, 3));
				})
				.catch((error) => {
					console.error("Virhe ehdotusten haussa:", error);
				});
		}, 300);

		return () => clearTimeout(delayDebounceFn);
	}, [query]);

	const handleSearch = (e) => {
		e.preventDefault();
		if (!query.trim()) return;

		setSuggestions([]);
		navigate(`/search?q=${encodeURIComponent(query.trim())}`);
	};

	return (
		<header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
			{/* 1. Logo / Teksti, joka vie aina etusivulle */}
			<Link
				to="/"
				className="md:hidden font-bold text-sm tracking-wider text-gray-900 dark:text-white shrink-0 hover:text-indigo-500 transition"
			>
				apple_master
			</Link>

			{/* 2. Hakukenttä ja live-ehdotukset */}
			<div className="relative flex-1 max-w-md">
				<form onSubmit={handleSearch} className="flex items-center w-full">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Hae elokuvaa..."
						className="w-full px-3 py-1.5 md:px-4 md:py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
					/>
					<button
						type="submit"
						className="ml-2 px-3 py-1.5 md:px-4 md:py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer shrink-0"
					>
						<svg
							className="size-5 fill-none stroke-current"
							viewBox="0 0 24 24"
							strokeWidth="2"
							aria-hidden="true"
						>
							<circle cx="11" cy="11" r="6" />
							<path d="m16 16 4 4" />
						</svg>
					</button>
				</form>

				{/* Live-ehdotukset (Dropdown) */}
				{suggestions.length > 0 && (
					<div className="absolute left-0 right-14 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
						{suggestions.map((movie) => (
							<Link
								key={movie.id}
								to={`/movie/${movie.id}`}
								onClick={() => {
									setSuggestions([]);
									setQuery("");
								}}
								className="flex items-center gap-3 p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition border-b border-gray-100 dark:border-gray-800 last:border-none"
							>
								<img
									src={
										movie.poster_path
											? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
											: "https://via.placeholder.com/40x60?text=Ei+kuvaa"
									}
									alt={movie.title}
									className="w-8 h-12 object-cover rounded shadow"
								/>
								<div className="flex-1 min-w-0">
									<h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
										{movie.title}
									</h4>
									<p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
										{movie.release_date
											? movie.release_date.split("-")[0]
											: "Ei vuotta"}
									</p>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>

			<div className="hidden items-center gap-2 md:flex">
				{user && (
					<button
						type="button"
						onClick={logout}
						className="shrink-0 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-600"
					>
						Kirjaudu ulos
					</button>
				)}
			</div>
		</header>
	);
}
