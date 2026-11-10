import { useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthProvider";

export default function AuthOverlay({ onClose }) {
	const { login, register } = useAuth();
	const [mode, setMode] = useState("login");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setSubmitting(true);

		try {
			if (mode === "login") {
				await login(email, password);
			} else {
				await register(username, email, password);
			}
			onClose();
		} catch (requestError) {
			setError(
				requestError instanceof axios.AxiosError
					? requestError.response?.data?.error || "Authentication failed"
					: "Authentication failed",
			);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
			<div className="w-full max-w-md rounded-xl bg-gray-800 p-6 text-white shadow-2xl">
				<div className="mb-5 flex items-center justify-between">
					<h2 className="text-xl font-bold">
						{mode === "login" ? "Kirjaudu" : "Rekisteröidy"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-2xl text-gray-400 hover:text-white"
						aria-label="Sulje"
					>
						&times;
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{mode === "register" && (
						<input
							required
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							placeholder="Käyttäjänimi"
							className="w-full rounded-lg bg-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
						/>
					)}
					<input
						required
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						placeholder="Sähköposti"
						className="w-full rounded-lg bg-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
					/>
					<input
						required
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						placeholder="Salasana"
						className="w-full rounded-lg bg-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
					/>
					{error && <p className="text-sm text-red-400">{error}</p>}
					<button
						type="submit"
						disabled={submitting}
						className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold hover:bg-indigo-700 disabled:opacity-50"
					>
						{submitting ? "Ladataan..." : mode === "login" ? "Kirjaudu" : "Rekisteröidy"}
					</button>
				</form>

				<button
					type="button"
					onClick={() => {
						setMode(mode === "login" ? "register" : "login");
						setError("");
					}}
					className="mt-4 text-sm text-indigo-300 hover:text-indigo-200"
				>
					{mode === "login"
						? "Eikö sinulla ole tiliä? Rekisteröidy"
						: "Onko sinulla jo tili? Kirjaudu"}
				</button>
			</div>
		</div>
	);
}
