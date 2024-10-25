import db from "../../../db";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const { token } = req.query;
  const { password } = req.body;

  const [users] = await db.query(
    "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?",
    [token, new Date()]
  );
  if (users.length === 0) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.query(
    "UPDATE users SET password = ?, reset_token = ?, reset_token_expires = ? WHERE id = ?",
    [hashedPassword, null, null, users[0].id]
  );

  return res.status(200).json({ message: "Password reset successfully!" });
}
