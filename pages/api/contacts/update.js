import db from "../../../db";

export default async function handler(req, res) {
  if (req.method === "PUT") {
    const { id, name, email, phone_number, address, timezone } = req.body;

    await db.query(
      "UPDATE contacts SET name = ?, email = ?, phone_number = ?, address = ?, timezone = ? WHERE id = ?",
      [name, email, phone_number, address, timezone, id]
    );

    return res.status(200).json({ message: "Contact updated successfully" });
  }

  res.setHeader("Allow", ["PUT"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
