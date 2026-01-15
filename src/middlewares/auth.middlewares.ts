import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../model/user.model";
import ApiError from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";

interface JwtPayload {
  _id: string;
}

export const authMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {

    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized: Token missing");
    }

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    ) as JwtPayload;


    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    (req as any).user = user;

    next();
  }
);
