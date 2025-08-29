import {neon} from "@neondatabase/serverless"

import "dotenv/config"

//Create a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL)

export async function initDB() {
  try {

    await sql`
      CREATE TABLE IF NOT EXISTS morningForms(
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        sleep SMALLINT NOT NULL CHECK (sleep BETWEEN 0 AND 10),
        motivation SMALLINT NOT NULL CHECK (motivation BETWEEN 0 AND 10),
        objective_1 VARCHAR(255) NOT NULL,
        objective_2 VARCHAR(255) NOT NULL,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS nightForms(
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        mood SMALLINT NOT NULL CHECK (mood BETWEEN 1 AND 3),
        lift SMALLINT NOT NULL CHECK (lift BETWEEN 1 AND 3),
        endurance SMALLINT NOT NULL CHECK (endurance BETWEEN 1 AND 3),
        chess SMALLINT NOT NULL CHECK (chess BETWEEN 1 AND 3),
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS aiSummary (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR NOT NULL,
          ai_summary TEXT NOT NULL,
          created_at DATE NOT NULL,
          UNIQUE(user_id, created_at)
      )`;


    console.log('Database initialized successfully.');
  } catch (error) {
    console.log('Error initializing database:', error);
    process.exit(1);
  }
}
