// THIS IS THE MAIN FILE THAT WILL RUN THE SERVER

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: `postgresql://${process.env.DB_OWNER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=require`,
});

// Create tables query
const createTablesQuery = {
  quizzes: `CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id UUID PRIMARY KEY,
    quiz_data JSONB NOT NULL
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

// an endpoint with params that does the saame as save, but is a get request instead
app.get("/save/:quizData", async (req, res) => {
  const { quizData } = await req.params["quizData"];

  console.log("Received quiz data on GET:", quizData);

  if (!quizData) {
    return res
      .status(400)
      .send({ status: "error", message: "quizData is required" });
  }

  const parsedQuizData = JSON.parse(quizData);

  console.log("Parsed quiz data:", parsedQuizData);

  try {
    const quizId = require("uuid").v4(); // Generate unique ID
    const result = await pool.query(
      "INSERT INTO quizzes (quiz_id, quiz_data) VALUES ($1, $2) RETURNING quiz_id",
      [quizId, JSON.stringify(parsedQuizData)]
    );

    res.status(200).send({
      status: "success",
      message: "Quiz successfully stored",
      quizId: result.rows[0].quiz_id,
    });
  } catch (error) {
    console.error("Error storing quiz:", error);
    res.status(500).send({ status: "error", message: "Database error" });
  }
});

// POST endpoint to store data
app.post("/save", async (req, res) => {
  const { quizData } = req.body;

  if (!quizData) {
    return res
      .status(400)
      .send({ status: "error", message: "quizData is required" });
  }

  try {
    const quizId = require("uuid").v4(); // Generate unique ID
    const result = await pool.query(
      "INSERT INTO quizzes (quiz_id, quiz_data) VALUES ($1, $2) RETURNING quiz_id",
      [quizId, JSON.stringify(quizData)]
    );

    res.status(200).send({
      status: "success",
      message: "Quiz successfully stored",
      quizId: result.rows[0].quiz_id,
    });
  } catch (error) {
    console.error("Error storing quiz:", error);
    res.status(500).send({ status: "error", message: "Database error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
