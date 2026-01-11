import express from "express";
// import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware";
import router from "./routes/auth.route";



const app = express();

app.use(express.json());
// app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Define your routes here

app.use("/api/v1/auth", router);

// global error handler
app.use(errorMiddleware);

export default app;
