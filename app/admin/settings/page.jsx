import Link from "next/link";
import { redirect } from "next/navigation";
import siteDefaults from "@/data/site-defaults.json";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getSiteSetting } from "@/lib/db";

export const metadata = {
  title: "Site Settings | Route666.live"
};

export const dynamic = "force-dynamic";

const homepageIntroLimit = 1000;
const sidebarHeadlineLimit = 120;
const sidebarTextLimit = 600;

export default async function AdminSettingsPage({ searchParams }) {
  const query = await searchParams;
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const homepageIntro = getSiteSetting("homepage_intro", siteDefaults.homepage_intro);
  const sidebarHeadline = getSiteSetting("homepage_sidebar_headline", siteDefaults.homepage_sidebar_headline);
  const sidebarText = getSiteSetting("homepage_sidebar_text", siteDefaults.homepage_sidebar_text);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Front window copy</p>
          <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Site Settings</h1>
          <p className="mt-3 font-mono text-xs uppercase text-newsprint">Signed in as {admin.username}</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs uppercase">
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/messages">Messages</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/profiles">Profiles</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/radio">Schedule radio</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-rust hover:text-rust" href="/admin/takedown">Takedowns</Link>
        </div>
      </div>

      <form action="/api/admin/settings" className="mt-8 grid gap-5 border-2 border-newsprint bg-ink p-5 shadow-glow" method="post">
        <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
          Homepage intro text
          <textarea
            className="min-h-56 border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio"
            maxLength={homepageIntroLimit}
            name="homepageIntro"
            required
            defaultValue={homepageIntro}
          />
          <span className="text-xs text-newsprint/80">{homepageIntroLimit} characters max. The homepage box will grow to fit the text.</span>
        </label>

        <div className="grid gap-4 border border-newsprint/35 p-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-arcade">Right-side homepage box</p>
            <h2 className="mt-2 font-display text-3xl uppercase text-bone">AM 666 Copy</h2>
          </div>
          <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
            Box headline
            <input
              className="border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio"
              maxLength={sidebarHeadlineLimit}
              name="sidebarHeadline"
              required
              defaultValue={sidebarHeadline}
            />
            <span className="text-xs text-newsprint/80">{sidebarHeadlineLimit} characters max.</span>
          </label>
          <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
            Box text
            <textarea
              className="min-h-36 border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio"
              maxLength={sidebarTextLimit}
              name="sidebarText"
              required
              defaultValue={sidebarText}
            />
            <span className="text-xs text-newsprint/80">{sidebarTextLimit} characters max. Line breaks will be kept on the homepage.</span>
          </label>
        </div>

        <button className="w-fit border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" type="submit">
          Save Settings
        </button>
        {query?.saved ? <p className="font-mono text-sm text-arcade">Settings saved.</p> : null}
        {query?.error ? <p className="font-mono text-sm text-rust">Could not save that text.</p> : null}
      </form>
    </div>
  );
}
