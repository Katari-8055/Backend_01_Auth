import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

/* =====================
   1. Role Type (Better typing)
===================== */
export type UserRole = "teacher" | "student";


export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified?: boolean;
  isPasswordCorrect(password: string): Promise<boolean>;
}

/* =====================
   3. User Schema
===================== */

const userSchema = new Schema<IUser>({
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2, 
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, 
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, 
    },
    role: {
      type: String,
      enum: ["teacher","student"],
      default: "student",
    },
    refreshToken: {
      type: String,
      select: false, 
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

/* =====================
   4. Pre-save Hook
   (Hash password)
===================== */
userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});


/* =====================
   5. Instance Method
===================== */
userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

/* =====================
   6. Model Export
===================== */
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
