import { Resend } from "resend";
import ApiError from "../utils/ApiError";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> => {
  try {
    await resend.emails.send({
      from: "My App <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });
  } catch (error) {
    throw new ApiError(500, "Failed to send email");
  }
};
