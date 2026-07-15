import pool from "../config/db.js";
import { generateEmbedding } from "./embeddingService.js";


export async function retrieveContext(
  chatbotId,
  question
) {
  const embedding =
    await generateEmbedding(
      question
    );

  const vector =
    `[${embedding.join(",")}]`;

  const result =
    await pool.query(
      `
      SELECT *
      FROM match_documents(
        $1,
        $2,
        $3
      )
      `,
      [
        chatbotId,
        vector,
        3,
      ]
    );

  return result.rows;
}