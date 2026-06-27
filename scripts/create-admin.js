const { randomBytes, scryptSync } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const projectRoot = process.cwd();
const dbPath = process.env.ROUTE666_DB_PATH || path.join(projectRoot, "data", "route666.db");
const schemaPath = path.join(projectRoot, "data", "schema.sql");
const [username, password] = process.argv.slice(2);

if (!username || !password || password.length < 8) {
  console.error("Usage: npm run admin:create -- <username> <password>");
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(fs.readFileSync(schemaPath, "utf8"));

const existing = db
  .prepare("SELECT id FROM admin_users WHERE username = ?")
  .get(username);

if (existing) {
  console.error(`Admin username already exists: ${username}`);
  db.close();
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");

db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)")
  .run(username, `${salt}:${hash}`);

db.close();

console.log(`Admin created: ${username}`);
