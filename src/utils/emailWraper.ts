import { sendEmail, SendEmailOptions } from "../services/email.service";


export const emailWrapper = async({to, subject, html}:SendEmailOptions) =>{
    try {
        await sendEmail({to, subject, html});
    } catch (error) {
        console.error("Error in emailWrapper:", error);
    }
}