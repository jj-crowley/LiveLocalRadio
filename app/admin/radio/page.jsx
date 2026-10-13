import Link from "next/link";
import { redirect } from "next/navigation";
import { Radio } from "lucide-react";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getProfileSubmissionsForAdmin } from "@/lib/db";
import { radioDays } from "@/lib/radio";

export const metadata = {
  title: "Schedule Radio | Route666.live"
};

export const dynamic = "force-dynamic";

export default async function AdminRadioPage({ searchParams }) {
  const query = await searchParams;
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const submissions = getProfileSubmissionsForAdmin()
    .filter((submission) => submission.stream_permission && submission.audioPaths.length);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Broadcast desk</p>
          <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Schedule Radio</h1>
          <p className="mt-3 font-mono text-xs uppercase text-newsprint">Signed in as {admin.username}</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs uppercase">
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/profiles">Profiles</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/messages">Messages</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/articles">New article</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/settings">Settings</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-rust hover:text-rust" href="/admin/takedown">Takedowns</Link>
        </div>
      </div>

      {query?.scheduled ? <p className="mt-6 font-mono text-sm text-arcade">Artist block scheduled for radio.</p> : null}
      {query?.error ? <p className="mt-6 font-mono text-sm text-rust">Could not schedule that submission. Check day, block number, files, and streaming permission.</p> : null}

      <div className="mt-8 grid gap-5">
        {submissions.length ? submissions.map((submission) => (
          <article className="border-2 border-newsprint bg-ink p-5" key={submission.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase text-arcade">{submission.created_at}</p>
                <h2 className="mt-2 font-display text-3xl uppercase leading-none text-bone">{submission.band_name}</h2>
                <p className="mt-2 font-mono text-xs uppercase text-radio">{submission.audioPaths.length} song{submission.audioPaths.length === 1 ? "" : "s"} ready</p>
              </div>
              <span className="w-fit border border-radio px-2 py-1 font-mono text-xs uppercase text-radio">permission granted</span>
            </div>

            <div className="mt-5 grid gap-2">
              {submission.audioPaths.map((audio, index) => {
                const title = typeof audio === "string" ? `Song ${index + 1}` : audio.title || `Song ${index + 1}`;
                return <p className="font-mono text-sm uppercase text-newsprint" key={`${submission.id}-${index}`}>{String(index + 1).padStart(2, "0")} / {title}</p>;
              })}
            </div>

            <form action="/api/admin/radio/schedule" className="mt-5 grid gap-4 border border-newsprint/40 bg-tar p-4 md:grid-cols-[1fr_140px_auto]" method="post">
              <input name="submissionId" type="hidden" value={submission.id} />
              <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
                Day
                <select className="border-2 border-newsprint bg-ink px-3 py-3 text-bone outline-none focus:border-radio" name="day" required>
                  {radioDays.map((day) => <option key={day} value={day}>{day}</option>)}
                </select>
              </label>
              <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
                Block
                <input className="border-2 border-newsprint bg-ink px-3 py-3 text-bone outline-none focus:border-radio" min="1" max="999" name="blockNumber" required type="number" />
              </label>
              <button className="inline-flex h-fit items-center justify-center gap-2 self-end border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" type="submit">
                <Radio size={16} />
                Schedule
              </button>
            </form>
          </article>
        )) : (
          <div className="border-2 border-newsprint bg-ink p-5 text-newsprint">
            No submissions with MP3s and streaming permission yet.
          </div>
        )}
      </div>
    </div>
  );
}
