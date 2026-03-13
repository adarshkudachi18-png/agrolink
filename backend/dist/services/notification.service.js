"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendNotificationEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: `"Kisan Mitra" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        });
        console.log("Email sent successfully via SMTP:", info.messageId);
        return true;
    }
    catch (error) {
        console.error("Error sending email via SMTP:", error);
        return false;
    }
};
exports.sendNotificationEmail = sendNotificationEmail;
