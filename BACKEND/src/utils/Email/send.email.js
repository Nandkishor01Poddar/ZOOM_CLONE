import "dotenv/config"; 
import nodemailer from "nodemailer";

// console.log("SMTP CONFIG →", {
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   user: process.env.SMTP_USER,
// });

// 📨 Single reusable transporter (Mailtrap / Gmail / any SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                       // e.g. sandbox.smtp.mailtrap.io
  port: Number(process.env.SMTP_PORT) || 587,        // e.g. 587
  secure: Number(process.env.SMTP_PORT) === 465,     // true only for 465
  auth: {
    user: process.env.SMTP_USER,                     // username from Mailtrap
    pass: process.env.SMTP_PASS,                     // password from Mailtrap
  },
});

/**
 * sendEmail({ to, subject, html, text })
 */
export default async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || "no-reply@example.com",
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ EMAIL SEND ERROR:", err.message);
    throw err; // taaki controller me catch ho sake
  }
}
