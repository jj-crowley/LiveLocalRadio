import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Image, Send } from "lucide-react";
import { getCurrentAdmin } from "@/lib/adminAuth";

export const metadata = {
  title: "New Article | Route666.live"
};

export const dynamic = "force-dynamic";

const errors = {
  missing: "Title, excerpt, body, and placement are required.",
  image: "Photo must be JPG, PNG, WEBP, or GIF.",
  upload: "Could not save that article. Check the photo size and try again."
};

export default async function AdminArticlesPage({ searchParams }) {
  const query = await searchParams;
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Editorial desk</p>
          <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">New Article</h1>
          <p className="mt-3 font-mono text-xs uppercase text-newsprint">Signed in as {admin.username}</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs uppercase">
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/messages">Messages</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/profiles">Profiles</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/settings">Settings</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/accounts">Admin accounts</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-rust hover:text-rust" href="/admin/takedown">Takedowns</Link>
        </div>
      </div>

      <form action="/api/admin/articles" className="mt-8 grid gap-5 border-2 border-newsprint bg-ink p-5 shadow-glow" encType="multipart/form-data" method="post">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Title" name="title" required />
          <TextField label="Author" name="author" placeholder="Route666" />
        </div>
        <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
          Excerpt
          <textarea className="min-h-24 border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="excerpt" required />
        </label>
        <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
          Article Text
          <textarea className="min-h-80 border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="body" required />
        </label>
        <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
          Photo
          <span className="flex items-center gap-2 text-xs text-newsprint/80"><Image size={15} /> Optional, 10MB max.</span>
          <input accept="image/jpeg,image/png,image/webp,image/gif" className="border-2 border-newsprint bg-tar px-3 py-3 text-bone file:mr-4 file:border-0 file:bg-radio file:px-3 file:py-2 file:font-mono file:text-sm file:uppercase file:text-ink" name="photo" type="file" />
        </label>

        <fieldset className="grid gap-3 border-2 border-newsprint p-4">
          <legend className="px-2 font-mono text-sm uppercase text-radio">Placement</legend>
          <PlacementOption label="OK Gramps" name="section" value="ok_gramps" defaultChecked />
          <PlacementOption label="Local Noise" name="section" value="local_noise" />
          <PlacementOption label="Homepage / Other Page" name="section" value="home" />
        </fieldset>

        <label className="flex w-fit items-center gap-3 border border-newsprint/40 px-3 py-2 font-mono text-sm uppercase text-newsprint">
          <input name="featured" type="checkbox" value="1" />
          Feature this article
        </label>

        <button className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer transition hover:bg-arcade" type="submit">
          <Send size={16} />
          Publish Article
        </button>

        {query?.created ? <p className="font-mono text-sm text-arcade">Article published.</p> : null}
        {query?.error ? <p className="font-mono text-sm text-rust">{errors[query.error] || errors.upload}</p> : null}
      </form>
    </div>
  );
}

function TextField({ label, name, placeholder = "", required = false }) {
  return (
    <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
      {label}
      <input className="border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name={name} placeholder={placeholder} required={required} />
    </label>
  );
}

function PlacementOption({ defaultChecked = false, label, name, value }) {
  return (
    <label className="flex items-center gap-3 font-mono text-sm uppercase text-newsprint">
      <input defaultChecked={defaultChecked} name={name} required type="radio" value={value} />
      <FileText size={16} />
      {label}
    </label>
  );
}
