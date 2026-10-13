import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getProfileSubmissionsForAdmin } from "@/lib/db";

export const metadata = {
  title: "Profile Submissions | Route666.live"
};

export const dynamic = "force-dynamic";

export default async function AdminProfilesPage({ searchParams }) {
  const query = await searchParams;
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const submissions = getProfileSubmissionsForAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Band intake</p>
          <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Profile Submissions</h1>
          <p className="mt-3 font-mono text-xs uppercase text-newsprint">Signed in as {admin.username}</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs uppercase">
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/articles">New article</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/radio">Schedule radio</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/messages">Messages</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/settings">Settings</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/accounts">Admin accounts</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-rust hover:text-rust" href="/admin/takedown">Takedowns</Link>
          <form action="/api/admin/logout" method="post">
            <button className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-rust hover:text-rust" type="submit">Log out</button>
          </form>
        </div>
      </div>

      {query?.published ? <p className="mt-6 font-mono text-sm text-arcade">Profile published to the artist page.</p> : null}
      {query?.reviewed ? <p className="mt-6 font-mono text-sm text-arcade">Profile marked reviewed.</p> : null}
      {query?.error ? <p className="mt-6 font-mono text-sm text-rust">Could not update that profile.</p> : null}

      <div className="mt-8 grid gap-5">
        {submissions.length === 0 ? (
          <div className="border-2 border-newsprint bg-ink p-5 text-newsprint">No profile submissions yet.</div>
        ) : submissions.map((submission) => (
          <article className="border-2 border-newsprint bg-ink p-5" key={submission.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase text-arcade">{submission.created_at}</p>
                <h2 className="mt-2 font-display text-3xl uppercase leading-none text-bone">{submission.band_name}</h2>
                <a className="mt-2 block font-mono text-sm text-radio hover:text-arcade" href={`mailto:${submission.contact_email}`}>
                  {submission.contact_email}
                </a>
                <p className="mt-2 font-mono text-xs uppercase text-newsprint">
                  {[submission.genre, submission.hometown, submission.contact_name].filter(Boolean).join(" / ")}
                </p>
              </div>
              <span className={`w-fit border px-2 py-1 font-mono text-xs uppercase ${submission.status === "new" ? "border-radio text-radio" : "border-newsprint text-newsprint"}`}>
                {submission.status}
              </span>
            </div>
            <p className="mt-5 whitespace-pre-wrap leading-8 text-newsprint">{submission.bio}</p>
            <div className={`mt-5 border p-3 font-mono text-xs uppercase ${submission.stream_permission ? "border-radio text-radio" : "border-rust text-rust"}`}>
              {submission.stream_permission ? "Streaming permission granted" : "Streaming permission missing"}
              {submission.stream_permission_text ? (
                <p className="mt-2 font-body text-sm normal-case leading-6 text-newsprint">{submission.stream_permission_text}</p>
              ) : null}
            </div>

            {submission.links.length ? (
              <div className="mt-5 grid gap-2 font-mono text-sm">
                {submission.links.map((link) => (
                  <a className="break-all text-arcade hover:text-radio" href={link} key={link} rel="noreferrer" target="_blank">{link}</a>
                ))}
              </div>
            ) : null}

            {submission.photoPaths.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {submission.photoPaths.map((photo) => (
                  <a href={photo} key={photo} rel="noreferrer" target="_blank">
                    <img alt={`${submission.band_name} submission`} className="aspect-square w-full border-2 border-newsprint object-cover" src={photo} />
                  </a>
                ))}
              </div>
            ) : null}

            {submission.audioPaths.length ? (
              <div className="mt-5 grid gap-3">
                {submission.audioPaths.map((audio) => {
                  const audioPath = typeof audio === "string" ? audio : audio.path;
                  const title = typeof audio === "string" ? "" : audio.title;

                  return (
                    <div className="border border-newsprint/40 bg-tar p-3" key={audioPath}>
                      {title ? <p className="mb-2 font-mono text-xs uppercase text-radio">{title}</p> : null}
                      <audio className="w-full" controls src={audioPath} />
                    </div>
                  );
                })}
              </div>
            ) : null}

            <form action={`/api/admin/profiles/${submission.id}/reviewed`} className="mt-5" method="post">
              <button className="border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" type="submit">
                {submission.status === "new" ? "Publish Artist Profile" : "Update Artist Profile"}
              </button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
