import express from "express";
import { accessToken, login, signUp, verifyEmail } from "../controllers/auth.controller";
import { authMiddleware, RBACMiddleware } from "../middlewares/auth.middlewares";


const router = express.Router();

router.post("/signup", signUp);
router.post("/verifyEmail", authMiddleware, verifyEmail);
router.post("/login", login);
router.get("/accessToken", accessToken);
router.get(
  "/teacher-dashboard",
  authMiddleware,
  RBACMiddleware(["teacher"]),
  (req, res) => {
    res.send("Welcome teacher!");
  }
);

router.get(
  "/student-dashboard",
  authMiddleware,
  RBACMiddleware(["student"]),
  (req, res) => {
    res.send("Welcome student!");
  }
);


export default router;