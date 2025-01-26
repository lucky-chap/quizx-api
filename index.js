// THIS IS THE MAIN FILE THAT WILL RUN THE SERVER

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { faker } = require("@faker-js/faker");

const app = express();
const port = process.env.PORT || 4000;

// Enable CORS for all origins
app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: `postgresql://${process.env.DB_OWNER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=require`,
});

// Create tables query
const createTablesQuery = {
  TypingContent: `CREATE TABLE IF NOT EXISTS "TypingContent" (
    id UUID PRIMARY KEY,
    data JSONB NOT NULL
  )`,
};

// Function to initialize database tables
async function initializeTables() {
  try {
    // Execute each table creation query
    for (const [tableName, query] of Object.entries(createTablesQuery)) {
      await pool.query(query);
      console.log(`Created ${tableName} table if it didn't exist`);
    }
    console.log("All database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database tables:", error);
    throw error;
  }
}

initializeTables();

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL database");
    client.release();
    return true;
  } catch (error) {
    console.error("Error connecting to PostgreSQL database:", error);
    throw error;
  }
}

testConnection();

// ======================= MAIN APP PART =======================

// Middleware to parse JSON
app.use(express.json());

// test endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Hello from the server!",
  });
});

// GET endpoint to generate Lorem data using Faker.js
app.get("/lorem", async (req, res) => {
  const paragraph = faker.lorem.paragraphs(4);

  try {
    const contentId = require("uuid").v4(); // Generate unique ID
    const result = await pool.query(
      `INSERT INTO "TypingContent" (id, data) VALUES ($1, $2) RETURNING id`,
      [contentId, JSON.stringify(paragraph)]
    );

    console.log("Stored content with ID:", result.rows[0].id);

    res
      .status(200)
      .send(
        `Head on to https://typecraft.vercel.app/${result.rows[0].id} to show the world your typing skills!`
      );
  } catch (error) {
    console.error("Error storing content:", error);
    res.status(500).json({ status: "error", message: "Database error" });
  }
});

// POST endpoint to store data from Agent.ai
app.post("/save", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res
      .status(400)
      .json({ status: "error", message: "Content is required" });
  }

  console.log("Content:", content);

  try {
    const contentId = require("uuid").v4(); // Generate unique ID
    const result = await pool.query(
      `INSERT INTO "TypingContent" (id, data) VALUES ($1, $2) RETURNING id`,
      [contentId, JSON.stringify(content)]
    );

    console.log("Stored content with ID:", result.rows[0].id);

    res
      .status(200)
      .send(
        `Head on to https://typecraft.vercel.app/${result.rows[0].id} to show the world your typing skills!`
      );
  } catch (error) {
    console.error("Error storing content:", error);
    res.status(500).json({ status: "error", message: "Database error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
