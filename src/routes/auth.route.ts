import express from "express";
import { accessToken, login, signUp, verifyEmail } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";


const router = express.Router();

router.post("/signup", signUp);
router.post("/verifyEmail", authMiddleware, verifyEmail);
router.post("/login", login);
router.get("/accessToken", accessToken);

export default router;