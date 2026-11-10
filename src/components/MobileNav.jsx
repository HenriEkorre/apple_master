import { Link } from "react-router-dom";
import { useAuth } from "../AuthProvider";

export default function MobileNav({ onOpenAuth }) {
	const { user } = useAuth();
	const initial = (user?.username || user?.email || "?")
		.trim()
		.charAt(0)
		.toUpperCase();

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-200 bg-white px-1 py-2 text-xs shadow-2xl dark:border-gray-800 dark:bg-gray-900 md:hidden">
			<Link
				to="/"
				className="flex flex-col items-center p-1 text-gray-700 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400"
			>
				<svg
					className="size-5 fill-current"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d="m12 3 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9l9-8Z" />
				</svg>
				<span className="mt-0.5 text-[10px]">Etusivu</span>
			</Link>
			<Link
				to="/search"
				className="flex flex-col items-center p-1 text-gray-700 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400"
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
				<span className="mt-0.5 text-[10px]">Haku</span>
			</Link>
			<Link
				to="/favorites"
				className="flex flex-col items-center p-1 text-gray-700 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400"
			>
				<svg
					className="size-5 fill-current"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0 1 15.5 4 4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" />
				</svg>
				<span className="mt-0.5 text-[10px]">Suosikit</span>
			</Link>
			<Link
				to="/groups"
				className="flex flex-col items-center p-1 text-gray-700 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400"
			>
				<svg
					className="size-5 fill-current"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path d="M16 11a4 4 0 1 0-3.99-4A4 4 0 0 0 16 11Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4ZM8 13c-2.33 0-7 1.17-7 3.5V19h5v-2c0-1.11.59-2.08 1.51-2.72A7.6 7.6 0 0 1 12 13.18 11.6 11.6 0 0 0 8 13Z" />
				</svg>
				<span className="mt-0.5 text-[10px]">Ryhmät</span>
			</Link>
			{user ? (
				<Link
					to="/profile"
					className="flex min-w-0 flex-col items-center p-1 text-gray-700 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400"
				>
					<span className="flex size-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
						{initial}
					</span>
					<span className="mt-0.5 max-w-16 truncate text-[10px]">
						{user.username || user.email}
					</span>
				</Link>
			) : (
				<button
					type="button"
					onClick={onOpenAuth}
					className="flex flex-col items-center p-1 text-gray-700 hover:text-indigo-500 dark:text-gray-300 dark:hover:text-indigo-400"
				>
					<svg
						className="size-5 fill-current"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
					</svg>
					<span className="mt-0.5 text-[10px]">Kirjaudu</span>
				</button>
			)}
		</nav>
	);
}
