import db from "../../../db";

export default async function handler(req, res) {
  if (req.method === "DELETE") {
    const { id } = req.body;

    await db.query("UPDATE contacts SET deleted = TRUE WHERE id = ?", [id]);
    return res.status(200).json({ message: "Contact deleted successfully" });
  }

  res.setHeader("Allow", ["DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
