import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (email, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: text,
  };

  try {
    console.log("Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error(`Error sending email: ${error.message}`);
  }
};

export default sendEmail;
