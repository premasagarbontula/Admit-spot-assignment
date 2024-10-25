import db from "../../db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Adding a new contact
    const { name, email, phone_number, address, timezone } = req.body;
    const [result] = await db.query(
      "INSERT INTO contacts (name, email, phone_number, address, timezone) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone_number, address, timezone]
    );
    return res.status(201).json({ id: result.insertId });
  }

  if (req.method === "GET") {
    // Retrieving contacts with filtering and sorting
    const { name, email, timezone, sort } = req.query;
    let query = "SELECT * FROM contacts WHERE deleted = FALSE";
    const filters = [];

    if (name) {
      filters.push(`name LIKE '%${name}%'`);
    }
    if (email) {
      filters.push(`email LIKE '%${email}%'`);
    }
    if (timezone) {
      filters.push(`timezone = ?`);
    }

    if (filters.length > 0) {
      query += " AND " + filters.join(" AND ");
    }

    if (sort) {
      query += ` ORDER BY ${sort}`;
    }

    const [contacts] = await db.query(query, timezone ? [timezone] : []);
    return res.status(200).json(contacts);
  }

  res.setHeader("Allow", ["POST", "GET"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
