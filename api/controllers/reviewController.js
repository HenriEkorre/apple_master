import axios from "axios";
import { pool } from "../models/db.js";

const MAX_INT = 2147483647;
const MAX_COMMENT_LENGTH = 280;
const MAX_REVIEWS_RETURNED = 50;
const MAX_MY_REVIEWS = 100;

// Palauttaa positiivisen kokonaisluvun tai null, jos arvo ei kelpaa
const parseId = (value) => {
	const number = Number(value);
	return Number.isInteger(number) && number > 0 && number <= MAX_INT
		? number
		: null;
};

const groupReviewsByGroup = (reviews) => {
	const groupsById = new Map();
	const groups = [];

	for (const review of reviews) {
		const { group_id: groupId, group_name: groupName, ...groupReview } = review;
		let group = groupsById.get(groupId);
		if (!group) {
			group = { group_id: groupId, group_name: groupName, reviews: [] };
			groupsById.set(groupId, group);
			groups.push(group);
		}

		group.reviews.push(groupReview);
	}

	return groups;
};

const fetchGroupMovieReviews = async (tmdbId, userId) => {
	if (!userId) return [];

	const result = await pool.query(
		`SELECT group_id, group_name, id, rating, comment, visibility,
      created_at, user_id, username
    FROM (
      SELECT g.id AS group_id,
            g.name AS group_name,
            r.id,
            r.rating,
            r.comment,
            r.visibility,
            r.created_at,
            u.id AS user_id,
            u.username,
            ROW_NUMBER() OVER (
              PARTITION BY g.id
              ORDER BY r.created_at DESC, r.id DESC
            ) AS review_rank
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN group_members gm_other
        ON gm_other.user_id = r.user_id
      AND gm_other.status = 'active'
      JOIN group_members gm_me
        ON gm_me.group_id = gm_other.group_id
      AND gm_me.user_id = $2
      AND gm_me.status = 'active'
      JOIN groups g ON g.id = gm_me.group_id
      WHERE r.tmdb_movie_id = $1
        AND (r.visibility = 'public' OR r.user_id = $2)
    ) grouped_reviews
    WHERE review_rank <= $3
    ORDER BY group_name, created_at DESC, id DESC`,
		[tmdbId, userId, MAX_REVIEWS_RETURNED],
	);
	return groupReviewsByGroup(result.rows);
};

const fetchMyReview = async (tmdbId, user) => {
	if (!user) return null;

	const result = await pool.query(
		`SELECT id, rating, comment, created_at
     FROM reviews
     WHERE tmdb_movie_id = $1 AND user_id = $2`,
		[tmdbId, user.id],
	);

	return result.rows[0]
		? { ...result.rows[0], user_id: user.id, username: user.username }
		: null;
};

// Tarkistaa TMDB:stä, että elokuva on olemassa (true/false). Muut virheet heitetään eteenpäin.
const movieExists = async (tmdbId) => {
	try {
		await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
			params: { api_key: process.env.TMDB_API_KEY },
			timeout: 8000,
		});
		return true;
	} catch (error) {
		if (error.response?.status === 404) return false;
		throw error;
	}
};

// Hae elokuvan arvostelut, yhteenveto ja kirjautuneen käyttäjän oma arvostelu
export const getMovieReviews = async (req, res, next) => {
	try {
		const tmdbId = parseId(req.params.tmdbId);
		const userId = req.user?.id ?? null;

		if (!tmdbId) {
			return res.status(400).json({ message: "Virheellinen elokuvan tunnus" });
		}

		// Yhteenveto: vain julkiset arvostelut
		const summaryResult = await pool.query(
			`SELECT COUNT(*)::int AS review_count,
              ROUND(AVG(rating), 1)::float8 AS average_rating
       FROM reviews
       WHERE tmdb_movie_id = $1 AND visibility = 'public'`,
			[tmdbId],
		);

		// Muiden arvostelut (oma arvostelu haetaan erikseen). Sähköpostia ei palauteta.
		const reviewsResult = await pool.query(
			`SELECT r.id, r.rating, r.comment, r.created_at,
              u.id AS user_id, u.username
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.tmdb_movie_id = $1
         AND r.visibility = 'public'
         AND ($2::int IS NULL OR r.user_id <> $2::int)
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT $3`,
			[tmdbId, userId, MAX_REVIEWS_RETURNED],
		);

		const groupReviews = await fetchGroupMovieReviews(tmdbId, userId);
		const myReview = await fetchMyReview(tmdbId, req.user);

		res.status(200).json({
			summary: summaryResult.rows[0],
			my_review: myReview,
			reviews: reviewsResult.rows,
			group_reviews: groupReviews,
		});
	} catch (error) {
		next(error);
	}
};

