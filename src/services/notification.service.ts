import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendNotificationEmail = async (to: string, subject: string, htmlContent: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Kisan Mitra" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    console.log("Email sent successfully via SMTP:", info.messageId);
    return true;
  } catch (error: any) {
    console.error("Error sending email via SMTP:", error);
    return false;
  }
}
