import jwt, { SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";

interface TokenPayload {
  _id: Types.ObjectId;
  email?: string;
  role?: string;
}

export const generateAccessToken = ( payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: "15m",
  };

  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET!,
    options
  );
};

export const generateRefreshToken = (payload: Pick<TokenPayload, "_id">): string => {
  const options: SignOptions = {
    expiresIn: "7d",
  };

  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET!,
    options
  );
};
