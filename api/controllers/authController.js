import argon2 from "argon2";
import { issueCookie } from "../middleware/authMiddleware.js";
import { pool } from "../models/db.js";

// 1. REKISTERÖITYMINEN
export const registerUser = async (req, res, next) => {
	try {
		const { username, email, password } = req.body;

		// Tarkistetaan, että kaikki vaaditut kentät on annettu
		if (!username || !email || !password) {
			return res.status(400).json({
				error: "Kaikki kentät (username, email, password) ovat pakollisia",
			});
		}

		// Tarkistetaan onko käyttäjänimi tai sähköposti jo olemassa
		const userExists = await pool.query(
			"SELECT id FROM users WHERE username = $1 OR email = $2",
			[username, email],
		);

		if (userExists.rows.length > 0) {
			return res
				.status(400)
				.json({ error: "Käyttäjänimi tai sähköposti on jo varattu" });
		}

		// Hashataan salasana Argon2:lla
		const password_hash = await argon2.hash(password);

		// Tallennetaan käyttäjä kantaan
		const newUser = await pool.query(
			`INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING id, username, created_at`,
			[username, email, password_hash],
		);

		// Palautetaan vastauksessa VAIN turvalliset/julkiset tiedot
		res.status(201).json({
			message: "Rekisteröityminen onnistui!",
		});
	} catch (error) {
		if (error.code?.startsWith("SQLITE_CONSTRAINT"))
			return res.status(409).json({ error: "Sähköposti on jo käytössä" });

		next(error);
	}
};

// 2. KIRJAUTUMINEN
export const loginUser = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res
				.status(400)
				.json({ error: "Sähköposti ja salasana vaaditaan" });
		}

		// Etsitään käyttäjä sähköpostin perusteella
		const result = await pool.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);

		if (result.rows.length === 0) {
			return res
				.status(401)
				.json({ error: "Virheellinen sähköposti tai salasana" });
		}

		const user = result.rows[0];

		// Tarkistetaan salasana Argon2:n verify-funktiolla
		const isMatch = await argon2.verify(user.password_hash, password);
		if (!isMatch) {
			return res
				.status(401)
				.json({ error: "Virheellinen sähköposti tai salasana" });
		}

		issueCookie(res, user);
		res.json({ user: { id: user.id, email: user.email } });
	} catch (error) {
		next(error);
	}
};
