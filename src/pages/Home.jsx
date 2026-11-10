import React, { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";

export default function Home() {
	const [movies, setMovies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		// Haetaan data backendistä
		fetch("/api/movies/popular")
			.then((response) => {
				if (!response.ok) {
					throw new Error("Elokuvien haku backendistä epäonnistui");
				}
				return response.json();
			})
			.then((data) => {
				setMovies(data);
				setLoading(false);
			})
			.catch((err) => {
				console.error("Virhe:", err);
				setError(err.message);
				setLoading(false);
			});
	}, []);

	if (loading) {
		return (
			<div className="text-white text-center py-10">
				Ladataan suosittuja elokuvia...
			</div>
		);
	}

	if (error) {
		return <div className="text-red-500 text-center py-10">Virhe: {error}</div>;
	}

	return (
		<div>
			<h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white ">
				Suositut elokuvat
			</h2>

			{/* Korttiruudukko */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
				{movies.map((movie) => (
					<MovieCard key={movie.id} movie={movie} />
				))}
			</div>
		</div>
	);
}
