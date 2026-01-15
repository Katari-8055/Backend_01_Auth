import { Request, Response } from "express";
import User from "../model/user.model";
import ApiError from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { generateOTP } from "../utils/generateOTP";
import redis from "../config/redis";
import { sendEmail } from "../services/email.service";
import { generateAccessToken, generateRefreshToken } from "../utils/token";

interface SignUpBody {
  email: string;
  password: string;
  name: string;
  role?: "teacher" | "student";
}

export const signUp = asyncHandler(
  async (req: Request<{}, {}, SignUpBody>, res: Response) => {
    const { email, password, name, role } = req.body;
    // console.log(req.body);


    if (!email || !password || !name) {
      throw new ApiError(400, "Name, email and password are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User already exists with this email");
    }

    const user = await User.create({ email, password, name, role });

    // console.log("New user created:", user);

    const accessToken = generateAccessToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    // console.log(accessToken);


    const refreshToken = generateRefreshToken({
      _id: user._id,
    });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const otp = generateOTP();
    try {
      await redis.set(`otp:${user._id}`, otp, { ex: 300 });

      await sendEmail({
        to: user.email,
        subject: "Welcome to My App 🎉",
        html: `
          <h2>Hello ${user.name}</h2>
          <h1>Your OTP is: ${otp}</h1>
          <p>Your account has been created successfully.</p>
        `,
      });
    } catch (err) {
      console.error("Redis/Email failed:", err);
    }

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "strict" as const,
    };

    return res
      .status(201)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json(
        new ApiResponse(
          true,
          201,
          {
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              isEmailVerified: user.isEmailVerified,
            },
            accessToken,
            refreshToken,
          },
          "User registered successfully"
        )
      );
  }
);



export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    throw new ApiError(400, "User ID and OTP are required");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const storedOtp = await redis.get(`${userId}`);
  if (storedOtp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }
  await redis.del(`${userId}`);
  user.isEmailVerified = true;
  await user.save();
  return res.status(200).json(new ApiResponse(true, 200, null, "Email verified successfully"));
})  