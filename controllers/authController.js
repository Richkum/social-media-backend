import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import axios from "axios";
import User from "../models/users.js";
import dotenv from "dotenv";
import requestIp from "request-ip";
import geoip from "geoip-lite";
import { validationResult } from "express-validator";
import sendEmail from "../midleware/sendEmail.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";

dotenv.config();

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "/api/auth/google/callback",
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ googleId: profile.id });
//         if (!user) {
//           // If user doesn't exist, create a new one
//           user = await User.create({
//             googleId: profile.id,
//             firstName: profile.name.givenName,
//             lastName: profile.name.familyName,
//             email: profile.emails[0].value,
//             avatar: profile.photos[0].value,
//           });
//         }
//         return done(null, user);
//       } catch (error) {
//         return done(error, false);
//       }
//     }
//   )
// );

// // Serialize and deserialize user
// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser(async (id, done) => {
//   const user = await User.findById(id);
//   done(null, user);
// });

const register = async (req, res) => {
  console.log("Registering user...");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, dateOfBirth, gender } =
    req.body;
  console.log(
    "First name:",
    firstName,
    "Last name:",
    lastName,
    "Email:",
    email,
    "Password:",
    password,
    "Date of birth:",
    dateOfBirth,
    "Gender:",
    gender
  );

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !dateOfBirth ||
    !gender
  ) {
    return res
      .status(400)
      .json({ message: "Please fill in all required fields." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long." });
  }

  try {
    console.log("Checking if user already exists...");
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log("Generating verification code...");
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    console.log("Setting expiration date for the verification code...");
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    console.log("Creating user...");
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      dateOfBirth,
      gender,
      emailVerified: false,
    });

    // Saving the verification code to the user object in the database
    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpiresAt = expiresAt;
    await user.save();

    console.log("Sending verification email...");
    await sendEmail(
      email,
      "Your Verification Code",
      `Dear ${firstName}, your verification code is ${verificationCode}. Please use it to verify your account.`
    );

    console.log("Generating JWT token...");
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("User registered successfully, returning response...");
    res.status(201).json({
      token,
      message: `Please check your email. A verification code has been sent to ${email} for account verification.`,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyEmail = async (req, res) => {
  const { code } = req.body;
  console.log("Verifying email...");

  try {
    // Find user by verification code
    console.log("Finding user with verification code...");
    const user = await User.findOne({
      emailVerificationCode: code,
      emailVerificationCodeExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      console.log("User not found");
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }
    console.log("User found");

    // Set emailVerified to true
    console.log("Setting emailVerified to true...");
    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationCodeExpiresAt = null;

    // Save user
    console.log("Saving user...");
    await user.save();
    console.log("User saved");

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Getting client IP");
  const clientIp = requestIp.getClientIp(req);
  console.log("Looking up geo info");
  const geo = geoip.lookup(clientIp);

  try {
    console.log("Finding user with email");
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Checking password hash");
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Updating user's last login details");
    user.lastLoginIp = clientIp;
    user.lastLoginCountry = geo?.country || user.lastLoginCountry;
    user.lastLoginAt = Date.now();
    console.log("Saving user");
    await user.save();

    console.log("Generating JWT token");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    console.log("Checking if IP or location has changed");
    if (
      user.lastLoginIp !== clientIp ||
      user.lastLoginCountry !== geo?.country
    ) {
      console.log("Creating transporter");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      console.log("Setting up mail options");
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "New Login Attempt Detected",
        html: `<p>We detected a login attempt from a new location or device. 
               Please confirm if this was you. 
               If not, click <a href="${process.env.CLIENT_URL}/reset-password">here</a> to reset your password.</p>`,
      };

      console.log("Sending email");
      await transporter.sendMail(mailOptions);
    }

    console.log("Returning 200 response");
    res.status(200).json({
      message: "Login successful",
      token,
      session: {
        ip: clientIp,
        location: geo?.country || "Unknown",
        time: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    console.log("Returning 500 response with error message");
    res.status(500).json({ message: "Login error", error });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  console.log("Finding user with email");
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Generating 6-digit verification code");
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    console.log("Setting expiration time for verification code");
    const verificationCodeExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    console.log("Saving verification code and expiration time to user");
    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpiresAt = verificationCodeExpiresAt;
    await user.save();

    console.log("Creating transporter");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log("Setting up mail options");
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Reset your password",
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>
            <p>This code will expire in 1 hour.</p>`,
    };

    console.log("Sending email");
    await transporter.sendMail(mailOptions);

    console.log("Returning 200 response");
    res.status(200).json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Error sending email", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

const verifyVerificationCode = async (req, res) => {
  const { verificationCode } = req.body;

  try {
    const user = await User.findOne({
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid or expired verification code" });
    }

    res.status(200).json({ message: "Verification code is valid" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying code", error });
  }
};

const resetPassword = async (req, res) => {
  const { verificationCode, newPassword, confirmNewPassword } = req.body;

  try {
    const user = await User.findOne({
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpiresAt: { $gt: new Date() },
    });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Invalid or expired verification code" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.emailVerificationCode = null;
    user.emailVerificationCodeExpiresAt = null;
    await user.save();

    res.status(200).json({ message: "Password successfully reset" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error });
  }
};

export {
  register,
  login,
  verifyEmail,
  forgotPassword,
  verifyVerificationCode,
  resetPassword,
};
