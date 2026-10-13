import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, FileX2, Radio, UserX } from "lucide-react";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getBands, getTakedownLog } from "@/lib/db";
import { getScheduledRadioInventory } from "@/lib/takedown";

export const metadata = {
  title: "Takedowns | Route666.live"
};

export const dynamic = "force-dynamic";

export default async function AdminTakedownPage({ searchParams }) {
  const query = await searchParams;
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const bands = getBands();
  const radioItems = getScheduledRadioInventory();
  const takedownLog = getTakedownLog(20);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-rust">Removal desk</p>
          <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Takedowns</h1>
          <p className="mt-3 font-mono text-xs uppercase text-newsprint">Signed in as {admin.username}</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs uppercase">
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/messages">Messages</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/profiles">Profiles</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/radio">Schedule radio</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/settings">Settings</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/accounts">Admin accounts</Link>
        </div>
      </div>

      {query?.artistRemoved ? <p className="mt-6 font-mono text-sm text-arcade">Artist takedown completed.</p> : null}
      {query?.radioRemoved ? <p className="mt-6 font-mono text-sm text-arcade">Radio takedown completed.</p> : null}
      {query?.error ? <p className="mt-6 font-mono text-sm text-rust">Could not complete that takedown. Check the reason field and selected item.</p> : null}

      <section className="mt-8 border-2 border-rust bg-ink p-5">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-rust">
          <AlertTriangle size={17} />
          Careful operation
        </div>
        <p className="mt-3 leading-7 text-newsprint">
          Takedowns remove public artist records and/or scheduled radio copies. Original uploaded submission files are kept unless you tick the delete-originals checkbox.
        </p>
      </section>

      <section className="mt-8 grid gap-5">
        <div className="flex items-center gap-2">
          <UserX className="text-radio" size={22} />
          <h2 className="font-display text-3xl uppercase text-bone">Published Artists</h2>
        </div>

        {bands.length ? bands.map((band) => (
          <article className="grid gap-4 border-2 border-newsprint bg-ink p-5 lg:grid-cols-[112px_1fr]" key={band.id}>
            {band.image_path ? (
              <img className="aspect-square w-full border-2 border-newsprint object-cover" src={band.image_path} alt={band.name} />
            ) : (
              <div className="grid aspect-square place-items-center border-2 border-newsprint bg-tar text-newsprint">No photo</div>
            )}
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-3xl uppercase leading-none text-bone">{band.name}</h3>
                  <p className="mt-2 font-mono text-xs uppercase text-radio">{[band.genre, band.hometown].filter(Boolean).join(" / ")}</p>
                </div>
                <span className="w-fit border border-newsprint/40 px-2 py-1 font-mono text-xs uppercase text-newsprint">public artist</span>
              </div>
              <p className="mt-4 line-clamp-3 leading-7 text-newsprint">{band.bio}</p>
              <form action="/api/admin/takedown/artist" className="mt-5 grid gap-3 border border-newsprint/40 bg-tar p-4" method="post">
                <input name="bandId" type="hidden" value={band.id} />
                <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
                  Reason / request note
                  <textarea className="min-h-24 border-2 border-newsprint bg-ink px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="reason" required />
                </label>
                <label className="flex items-start gap-3 font-mono text-xs uppercase leading-6 text-newsprint">
                  <input className="mt-1 accent-rust" name="deleteOriginals" type="checkbox" value="1" />
                  Also delete original uploaded photos and MP3s for matching submissions
                </label>
                <button className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-rust px-4 py-3 font-mono text-sm uppercase text-bone shadow-flyer hover:bg-radio hover:text-ink" type="submit">
                  <FileX2 size={16} />
                  Remove Artist + Radio Tracks
                </button>
              </form>
            </div>
          </article>
        )) : (
          <div className="border-2 border-newsprint bg-ink p-5 text-newsprint">No published artists found.</div>
        )}
      </section>

      <section className="mt-10 grid gap-5">
        <div className="flex items-center gap-2">
          <Radio className="text-radio" size={22} />
          <h2 className="font-display text-3xl uppercase text-bone">Scheduled Radio Tracks</h2>
        </div>

        {radioItems.length ? radioItems.map((item) => (
          <article className="border-2 border-newsprint bg-ink p-5" key={item.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase text-arcade">{item.dayLabel} / {item.blockName || "loose track"}</p>
                <h3 className="mt-2 font-display text-2xl uppercase leading-none text-bone">{item.band}</h3>
                <p className="mt-2 font-mono text-sm uppercase text-radio">{item.song}</p>
                <p className="mt-2 break-all font-mono text-xs text-newsprint">{item.relativePath}</p>
              </div>
            </div>
            <form action="/api/admin/takedown/radio" className="mt-5 grid gap-3 border border-newsprint/40 bg-tar p-4" method="post">
              <input name="day" type="hidden" value={item.day} />
              <input name="relativePath" type="hidden" value={item.relativePath} />
              <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
                Reason / request note
                <textarea className="min-h-20 border-2 border-newsprint bg-ink px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="reason" required />
              </label>
              <label className="flex items-start gap-3 font-mono text-xs uppercase leading-6 text-newsprint">
                <input className="mt-1 accent-rust" name="removeBlock" type="checkbox" value="1" disabled={!item.blockRelativePath} />
                Remove whole artist block for this day
              </label>
              <button className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-rust px-4 py-3 font-mono text-sm uppercase text-bone shadow-flyer hover:bg-radio hover:text-ink" type="submit">
                <FileX2 size={16} />
                Remove Radio Item
              </button>
            </form>
          </article>
        )) : (
          <div className="border-2 border-newsprint bg-ink p-5 text-newsprint">No scheduled radio tracks found.</div>
        )}
      </section>

      <section className="mt-10 border-2 border-newsprint bg-ink p-5">
        <h2 className="font-display text-3xl uppercase text-bone">Recent Takedown Log</h2>
        <div className="mt-5 grid gap-3">
          {takedownLog.length ? takedownLog.map((entry) => (
            <article className="border border-newsprint/40 bg-tar p-3" key={entry.id}>
              <p className="font-mono text-xs uppercase text-arcade">{entry.created_at} / {entry.admin_username || "unknown admin"} / {entry.action}</p>
              <h3 className="mt-2 font-display text-2xl uppercase text-bone">{entry.target_label}</h3>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-newsprint">{entry.reason}</p>
            </article>
          )) : (
            <p className="text-newsprint">No takedowns logged yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
