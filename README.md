# Route666.live

Full-stack Next.js application for underground local music, band profiles, radio, video embeds, and the OK Gramps newspaper section.

## Stack

- Node.js
- Next.js App Router
- React
- Tailwind CSS
- SQLite via Node's built-in `node:sqlite` module
- Local filesystem storage for images, MP3 files, and videos
- Ubuntu/nginx compatible deployment

## Quick Start

If you are using this as a template for a different local music site, configure the public site name and URL first:

```bash
npm run site:configure -- "YourSite.live" "https://yoursite.live"
```

Then install and start:

```bash
npm install
npm run db:init
npm run dev
```

Use Node.js 22.5+ for the built-in SQLite module. Node 24+ is recommended for deployment.

Open `http://localhost:3000`.

## Folder Structure

```text
app/                    Next.js pages, layout, API routes, and global styles
components/             Reusable layout and content components
data/                   SQLite schema and local database file after init
deploy/                 Ubuntu/nginx deployment examples
lib/                    SQLite access layer and upload helpers
public/                 Static public assets
scripts/                Database initialization script
storage/uploads/        Local image and MP3 upload storage
storage/radio/          MP3s for the site-wide streaming rotation
storage/videos/         Local video files for unlisted embeddable video pages
```

## Database

Initialize the local database:

```bash
npm run db:init
```

Default database path is `data/route666.db`. Override it with:

```bash
ROUTE666_DB_PATH=/absolute/path/route666.db npm run db:init
```

## Uploads

Uploaded images and MP3 files are stored under `storage/uploads` by default. Override with:

```bash
ROUTE666_UPLOAD_DIR=/absolute/path/uploads npm run dev
```

## Radio Rotation

Drop MP3s into:

```text
storage/radio
```

For scheduled weekday programming, use:

```text
storage/radio/sunday
storage/radio/monday
storage/radio/tuesday
storage/radio/wednesday
storage/radio/thursday
storage/radio/friday
storage/radio/saturday
```

The player chooses the folder for the current day, starts that day’s rotation at local midnight, and loops through that day’s tracks until the next midnight. If the current day folder is empty, it falls back to MP3s in the root `storage/radio` folder.

To keep an artist's songs together, put that artist's MP3s in a numbered artist folder:

```text
storage/radio/monday/
  001-the-static-saints/
    01 - First Song.mp3
    02 - Second Song.mp3
    03 - Third Song.mp3

  002-dust-cassette/
    01 - Dry River.mp3
    02 - Exit Sign.mp3
```

The player sorts artist folders by name, then sorts tracks inside each artist folder by filename. This creates consecutive artist blocks. Number prefixes such as `001-` and `01 -` are recommended.

If an MP3 has a matching metadata file, the player uses that title instead of guessing from the filename:

```text
01 - rough-upload-name.mp3
01 - rough-upload-name.mp3.json
```

Example metadata:

```json
{
  "artist": "The Static Saints",
  "title": "Midnight Tower"
}
```

Loose MP3s still work too:

```text
Band Name - Song Title.mp3
```

The site-wide player reads `/api/radio/tracks` and serves tracks from `/radio/<filename>` or `/radio/<day>/<artist-folder>/<filename>`. Override the directory with:

```bash
ROUTE666_RADIO_DIR=/absolute/path/radio npm run dev
```

The station day/time uses `America/Denver` by default. Override with:

```bash
ROUTE666_TIME_ZONE=America/Denver npm run dev
```

## Embeddable Band Video

Put a video file in:

```text
storage/videos
```

By default the app looks for:

```text
band-video.mp4
```

If that file is missing, it uses the first supported video file alphabetically. Supported formats are MP4, WEBM, and OGG. When more than one video is present, `/band/video` loads one primary video and lists the other videos below it so visitors can click one into the main player.

To add display metadata, place a JSON file beside the video using either the full filename or the base filename:

```text
storage/videos/desert-set.mp4
storage/videos/desert-set.json
```

Example metadata:

```json
{
  "title": "Desert Set",
  "band": "The Static Saints",
  "song": "Midnight Tower",
  "description": "Live room footage from the Mesa backline session.",
  "year": "2026",
  "venue": "Route 66 Bowl"
}
```

Unlisted page:

```text
/band/video
```

Iframe embed URL:

```text
/embed/band/video
```

Specific videos can be linked or embedded with a masked `v` query parameter. The share box on `/band/video` generates this for the selected video:

```text
/band/video?v=8f5d4f4c6a1e2b70
/embed/band/video?v=8f5d4f4c6a1e2b70
```

The public player uses masked media URLs:

```text
/videos/id/<video-id>
```

The original filename route still exists for backward compatibility, but generated page links, iframe links, and player source URLs do not expose filenames.

Override the directory or default filename with:

```bash
ROUTE666_VIDEO_DIR=/absolute/path/videos ROUTE666_BAND_VIDEO_FILE=band-video.mp4 npm run dev
```

API endpoint:

```text
POST /api/uploads
multipart/form-data field: file
```

## Artist Profile Intake

Bands can submit a profile through the native Route666 form at:

```text
/submit
```

The native form stores profile details in SQLite and uploads photos/MP3s into `storage/uploads`.

Fields collected:

- Band / artist name
- Contact name and email
- Genre and hometown
- Bio up to 1200 characters
- One to three photos, 10MB each
- Up to three MP3s, 50MB each, each with its own song title field
- Website, Bandcamp, YouTube, Instagram, and other links

Submitted MP3s save a matching `.json` metadata file beside the upload. Move both the MP3 and its `.json` file into the radio folder when scheduling it.

Admins can review profile submissions at:

```text
/admin/profiles
```

Create the first admin account from the server terminal:

```bash
npm run admin:create -- username strong-password
```

After logging in, existing admins can create additional accounts at `/admin/accounts`.

Contact form messages are saved to SQLite and can be reviewed at `/admin/messages`.

## Production Notes

Build with:

```bash
npm run build
```

Run behind nginx with the sample config in `deploy/nginx.route666.live.conf`.
