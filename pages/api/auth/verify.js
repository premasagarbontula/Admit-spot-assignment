import db from "../../../db";

export default async function handler(req, res) {
  const { token } = req.query;

  const [users] = await db.query(
    "SELECT * FROM users WHERE verification_token = ?",
    [token]
  );
  if (users.length === 0) {
    return res.status(400).json({ message: "Invalid token" });
  }

  await db.query(
    "UPDATE users SET verified = ?, verification_token = ? WHERE id = ?",
    [true, null, users[0].id]
  );

  return res.status(200).json({ message: "Email verified successfully!" });
}