// Luo tai päivitä oma arvostelu (tähdet + kommentti samalla rivillä)
export const saveMyReview = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const tmdbId = parseId(req.params.tmdbId);

		if (!tmdbId) {
			return res.status(400).json({ message: "Virheellinen elokuvan tunnus" });
		}

		const { rating } = req.body;

		// Tähtiarvio: kokonaisluku 1–5
		if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
			return res.status(400).json({
				message: "Tähtiarvion pitää olla kokonaisluku 1–5",
			});
		}

		// Kommentti on valinnainen, mutta enintään MAX_COMMENT_LENGTH merkkiä
		let comment = null;
		if (req.body.comment !== undefined && req.body.comment !== null) {
			if (typeof req.body.comment !== "string") {
				return res
					.status(400)
					.json({ message: "Kommentin pitää olla tekstiä" });
			}

			const trimmedComment = req.body.comment.trim();

			if (trimmedComment.length > MAX_COMMENT_LENGTH) {
				return res.status(400).json({
					message: `Kommentti voi olla enintään ${MAX_COMMENT_LENGTH} merkkiä`,
				});
			}

			// Tyhjä kommentti tallennetaan NULL-arvona
			comment = trimmedComment || null;
		}

		// Uudelle arvostelulle varmistetaan, että elokuva on olemassa
		const existing = await pool.query(
			"SELECT 1 FROM reviews WHERE user_id = $1 AND tmdb_movie_id = $2",
			[userId, tmdbId],
		);
		if (existing.rows.length === 0 && !(await movieExists(tmdbId))) {
			return res.status(404).json({ message: "Elokuvaa ei löytynyt" });
		}

		// uk_user_movie_review: sama kutsu luo uuden tai päivittää vanhan arvostelun.
		// Näkyvyyttä (visibility) ei ylikirjoiteta päivityksessä.
		const result = await pool.query(
			`INSERT INTO reviews (user_id, tmdb_movie_id, rating, comment, visibility)
       VALUES ($1, $2, $3, $4, 'public')
       ON CONFLICT (user_id, tmdb_movie_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
       RETURNING id, rating, comment, created_at, (xmax = 0) AS inserted`,
			[userId, tmdbId, rating, comment],
		);

		const { inserted, ...review } = result.rows[0];

		res.status(inserted ? 201 : 200).json({
			review: { ...review, user_id: userId, username: req.user.username },
		});
	} catch (error) {
		next(error);
	}
};

// Poista oma arvostelu
export const deleteMyReview = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const tmdbId = parseId(req.params.tmdbId);

		if (!tmdbId) {
			return res.status(400).json({ message: "Virheellinen elokuvan tunnus" });
		}

		// Poistetaan vain kirjautuneen käyttäjän oma rivi
		const result = await pool.query(
			`DELETE FROM reviews
       WHERE user_id = $1 AND tmdb_movie_id = $2
       RETURNING id`,
			[userId, tmdbId],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ message: "Arvostelua ei löytynyt" });
		}

		res.status(200).json({ message: "Arvostelu poistettiin" });
	} catch (error) {
		next(error);
	}
};

// Hae elokuvan perustiedot TMDB:stä (oman arvostelulistan korteille)
const fetchMovieSummary = async (tmdbId) => {
	const response = await axios.get(
		`https://api.themoviedb.org/3/movie/${tmdbId}`,
		{
			params: { api_key: process.env.TMDB_API_KEY, language: "fi-FI" },
			timeout: 8000,
		},
	);
	const movie = response.data;
	return {
		id: movie.id,
		title: movie.title,
		poster_path: movie.poster_path,
		release_date: movie.release_date,
	};
};

// Haetaan elokuvat pienissä erissä, jotta TMDB:hen ei lähde sataa pyyntöä kerralla
const fetchSummariesInChunks = async (ids, chunkSize = 10) => {
	const results = [];
	for (let i = 0; i < ids.length; i += chunkSize) {
		const chunk = ids.slice(i, i + chunkSize);
		results.push(...(await Promise.allSettled(chunk.map(fetchMovieSummary))));
	}
	return results;
};

// Hae kirjautuneen käyttäjän kaikki omat arvostelut elokuvan tietoineen
export const getMyReviews = async (req, res, next) => {
	try {
		const userId = req.user.id;

		const result = await pool.query(
			`SELECT id, tmdb_movie_id, rating, comment, created_at
       FROM reviews
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2`,
			[userId, MAX_MY_REVIEWS],
		);

		const movies = await fetchSummariesInChunks(
			result.rows.map((row) => row.tmdb_movie_id),
		);

		// Jos yhden elokuvan tietoja ei saada, arvostelu näytetään silti paikkamerkillä
		res.status(200).json(
			result.rows.map((review, index) => ({
				...review,
				movie:
					movies[index].status === "fulfilled"
						? movies[index].value
						: { id: review.tmdb_movie_id, title: null, unavailable: true },
			})),
		);
	} catch (error) {
		next(error);
	}
};
