import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../AuthProvider";
import { UsersIcon } from "./Icons";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";

// Backend palauttaa virheen joko muodossa { message } tai { error } / { error: { message } }
const getMessage = (err, fallback) => {
	const data = err.response?.data;
	return (
		data?.message ||
		(typeof data?.error === "string" ? data.error : data?.error?.message) ||
		fallback
	);
};

const formatDate = (value) =>
	value ? new Date(value).toLocaleDateString("fi-FI") : "";

export default function MovieReviews({ movieId }) {
	const { user } = useAuth();

	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Oman arvostelun muokkaus
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState(null);

	// Oman arvostelun poisto
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState(null);

	// Ohitetaan vanhentuneet vastaukset (esim. elokuva vaihtuu kesken latauksen)
	const requestIdRef = useRef(0);

	const loadReviews = useCallback(
		async (showSpinner = true) => {
			const requestId = ++requestIdRef.current;

			try {
				if (showSpinner) setLoading(true);
				setError(null);
				const response = await axios.get(`/api/reviews/movie/${movieId}`, {
					withCredentials: true,
				});
				if (requestId !== requestIdRef.current) return;
				setData(response.data);
			} catch (err) {
				console.error("Virhe arvostelujen haussa:", err);
				if (requestId === requestIdRef.current) {
					setError("Arvostelujen lataaminen epäonnistui.");
				}
			} finally {
				if (showSpinner && requestId === requestIdRef.current)
					setLoading(false);
			}
		},
		[movieId],
	);

	// Haetaan uudelleen, kun elokuva tai käyttäjä vaihtuu (kirjautuminen näyttää oman arvostelun)
	useEffect(() => {
		setIsEditing(false);
		setFormError(null);
		setIsDeleteOpen(false);
		loadReviews();
	}, [loadReviews, user?.id]);

	// Poistovahvistuksen sulkeminen Escape-näppäimellä (ei kesken poiston)
	useEffect(() => {
		if (!isDeleteOpen) return;

		const handleKeyDown = (e) => {
			if (e.key === "Escape" && !deleting) closeDeleteModal();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isDeleteOpen, deleting]);

	const closeDeleteModal = () => {
		setIsDeleteOpen(false);
		setDeleteError(null);
	};

	// Luo uusi tai päivitä oma arvostelu
	const handleSave = async ({ rating, comment }) => {
		try {
			setSaving(true);
			setFormError(null);
			await axios.put(
				`/api/reviews/movie/${movieId}`,
				{ rating, comment },
				{ withCredentials: true },
			);
			setIsEditing(false);
			await loadReviews(false); // päivittää myös keskiarvon
		} catch (err) {
			console.error("Virhe arvostelun tallennuksessa:", err);
			setFormError(getMessage(err, "Arvostelun tallennus epäonnistui"));
		} finally {
			setSaving(false);
		}
	};

	// Poista oma arvostelu (vahvistuksen jälkeen)
	const handleDelete = async () => {
		try {
			setDeleting(true);
			setDeleteError(null);
			await axios.delete(`/api/reviews/movie/${movieId}`, {
				withCredentials: true,
			});
			setIsDeleteOpen(false);
			setIsEditing(false);
			await loadReviews(false);
		} catch (err) {
			console.error("Virhe arvostelun poistossa:", err);
			setDeleteError(getMessage(err, "Arvostelun poisto epäonnistui"));
		} finally {
			setDeleting(false);
		}
	};

	const myReview = data?.my_review || null;
	const others = data?.reviews || [];
	const groupReviews = data?.group_reviews || [];
	const summary = data?.summary;
	const reviewCount = summary?.review_count ?? 0;
	const averageRating = summary?.average_rating;

	const renderReview = (
		review,
		isOwn,
		groupName = null,
		keyPrefix = "review",
	) => (
		<li
			key={`${keyPrefix}-${review.id}`}
			className={`rounded-xl p-4 border ${
				isOwn
					? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-500/40"
					: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
			}`}
		>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<span className="font-semibold truncate">{review.username}</span>
					{isOwn && (
						<span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-600 text-white shrink-0">
							Sinun arvostelusi
						</span>
					)}
					{groupName && (
						<span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 shrink-0">
							<UsersIcon className="size-3" />
						</span>
					)}
				</div>
				<span className="text-xs text-gray-500 dark:text-gray-400">
					{formatDate(review.created_at)}
				</span>
			</div>

			<div className="mt-2 flex items-center gap-2">
				<StarRating value={review.rating} size="sm" />
				<span className="text-sm font-semibold">{review.rating} / 5</span>
			</div>

			{review.comment && (
				<p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
					{review.comment}
				</p>
			)}

			{/* Muokkaus ja poisto vain omassa arvostelussa */}
			{isOwn && (
				<div className="mt-3 flex gap-2">
					<button
						type="button"
						onClick={() => {
							setFormError(null);
							setIsEditing(true);
						}}
						className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition cursor-pointer"
					>
						Muokkaa
					</button>
					<button
						type="button"
						onClick={() => {
							setDeleteError(null);
							setIsDeleteOpen(true);
						}}
						className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/30 transition cursor-pointer"
					>
						Poista
					</button>
				</div>
			)}
		</li>
	);

	return (
		<section className="mt-8" aria-labelledby="reviews-heading">
			{user && (
				<section className="mb-6" aria-labelledby="group-reviews-heading">
					<h3 id="group-reviews-heading" className="text-xl font-bold mb-3">
						Arvostelut ryhmistäsi
					</h3>
					{groupReviews.some((group) =>
						group.reviews.some((review) => review.user_id !== user.id),
					) ? (
						<div className="space-y-4">
							{groupReviews.map((group) => {
								const otherReviews = group.reviews.filter(
									(review) => review.user_id !== user.id,
								);
								if (otherReviews.length === 0) return null;

								return (
									<div
										key={group.group_id}
										className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
									>
										<h4 className="flex items-center gap-2 font-semibold mb-3">
											<UsersIcon className="size-4 text-purple-500" />
											{group.group_name}
										</h4>
										<ul className="space-y-3">
											{otherReviews.map((review) =>
												renderReview(
													review,
													false,
													group.group_name,
													`group-${group.group_id}`,
												),
											)}
										</ul>
									</div>
								);
							})}
						</div>
					) : (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Ei vielä arvosteluja ryhmistäsi.
						</p>
					)}
				</section>
			)}
			{/* Otsikko ja yhteenveto */}
			<div className="flex flex-wrap items-center justify-between gap-2 mb-4">
				<h2 id="reviews-heading" className="text-2xl font-bold">
					Yleiset arvostelut
				</h2>

				{reviewCount > 0 && typeof averageRating === "number" && (
					<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
						<StarRating value={Math.round(averageRating)} size="sm" />
						<span>
							<strong>{averageRating.toFixed(1)}</strong> / 5 ·{" "}
							{reviewCount === 1 ? "1 arvostelu" : `${reviewCount} arvostelua`}
						</span>
					</div>
				)}
			</div>

			{error && (
				<div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
					{error}
				</div>
			)}

			{loading ? (
				<div className="space-y-3 animate-pulse" aria-busy="true">
					<span className="sr-only">Ladataan arvosteluja...</span>
					<div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
					<div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
				</div>
			) : (
				<>
					{/* Arvostelun kirjoitus: kirjautuneelle, jos arvostelua ei ole vielä */}
					{user && !myReview && (
						<div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
							<h3 className="font-semibold mb-3">Arvostele elokuva</h3>
							<ReviewForm
								key="new-review"
								saving={saving}
								error={formError}
								onSubmit={handleSave}
							/>
						</div>
					)}

					{/* Kirjautumaton käyttäjä voi lukea arvosteluja mutta ei kirjoittaa */}
					{!user && (
						<p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
							Kirjaudu sisään arvostellaksesi elokuvan.
						</p>
					)}

					{/* Arvostelut: oma ensimmäisenä, sen jälkeen muut uusimmat ensin */}
					{myReview || others.length > 0 ? (
						<ul className="space-y-3">
							{myReview &&
								(isEditing ? (
									<li
										key={`edit-${myReview.id}`}
										className="rounded-xl p-4 border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-500/40"
									>
										<h3 className="font-semibold mb-3">Muokkaa arvosteluasi</h3>
										<ReviewForm
											key="edit-review"
											isEditing
											initialRating={myReview.rating}
											initialComment={myReview.comment || ""}
											saving={saving}
											error={formError}
											onSubmit={handleSave}
											onCancel={() => {
												setIsEditing(false);
												setFormError(null);
											}}
										/>
									</li>
								) : (
									renderReview(myReview, true)
								))}

							{others.map((review) => renderReview(review, false))}
						</ul>
					) : (
						!error && (
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Ei vielä arvosteluja.{user ? " Ole ensimmäinen!" : ""}
							</p>
						)
					)}
				</>
			)}

			{/* Poiston vahvistus */}
			{isDeleteOpen && (
				<div
					className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
					onMouseDown={(e) => {
						if (e.target === e.currentTarget && !deleting) closeDeleteModal();
					}}
				>
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="delete-review-title"
						className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-gray-900 dark:text-white"
					>
						<h2 id="delete-review-title" className="text-lg font-bold mb-2">
							Poistetaanko arvostelu?
						</h2>
						<p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
							Tähtiarviosi ja kommenttisi poistetaan pysyvästi. Toimintoa ei voi
							perua.
						</p>

						{deleteError && (
							<div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300 text-xs rounded-xl">
								{deleteError}
							</div>
						)}

						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={closeDeleteModal}
								disabled={deleting}
								className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition cursor-pointer disabled:opacity-50"
							>
								Peruuta
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={deleting}
								className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition cursor-pointer disabled:opacity-50"
							>
								{deleting ? "Poistetaan..." : "Poista arvostelu"}
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
