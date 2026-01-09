import express, { type Application } from "express";

const app: Application = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

export default app;
