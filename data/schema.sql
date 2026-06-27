PRAGMA foreign_keys = ON;

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

CREATE INDEX IF NOT EXISTS idx_shows_starts_at ON shows(starts_at);
CREATE INDEX IF NOT EXISTS idx_show_submissions_status ON show_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_profile_submissions_status ON profile_submissions(status);
CREATE INDEX IF NOT EXISTS idx_articles_section ON articles(section);
CREATE INDEX IF NOT EXISTS idx_bands_slug ON bands(slug);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
