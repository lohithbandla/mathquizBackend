const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test connection (don't close the pool here - we need it for queries)
function connectDb() {
  pool.connect()
    .then((client) => {
      console.log("✅ Connected to Neon PostgreSQL DB");
      client.release(); // Release the client back to the pool, don't end the pool
    })
    .catch((err) => {
      console.error("❌ Error connecting to DB:", err);
    });
}



// Export both pool and connectDb function
module.exports = pool;
module.exports.connectDb = connectDb;