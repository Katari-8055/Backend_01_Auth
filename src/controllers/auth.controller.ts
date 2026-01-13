import { Request, Response } from "express";
import User from "../model/user.model";
import ApiError from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { emailWrapper } from "../utils/emailWraper";

interface SignUpBody {
  email: string;
  password: string;
  name: string;
  role?: "teacher" | "student";
}

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

    const user = await User.create({ email, password, role, name });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    emailWrapper({
      to: user.email,
      subject: "Welcome to My App 🎉",
      html: `
        <h2>Hello ${user.name}</h2>
        <p>Your account has been created successfully.</p>
      `,
    })

    return res.status(201).json(
      new ApiResponse(
        true,
        201,
        userResponse,
        "User registered successfully"
      )
    );
  }
);
