import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import {
	protect,
	cookieName,
	cookieOptions,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);

router.get("/me", protect, (req, res) => res.json({ user: req.user }));

router.post("/logout", (req, res) => {
	res.clearCookie(cookieName, cookieOptions);
	res.json({ message: "Kirjauduttu ulos" });
});

export default router;
