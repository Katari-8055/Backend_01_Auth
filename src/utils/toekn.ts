import jwt from "jsonwebtoken";
import { jwtPayload } from "../types/jwt";

export const generateAccessToken = (payload: jwtPayload): string =>
  jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  });

export const generateRefreshToken = (payload: jwtPayload): string =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  });
