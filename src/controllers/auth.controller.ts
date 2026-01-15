import { Request, Response } from "express";
import User from "../model/user.model";
import ApiError from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { generateOTP } from "../utils/generateOTP";
import redis from "../config/redis";
import { sendEmail } from "../services/email.service";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token";

interface SignUpBody {
  email: string;
  password: string;
  name: string;
  role?: "teacher" | "student";
}

//--------------------------Sign Up Controller--------------------------//

export const signUp = asyncHandler(
  async (req: Request<{}, {}, SignUpBody>, res: Response) => {
    const { email, password, name, role } = req.body;

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

//--------------------------Verify Email Controller--------------------------//

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const { otp } = req.body;

  if (!userId || !otp) {
    throw new ApiError(400, "OTP is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email already verified");
  }

  const redisKey = `otp:${userId}`;
  const storedOtp = await redis.get(redisKey);

  if (!storedOtp) {
    throw new ApiError(400, "OTP expired or not found");
  }

  if (storedOtp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  await redis.del(redisKey);

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(true, 200, null, "Email verified successfully"));
});

//--------------------------Login Controller--------------------------//

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken({
    _id: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    _id: user._id,
  });

  user.refreshToken = refreshToken;

  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
  };

  return res
    .status(200)
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
        200,
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
        "User logged in successfully"
      )
    );
});


export const accessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  // Verify refresh token
  let payload: any;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(payload._id).select("+refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }


  // Check if refresh token matches stored one
  if (user.refreshToken !== refreshToken) {
    throw new ApiError(401, "Refresh token mismatch");
  }

  // Generate new access token
  const newAccessToken = generateAccessToken({
    _id: user._id,
    email: user.email,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken({ _id: user._id });
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
  };

  return res
    .status(200)
    .cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json(
      new ApiResponse(true, 200, { accessToken: newAccessToken }, "Access token refreshed")
    );
});