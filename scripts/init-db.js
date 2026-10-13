const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const siteDefaults = require("../data/site-defaults.json");

const projectRoot = process.cwd();
const dbPath = process.env.ROUTE666_DB_PATH || path.join(projectRoot, "data", "route666.db");
const schemaPath = path.join(projectRoot, "data", "schema.sql");
const shouldBackupReset = process.argv.includes("--backup-reset");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.mkdirSync(path.join(projectRoot, "storage", "uploads"), { recursive: true });

if (shouldBackupReset) {
  backupAndResetDatabase(dbPath);
}

const db = new DatabaseSync(dbPath);
const schema = fs.readFileSync(schemaPath, "utf8");

db.exec(schema);

function ensureShowsColumns() {
  const showColumns = db
    .prepare("PRAGMA table_info(shows)")
    .all()
    .map((column) => column.name);

  if (!showColumns.includes("band_name")) {
    db.exec("ALTER TABLE shows ADD COLUMN band_name TEXT");
  }

  if (!showColumns.includes("genre")) {
    db.exec("ALTER TABLE shows ADD COLUMN genre TEXT");
  }

  if (!showColumns.includes("age_restriction")) {
    db.exec("ALTER TABLE shows ADD COLUMN age_restriction TEXT NOT NULL DEFAULT 'all ages'");
  }
}

ensureShowsColumns();

function ensureArticleColumns() {
  const articleColumns = db
    .prepare("PRAGMA table_info(articles)")
    .all()
    .map((column) => column.name);

  if (!articleColumns.includes("section")) {
    db.exec("ALTER TABLE articles ADD COLUMN section TEXT NOT NULL DEFAULT 'ok_gramps'");
  }
}

ensureArticleColumns();

const insertDefaultSiteSetting = db.prepare(`
  INSERT OR IGNORE INTO site_settings (key, value)
  VALUES (?, ?)
`);

Object.entries(siteDefaults).forEach(([key, value]) => {
  insertDefaultSiteSetting.run(key, value);
});

const insertBand = db.prepare(`
  INSERT INTO bands (name, slug, genre, hometown, bio, featured)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    genre = excluded.genre,
    hometown = excluded.hometown,
    bio = excluded.bio,
    featured = excluded.featured,
    updated_at = CURRENT_TIMESTAMP
`);

const insertShow = db.prepare(`
  INSERT INTO shows (title, slug, venue, address, city, starts_at, band_name, genre, age_restriction, price, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    title = excluded.title,
    venue = excluded.venue,
    address = excluded.address,
    city = excluded.city,
    starts_at = excluded.starts_at,
    band_name = excluded.band_name,
    genre = excluded.genre,
    age_restriction = excluded.age_restriction,
    price = excluded.price,
    description = excluded.description,
    updated_at = CURRENT_TIMESTAMP
`);

const insertArticle = db.prepare(`
  INSERT INTO articles (title, slug, author, excerpt, body, section, published_at, featured)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    title = excluded.title,
    author = excluded.author,
    excerpt = excluded.excerpt,
    body = excluded.body,
    section = excluded.section,
    published_at = excluded.published_at,
    featured = excluded.featured,
    updated_at = CURRENT_TIMESTAMP
`);

const bands = [
  {
    name: "The Dry Heaves",
    slug: "the-dry-heaves",
    genre: "garage punk",
    hometown: "Tucson, AZ",
    bio: "Fast songs, cracked cymbals, and choruses that sound like a payphone argument.",
    featured: 1
  },
  {
    name: "Cactus Frequency",
    slug: "cactus-frequency",
    genre: "desert psych",
    hometown: "Las Cruces, NM",
    bio: "Reverb-heavy instrumentals for long drives and bad decisions.",
    featured: 1
  },
  {
    name: "Quarter Eater Saints",
    slug: "quarter-eater-saints",
    genre: "arcade rock",
    hometown: "Phoenix, AZ",
    bio: "Synth hooks, fuzz bass, and the haunted glow of a cabinet screen.",
    featured: 1
  },
  {
    name: "AM Static Choir",
    slug: "am-static-choir",
    genre: "lo-fi goth country",
    hometown: "Albuquerque, NM",
    bio: "Songs tuned between stations, carried by dusty harmonies and blown speakers.",
    featured: 0
  }
];

