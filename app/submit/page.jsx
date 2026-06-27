import { FileText, Image, Link as LinkIcon, Music2, Send } from "lucide-react";

export const metadata = {
  title: "Submit Profile | Route666.live"
};

export const dynamic = "force-dynamic";

const errorMessages = {
  missing: "Band name, email, and bio are required.",
  bio: "Bio must be 1200 characters or fewer.",
  photo: "Upload at least one photo.",
  songTitle: "Each uploaded MP3 needs a song title.",
  permission: "You must give Route666.live permission to stream submitted music.",
  file: "Only JPG, PNG, WEBP, GIF, and MP3 uploads are accepted.",
  upload: "The upload broke up. Check file sizes and try again."
};

export default async function SubmitProfilePage({ searchParams }) {
  const query = await searchParams;
  const error = errorMessages[query?.error];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <aside className="paper-edge border-4 border-ink bg-newsprint p-6 text-ink shadow-flyer sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-rust">Get on the wall</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-6xl">Submit Profile</h1>
          <p className="mt-5 leading-8">
            Send the basics directly to Route666. No Google form, no polished press kit required.
          </p>
          <div className="mt-6 grid gap-3 font-mono text-sm uppercase">
            <ProfileItem icon={<FileText size={18} />} text="Bio up to 1200 characters" />
            <ProfileItem icon={<Image size={18} />} text="1 to 3 photos, 10MB each" />
            <ProfileItem icon={<Music2 size={18} />} text="Up to 3 MP3s, 50MB each" />
            <ProfileItem icon={<Music2 size={18} />} text="Original music only. No covers allowed." />
            <ProfileItem icon={<LinkIcon size={18} />} text="Music / socials / website links" />
          </div>
        </aside>

        <form action="/api/profile-submissions" className="border-2 border-newsprint bg-ink p-5 shadow-glow" encType="multipart/form-data" method="post">
          <div className="grid gap-5">
            <input autoComplete="off" className="hidden" name="website" tabIndex={-1} />
            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="Band / Artist Name" name="bandName" required />
              <TextField label="Contact Email" name="contactEmail" required type="email" />
              <TextField label="Contact Name" name="contactName" />
              <TextField label="Genre" name="genre" />
              <TextField label="Hometown" name="hometown" />
            </div>
            <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
              Bio
              <textarea className="min-h-44 border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" maxLength={1200} name="bio" required />
              <span className="text-xs text-newsprint/80">1200 characters max.</span>
            </label>
            <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
              Links
              <textarea className="min-h-28 border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="links" placeholder="One link per line: Bandcamp, Spotify, YouTube, Instagram, website..." />
            </label>
            <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
              Photos
              <input accept="image/jpeg,image/png,image/webp,image/gif" className="border-2 border-newsprint bg-tar px-3 py-3 text-bone file:mr-4 file:border-0 file:bg-radio file:px-3 file:py-2 file:font-mono file:text-sm file:uppercase file:text-ink" multiple name="photos" required type="file" />
            </label>
            <fieldset className="grid gap-4 border-2 border-newsprint p-4">
              <legend className="px-2 font-mono text-sm uppercase text-radio">Songs</legend>
              <SongUpload number={1} />
              <SongUpload number={2} />
              <SongUpload number={3} />
            </fieldset>
            <label className="flex items-start gap-3 border-2 border-radio bg-tar p-4 text-newsprint">
              <input className="mt-1 h-5 w-5 accent-[#f2d35d]" name="streamPermission" required type="checkbox" value="yes" />
              <span className="leading-7">
                By checking this box, I confirm this is original music and no covers are included. I give Route666.live permission to stream the music I submit. The music will not be offered as a download. This is a community endeavor and nobody is making money from this site.
              </span>
            </label>
            <button className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer transition hover:bg-arcade" type="submit">
              <Send size={16} />
              Send Profile
            </button>
            {query?.sent ? <p className="font-mono text-sm text-arcade">Profile received. It is in the admin inbox.</p> : null}
            {error ? <p className="font-mono text-sm text-rust">{error}</p> : null}
          </div>
        </form>
      </section>
    </div>
  );
}

function ProfileItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3 border-2 border-ink bg-bone px-3 py-3">
      <span className="grid h-9 w-9 place-items-center border-2 border-rust text-rust">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function TextField({ label, name, type = "text", required = false }) {
  return (
    <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
      {label}
      <input className="border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name={name} required={required} type={type} />
    </label>
  );
}

function SongUpload({ number }) {
  return (
    <div className="grid gap-3 border border-newsprint/40 bg-tar p-3 md:grid-cols-[1fr_1.2fr]">
      <TextField label={`Song ${number} Title`} name={`songTitle${number}`} />
      <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
        Song {number} MP3
        <input accept=".mp3,audio/mpeg" className="border-2 border-newsprint bg-ink px-3 py-3 text-bone file:mr-4 file:border-0 file:bg-radio file:px-3 file:py-2 file:font-mono file:text-sm file:uppercase file:text-ink" name={`mp3${number}`} type="file" />
      </label>
    </div>
  );
}
