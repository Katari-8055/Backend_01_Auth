import express from "express";
import { signUp, verifyEmail } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";


const router = express.Router();

router.post("/signup", signUp);
router.post("/verifyEmail", authMiddleware, verifyEmail);

export default router;