const shows = [
  {
    title: "Midnight Washout",
    slug: "midnight-washout",
    venue: "The Low Desert Room",
    address: "1126 Coyote Ave",
    city: "Tucson",
    starts_at: "2026-06-06T21:00:00-07:00",
    band_name: "The Dry Heaves",
    genre: "garage punk",
    age_restriction: "21+",
    price: "$8 cash",
    description: "The Dry Heaves headline a room hot enough to tune guitars sharp."
  },
  {
    title: "Quarter Drop All-Nighter",
    slug: "quarter-drop-all-nighter",
    venue: "Pixel Chapel",
    address: "404 Neon Spur",
    city: "Phoenix",
    starts_at: "2026-06-13T22:30:00-07:00",
    band_name: "Quarter Eater Saints",
    genre: "arcade rock",
    age_restriction: "all ages",
    price: "$10",
    description: "Arcade rock, busted joysticks, and a late set from Quarter Eater Saints."
  },
  {
    title: "Static Under The Overpass",
    slug: "static-under-the-overpass",
    venue: "Bridge Lot",
    address: "South frontage road",
    city: "Albuquerque",
    starts_at: "2026-06-20T20:00:00-06:00",
    band_name: "AM Static Choir",
    genre: "lo-fi goth country",
    age_restriction: "all ages",
    price: "donation",
    description: "Generator show with AM Static Choir and whoever finds the extension cord."
  },
  {
    title: "Cactus Moon Matinee",
    slug: "cactus-moon-matinee",
    venue: "The Mesquite Hall",
    address: "66 Old Route Rd",
    city: "Las Cruces",
    starts_at: "2026-06-28T17:00:00-06:00",
    band_name: "Cactus Frequency",
    genre: "desert psych",
    age_restriction: "21+",
    price: "$5",
    description: "Early show, desert psych, cold cans, home before the highway gets weird."
  }
];

const articles = [
  {
    title: "The Flyer Still Wins",
    slug: "the-flyer-still-wins",
    author: "OK Gramps",
    excerpt: "A stapled sheet on a telephone pole can still do what the algorithm refuses to do.",
    body: "You can spend all day optimizing a post and still lose to one crooked flyer taped outside a laundromat.\n\nThe flyer has weather, thumbprints, and intent. It knows exactly where it lives. It does not ask you to subscribe before telling you where the show is.",
    section: "ok_gramps",
    published_at: "2026-05-10",
    featured: 1
  },
  {
    title: "Bring Back Bad Demos",
    slug: "bring-back-bad-demos",
    author: "OK Gramps",
    excerpt: "Not every recording needs to arrive polished enough to sell a truck.",
    body: "A bad demo can be a map. You hear the room, the nerves, the drummer counting too loud, the singer finding the edge of the song.\n\nClean recordings are fine. But a scene needs rough drafts people can believe they are allowed to answer.",
    section: "ok_gramps",
    published_at: "2026-05-03",
    featured: 1
  },
  {
    title: "Late-Night Radio For People Who Missed The Exit",
    slug: "late-night-radio-for-people-who-missed-the-exit",
    author: "OK Gramps",
    excerpt: "The best station is the one you only get for eleven miles.",
    body: "At night, a weak signal feels earned. It drifts in sideways, full of weather reports, dedications, and songs nobody bothered to tag.\n\nThat is the standard. Make the thing specific enough that it cannot be mistaken for anywhere else.",
    section: "ok_gramps",
    published_at: "2026-04-26",
    featured: 0
  }
];

if (process.env.ROUTE666_SEED_DEMO === "1") {
  try {
    db.exec("BEGIN");
    bands.forEach((band) => {
      insertBand.run(band.name, band.slug, band.genre, band.hometown, band.bio, band.featured);
    });
    shows.forEach((show) => {
      insertShow.run(
        show.title,
        show.slug,
        show.venue,
        show.address,
        show.city,
        show.starts_at,
        show.band_name,
        show.genre,
        show.age_restriction,
        show.price,
        show.description
      );
    });
    articles.forEach((article) => {
      insertArticle.run(article.title, article.slug, article.author, article.excerpt, article.body, article.section, article.published_at, article.featured);
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

db.close();

console.log(`Route666 database initialized at ${dbPath}`);

function backupAndResetDatabase(databasePath) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  const backupDir = path.join(path.dirname(databasePath), "backups");
  const backupBase = path.join(backupDir, `${path.basename(databasePath)}.${timestamp}`);
  const files = [
    databasePath,
    `${databasePath}-wal`,
    `${databasePath}-shm`
  ];
  const existingFiles = files.filter((file) => fs.existsSync(file));

  fs.mkdirSync(backupDir, { recursive: true });

  if (existingFiles.length) {
    existingFiles.forEach((file) => {
      fs.copyFileSync(file, `${backupBase}${file.slice(databasePath.length)}`);
    });
  }

  existingFiles.forEach((file) => {
    fs.unlinkSync(file);
  });

  if (existingFiles.length) {
    console.log(`Backed up existing database to ${backupBase}`);
  } else {
    console.log("No existing database found. Creating a fresh database.");
  }
}
