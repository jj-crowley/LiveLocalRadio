import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getDatabasePath } from "@/lib/paths";
import { slugify } from "@/lib/slug";

let db;

export function getDb() {
  if (!db) {
    const dbPath = getDatabasePath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);
    db.exec("PRAGMA foreign_keys = ON");
    ensureSchema(db);
  }

  return db;
}

function ensureSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS bands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      genre TEXT NOT NULL,
      hometown TEXT NOT NULL,
      bio TEXT NOT NULL,
      image_path TEXT,
      audio_path TEXT,
      website_url TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      venue TEXT NOT NULL,
      address TEXT,
      city TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      band_name TEXT,
      genre TEXT,
      age_restriction TEXT NOT NULL DEFAULT 'all ages',
      price TEXT,
      description TEXT NOT NULL,
      flyer_path TEXT,
      ticket_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS show_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      band_name TEXT NOT NULL,
      genre TEXT NOT NULL,
      age_restriction TEXT NOT NULL,
      cover TEXT,
      flyer_path TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewed_by INTEGER REFERENCES admin_users(id),
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      read_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profile_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      band_name TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT NOT NULL,
      genre TEXT,
      hometown TEXT,
      bio TEXT NOT NULL,
      links_json TEXT NOT NULL DEFAULT '[]',
      photo_paths_json TEXT NOT NULL DEFAULT '[]',
      audio_paths_json TEXT NOT NULL DEFAULT '[]',
      stream_permission INTEGER NOT NULL DEFAULT 0,
      stream_permission_text TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS show_bands (
      show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
      band_id INTEGER NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
      PRIMARY KEY (show_id, band_id)
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      author TEXT NOT NULL DEFAULT 'OK Gramps',
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL,
      image_path TEXT,
      section TEXT NOT NULL DEFAULT 'ok_gramps',
      published_at TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS takedown_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER REFERENCES admin_users(id),
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_label TEXT NOT NULL,
      reason TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_shows_starts_at ON shows(starts_at);
    CREATE INDEX IF NOT EXISTS idx_show_submissions_status ON show_submissions(status);
    CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
    CREATE INDEX IF NOT EXISTS idx_profile_submissions_status ON profile_submissions(status);
    CREATE INDEX IF NOT EXISTS idx_articles_section ON articles(section);
    CREATE INDEX IF NOT EXISTS idx_bands_slug ON bands(slug);
    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_takedown_log_created_at ON takedown_log(created_at);
  `);

  const showColumns = database
    .prepare("PRAGMA table_info(shows)")
    .all()
    .map((column) => column.name);

  if (!showColumns.includes("band_name")) {
    database.exec("ALTER TABLE shows ADD COLUMN band_name TEXT");
  }

  if (!showColumns.includes("genre")) {
    database.exec("ALTER TABLE shows ADD COLUMN genre TEXT");
  }

  if (!showColumns.includes("age_restriction")) {
    database.exec("ALTER TABLE shows ADD COLUMN age_restriction TEXT NOT NULL DEFAULT 'all ages'");
  }

  const articleColumns = database
    .prepare("PRAGMA table_info(articles)")
    .all()
    .map((column) => column.name);

  if (!articleColumns.includes("section")) {
    database.exec("ALTER TABLE articles ADD COLUMN section TEXT NOT NULL DEFAULT 'ok_gramps'");
  }

  database.exec("CREATE INDEX IF NOT EXISTS idx_articles_section ON articles(section)");

  const profileColumns = database
    .prepare("PRAGMA table_info(profile_submissions)")
    .all()
    .map((column) => column.name);

  if (!profileColumns.includes("stream_permission")) {
    database.exec("ALTER TABLE profile_submissions ADD COLUMN stream_permission INTEGER NOT NULL DEFAULT 0");
  }

  if (!profileColumns.includes("stream_permission_text")) {
    database.exec("ALTER TABLE profile_submissions ADD COLUMN stream_permission_text TEXT");
  }

  publishMissingReviewedProfiles(database);
}

export function getSiteSetting(key, fallback = "") {
  const row = getDb()
    .prepare("SELECT value FROM site_settings WHERE key = ?")
    .get(key);

  return row?.value || fallback;
}

export function setSiteSetting(key, value) {
  getDb()
    .prepare(`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `)
    .run(key, value);
}

export function getUpcomingShows(limit = 20) {
  return getDb()
    .prepare(`
      SELECT *
      FROM shows
      WHERE datetime(starts_at) >= datetime('now', '-1 day')
      ORDER BY datetime(starts_at) ASC
      LIMIT ?
    `)
    .all(limit);
}

export function getAllShowsForAdmin() {
  return getDb()
    .prepare(`
      SELECT *
      FROM shows
      ORDER BY datetime(starts_at) DESC
    `)
    .all();
}

export function getBands() {
  return getDb()
    .prepare("SELECT * FROM bands ORDER BY name ASC")
    .all();
}

export function getBandById(id) {
  return getDb()
    .prepare("SELECT * FROM bands WHERE id = ?")
    .get(id) || null;
}

export function getFeaturedBands(limit = 3) {
  return getDb()
    .prepare("SELECT * FROM bands ORDER BY featured DESC, name ASC LIMIT ?")
    .all(limit);
}

export function getBandByName(name) {
  if (!name) {
    return null;
  }

  return getDb()
    .prepare("SELECT * FROM bands WHERE lower(name) = lower(?)")
    .get(name) || null;
}

export function getArticles() {
  return getDb()
    .prepare("SELECT * FROM articles ORDER BY date(published_at) DESC, id DESC")
    .all();
}

export function getArticlesBySection(section) {
  return getDb()
    .prepare(`
      SELECT *
      FROM articles
      WHERE section = ?
      ORDER BY date(published_at) DESC, id DESC
    `)
    .all(section);
}

export function getFeaturedArticles(limit = 2, section = "") {
  if (section) {
    return getDb()
      .prepare("SELECT * FROM articles WHERE section = ? ORDER BY featured DESC, date(published_at) DESC, id DESC LIMIT ?")
      .all(section, limit);
  }

  return getDb()
    .prepare("SELECT * FROM articles ORDER BY featured DESC, date(published_at) DESC, id DESC LIMIT ?")
    .all(limit);
}

export function getArticleBySlug(slug) {
  return getDb()
    .prepare("SELECT * FROM articles WHERE slug = ?")
    .get(slug);
}

export function createArticle({ title, author, excerpt, body, imagePath, section, featured }) {
  const slug = buildUniqueArticleSlug(title);
  const publishedAt = new Date().toISOString().slice(0, 10);
  const result = getDb()
    .prepare(`
      INSERT INTO articles (
        title,
        slug,
        author,
        excerpt,
        body,
        image_path,
        section,
        published_at,
        featured
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(title, slug, author, excerpt, body, imagePath, section, publishedAt, featured ? 1 : 0);

  return getDb()
    .prepare("SELECT * FROM articles WHERE id = ?")
    .get(result.lastInsertRowid);
}

export function createShowSubmission({ venue, address, city, startsAt, bandName, genre, ageRestriction, cover, flyerPath }) {
  const result = getDb()
    .prepare(`
      INSERT INTO show_submissions (
        venue,
        address,
        city,
        starts_at,
        band_name,
        genre,
        age_restriction,
        cover,
        flyer_path
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(venue, address, city, startsAt, bandName, genre, ageRestriction, cover, flyerPath);

  return getDb()
    .prepare("SELECT * FROM show_submissions WHERE id = ?")
    .get(result.lastInsertRowid);
}

export function getPendingShowSubmissions() {
  return getDb()
    .prepare(`
      SELECT *
      FROM show_submissions
      WHERE status = 'pending'
      ORDER BY datetime(created_at) ASC
    `)
    .all();
}

export function publishShowSubmission(id, adminUserId) {
  const database = getDb();
  const submission = database
    .prepare("SELECT * FROM show_submissions WHERE id = ? AND status = 'pending'")
    .get(id);

  if (!submission) {
    throw new Error("Pending submission not found.");
  }

  const title = `${submission.band_name} at ${submission.venue}`;
  const baseSlug = slugify(`${submission.band_name}-${submission.venue}-${submission.starts_at}`);
  const slug = `${baseSlug}-${Date.now()}`;
  const description = `${submission.band_name} brings ${submission.genre} to ${submission.venue}.`;

  database.exec("BEGIN");
  try {
    const result = database
      .prepare(`
        INSERT INTO shows (
          title,
          slug,
          venue,
          address,
          city,
          starts_at,
          band_name,
          genre,
          age_restriction,
          price,
          description,
          flyer_path
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        title,
        slug,
        submission.venue,
        submission.address,
        submission.city,
        submission.starts_at,
        submission.band_name,
        submission.genre,
        submission.age_restriction,
        submission.cover,
        description,
        submission.flyer_path
      );

    database
      .prepare(`
        UPDATE show_submissions
        SET status = 'published',
          reviewed_by = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .run(adminUserId, id);

    database.exec("COMMIT");
    return database.prepare("SELECT * FROM shows WHERE id = ?").get(result.lastInsertRowid);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function rejectShowSubmission(id, adminUserId) {
  const result = getDb()
    .prepare(`
      UPDATE show_submissions
      SET status = 'rejected',
        reviewed_by = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'
    `)
    .run(adminUserId, id);

  if (result.changes === 0) {
    throw new Error("Pending submission not found.");
  }
}

export function updateShow(id, { title, venue, address, city, startsAt, bandName, genre, ageRestriction, price, description }) {
  const result = getDb()
    .prepare(`
      UPDATE shows
      SET title = ?,
        venue = ?,
        address = ?,
        city = ?,
        starts_at = ?,
        band_name = ?,
        genre = ?,
        age_restriction = ?,
        price = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(title, venue, address, city, startsAt, bandName, genre, ageRestriction, price, description, id);

  if (result.changes === 0) {
    throw new Error("Show not found.");
  }

  return getDb()
    .prepare("SELECT * FROM shows WHERE id = ?")
    .get(id);
}

export function deleteShow(id) {
  const result = getDb()
    .prepare("DELETE FROM shows WHERE id = ?")
    .run(id);

  if (result.changes === 0) {
    throw new Error("Show not found.");
  }
}

export function createContactMessage({ name, email, message }) {
  const result = getDb()
    .prepare(`
      INSERT INTO contact_messages (name, email, message)
      VALUES (?, ?, ?)
    `)
    .run(name, email, message);

  return getDb()
    .prepare("SELECT * FROM contact_messages WHERE id = ?")
    .get(result.lastInsertRowid);
}

export function getContactMessagesForAdmin() {
  return getDb()
    .prepare(`
      SELECT *
      FROM contact_messages
      ORDER BY
        CASE status WHEN 'new' THEN 0 ELSE 1 END,
        datetime(created_at) DESC
    `)
    .all()
    .map((message) => ({ ...message }));
}

export function markContactMessageRead(id) {
  const result = getDb()
    .prepare(`
      UPDATE contact_messages
      SET status = 'read',
        read_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(id);

  if (result.changes === 0) {
    throw new Error("Message not found.");
  }
}

export function createProfileSubmission({ bandName, contactName, contactEmail, genre, hometown, bio, links, photoPaths, audioPaths, streamPermission, streamPermissionText }) {
  const result = getDb()
    .prepare(`
      INSERT INTO profile_submissions (
        band_name,
        contact_name,
        contact_email,
        genre,
        hometown,
        bio,
        links_json,
        photo_paths_json,
        audio_paths_json,
        stream_permission,
        stream_permission_text
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      bandName,
      contactName,
      contactEmail,
      genre,
      hometown,
      bio,
      JSON.stringify(links),
      JSON.stringify(photoPaths),
      JSON.stringify(audioPaths),
      streamPermission ? 1 : 0,
      streamPermissionText
    );

  return getDb()
    .prepare("SELECT * FROM profile_submissions WHERE id = ?")
    .get(result.lastInsertRowid);
}

export function getProfileSubmissionsForAdmin() {
  return getDb()
    .prepare(`
      SELECT *
      FROM profile_submissions
      ORDER BY
        CASE status WHEN 'new' THEN 0 ELSE 1 END,
        datetime(created_at) DESC
    `)
    .all()
    .map((submission) => ({
      ...submission,
      links: parseJsonList(submission.links_json),
      photoPaths: parseJsonList(submission.photo_paths_json),
      audioPaths: parseJsonList(submission.audio_paths_json)
    }));
}

export function getProfileSubmissionById(id) {
  const submission = getDb()
    .prepare("SELECT * FROM profile_submissions WHERE id = ?")
    .get(id);

  if (!submission) {
    return null;
  }

  return {
    ...submission,
    links: parseJsonList(submission.links_json),
    photoPaths: parseJsonList(submission.photo_paths_json),
    audioPaths: parseJsonList(submission.audio_paths_json)
  };
}

export function getProfileSubmissionsByBandName(bandName) {
  return getDb()
    .prepare("SELECT * FROM profile_submissions WHERE lower(band_name) = lower(?) ORDER BY datetime(created_at) DESC")
    .all(bandName)
    .map((submission) => ({
      ...submission,
      links: parseJsonList(submission.links_json),
      photoPaths: parseJsonList(submission.photo_paths_json),
      audioPaths: parseJsonList(submission.audio_paths_json)
    }));
}

export function deleteBandById(id) {
  const result = getDb()
    .prepare("DELETE FROM bands WHERE id = ?")
    .run(id);

  if (result.changes === 0) {
    throw new Error("Artist not found.");
  }
}

export function markProfileSubmissionsTakedownByBandName(bandName) {
  getDb()
    .prepare(`
      UPDATE profile_submissions
      SET status = 'takedown',
        updated_at = CURRENT_TIMESTAMP
      WHERE lower(band_name) = lower(?)
    `)
    .run(bandName);
}

export function createTakedownLog({ adminUserId, action, targetType, targetLabel, reason, details }) {
  getDb()
    .prepare(`
      INSERT INTO takedown_log (
        admin_user_id,
        action,
        target_type,
        target_label,
        reason,
        details_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(adminUserId, action, targetType, targetLabel, reason, JSON.stringify(details || {}));
}

export function getTakedownLog(limit = 20) {
  return getDb()
    .prepare(`
      SELECT takedown_log.*, admin_users.username AS admin_username
      FROM takedown_log
      LEFT JOIN admin_users ON admin_users.id = takedown_log.admin_user_id
      ORDER BY datetime(takedown_log.created_at) DESC, takedown_log.id DESC
      LIMIT ?
    `)
    .all(limit)
    .map((entry) => ({
      ...entry,
      details: parseJsonObject(entry.details_json)
    }));
}

export function publishProfileSubmission(id) {
  const database = getDb();
  const submission = getProfileSubmissionById(id);

  if (!submission) {
    throw new Error("Profile submission not found.");
  }

  const photoPath = submission.photoPaths[0] || "";
  const audioPath = normalizeSubmissionAudioPath(submission.audioPaths[0]);
  const websiteUrl = submission.links[0] || "";
  const genre = submission.genre || "local";
  const hometown = submission.hometown || "New Mexico";

  database.exec("BEGIN");
  try {
    const existingBand = database
      .prepare("SELECT id FROM bands WHERE lower(name) = lower(?)")
      .get(submission.band_name);

    if (existingBand) {
      database
        .prepare(`
          UPDATE bands
          SET genre = ?,
            hometown = ?,
            bio = ?,
            image_path = ?,
            audio_path = ?,
            website_url = ?,
            featured = 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .run(genre, hometown, submission.bio, photoPath, audioPath, websiteUrl, existingBand.id);
    } else {
      database
        .prepare(`
          INSERT INTO bands (
            name,
            slug,
            genre,
            hometown,
            bio,
            image_path,
            audio_path,
            website_url,
            featured
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        `)
        .run(submission.band_name, buildUniqueBandSlug(submission.band_name), genre, hometown, submission.bio, photoPath, audioPath, websiteUrl);
    }

    database
      .prepare(`
        UPDATE profile_submissions
        SET status = 'reviewed',
          reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .run(id);

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export const markProfileSubmissionReviewed = publishProfileSubmission;

function publishMissingReviewedProfiles(database) {
  const reviewedSubmissions = database
    .prepare(`
      SELECT *
      FROM profile_submissions
      WHERE status = 'reviewed'
      ORDER BY datetime(reviewed_at) ASC, id ASC
    `)
    .all();

  reviewedSubmissions.forEach((submission) => {
    const existingBand = database
      .prepare("SELECT id FROM bands WHERE lower(name) = lower(?)")
      .get(submission.band_name);

    if (existingBand) {
      return;
    }

    const photoPaths = parseJsonList(submission.photo_paths_json);
    const audioPaths = parseJsonList(submission.audio_paths_json);
    const links = parseJsonList(submission.links_json);

    database
      .prepare(`
        INSERT INTO bands (
          name,
          slug,
          genre,
          hometown,
          bio,
          image_path,
          audio_path,
          website_url,
          featured
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `)
      .run(
        submission.band_name,
        buildUniqueBandSlug(submission.band_name),
        submission.genre || "local",
        submission.hometown || "New Mexico",
        submission.bio,
        photoPaths[0] || "",
        normalizeSubmissionAudioPath(audioPaths[0]),
        links[0] || ""
      );
  });
}

function normalizeSubmissionAudioPath(audio) {
  if (!audio) {
    return "";
  }

  return typeof audio === "string" ? audio : audio.path || "";
}

function parseJsonList(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function buildUniqueArticleSlug(title) {
  const baseSlug = slugify(title) || `article-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;

  while (getDb().prepare("SELECT id FROM articles WHERE slug = ?").get(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function buildUniqueBandSlug(name) {
  const baseSlug = slugify(name) || `artist-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 2;

  while (getDb().prepare("SELECT id FROM bands WHERE slug = ?").get(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}
