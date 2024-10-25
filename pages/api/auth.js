import db from "../../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { action } = req.body;

    if (action === "register") {
      const { email, password } = req.body;

      const [existingUser] = await db.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
      );
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      await db.query(
        "INSERT INTO users (email, password, verification_token) VALUES (?, ?, ?)",
        [email, hashedPassword, verificationToken]
      );

      const verificationUrl = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;
      await transporter.sendMail({
        to: email,
        subject: "Verify your email",
        html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
      });

      return res
        .status(201)
        .json({ message: "User registered. Check your email to verify." });
    }

    if (action === "login") {
      const { email, password } = req.body;
      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);

      if (
        users.length === 0 ||
        !(await bcrypt.compare(password, users[0].password))
      ) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!users[0].verified) {
        return res.status(403).json({ message: "Email not verified" });
      }

      const token = jwt.sign({ userId: users[0].id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.status(200).json({ token });
    }

    if (action === "reset-password") {
      const { email } = req.body;
      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      if (users.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

      await db.query(
        "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
        [resetToken, resetTokenExpires, users[0].id]
      );

      const resetUrl = `${process.env.BASE_URL}/api/auth/reset/${resetToken}`;
      await transporter.sendMail({
        to: email,
        subject: "Password Reset",
        html: `<p>Reset your password by clicking <a href="${resetUrl}">here</a>.</p>`,
      });

      return res
        .status(200)
        .json({ message: "Check your email for a password reset link." });
    }
  }
  res.setHeader("Allow", ["POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
