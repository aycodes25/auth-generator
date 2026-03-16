import sqlite3 from "sqlite3";
import path from "path";

// Path to SQLite DB file
const DB_PATH = path.join(process.cwd(), "database.sqlite");

// Create and export database instance
export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database at", DB_PATH);
  }
});

/**
 * Sanitize a database column name to comply with SQL standards
 * Only converts names with invalid characters. Preserves valid camelCase.
 */
function sanitizeColumn(name: string): string {
  // Check if already valid: starts with letter/underscore, contains only alphanumeric + underscore
  const isAlreadyValid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  if (isAlreadyValid) {
    return name; // Keep as-is (preserves camelCase)
  }

  // Apply sanitization only if name has invalid characters
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^(\d)/, "_$1")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Retry database operation with sanitized schema on syntax error
 * Useful for handling invalid column names like "form-control" → "form_control"
 */
function retryWithSanitization(
  originalQuery: string,
  callback: (err: Error | null, result?: any) => void
) {
  // Extract column names from CREATE TABLE statement
  const createTableRegex = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+\w+\s*\(([\s\S]*?)\);/i;
  const match = originalQuery.match(createTableRegex);

  if (!match) {
    callback(new Error("Could not parse CREATE TABLE statement for sanitization"));
    return;
  }

  const columnsSection = match[1];
  let sanitizedQuery = originalQuery;

  // Replace each column definition with sanitized column name
  const columnRegex = /(\w[\w\-\s]*?)\s+(TEXT|INTEGER|DATETIME|BLOB|REAL|NUMERIC)/gi;
  sanitizedQuery = sanitizedQuery.replace(columnRegex, (fullMatch, colName, colType) => {
    const sanitized = sanitizeColumn(colName);
    if (sanitized !== colName.trim()) {
      console.log(`  ${colName.trim()} → ${sanitized}`);
    }
    return `${sanitized} ${colType}`;
  });

  console.warn("⚠️ Invalid column names detected. Retrying with sanitized names...\n");
  console.log("⚙️ Field name normalized:");
  db.run(sanitizedQuery, (err) => {
    if (err) {
      callback(err);
    } else {
      console.log("\n✅ Auto-fix applied successfully - table created with sanitized column names\n");
      callback(null);
    }
  });
}

// Initialize DB with tables
export const initDb = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    db.run(createTableQuery, (err) => {
      if (err) {
        // Check if error is due to invalid column names (syntax errors with special chars)
        if (
          err.message.includes("near \"-\"") ||
          err.message.includes("syntax error") ||
          err.message.includes("invalid")
        ) {
          // Retry with sanitized column names
          retryWithSanitization(createTableQuery, (retryErr) => {
            if (retryErr) {
              console.error("❌ Error creating users table after sanitization:", retryErr.message);
              reject(retryErr);
            } else {
              console.log("✅ Database initialized and users table ensured");
              resolve();
            }
          });
        } else {
          console.error("❌ Error creating users table:", err.message);
          reject(err);
        }
      } else {
        console.log("✅ Database initialized and users table ensured");
        resolve();
      }
    });
  });
};
