import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getContactMessagesForAdmin } from "@/lib/db";

export const metadata = {
  title: "Contact Messages | Route666.live"
};

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage({ searchParams }) {
  const query = await searchParams;
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const messages = getContactMessagesForAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Incoming transmissions</p>
          <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Contact Messages</h1>
          <p className="mt-3 font-mono text-xs uppercase text-newsprint">Signed in as {admin.username}</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono text-xs uppercase">
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/articles">New article</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/radio">Schedule radio</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/profiles">Profiles</Link>
          <Link className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-radio hover:text-radio" href="/admin/accounts">Admin accounts</Link>
          <form action="/api/admin/logout" method="post">
            <button className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-rust hover:text-rust" type="submit">Log out</button>
          </form>
        </div>
      </div>

      {query?.read ? <p className="mt-6 font-mono text-sm text-arcade">Message marked read.</p> : null}
      {query?.error ? <p className="mt-6 font-mono text-sm text-rust">Could not update that message.</p> : null}

      <div className="mt-8 grid gap-5">
        {messages.length === 0 ? (
          <div className="border-2 border-newsprint bg-ink p-5 text-newsprint">No contact messages yet.</div>
        ) : messages.map((message) => (
          <article className="border-2 border-newsprint bg-ink p-5" key={message.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase text-arcade">{message.created_at}</p>
                <h2 className="mt-2 font-display text-3xl uppercase leading-none text-bone">{message.name}</h2>
                <a className="mt-2 block font-mono text-sm text-radio hover:text-arcade" href={`mailto:${message.email}`}>
                  {message.email}
                </a>
              </div>
              <span className={`w-fit border px-2 py-1 font-mono text-xs uppercase ${message.status === "new" ? "border-radio text-radio" : "border-newsprint text-newsprint"}`}>
                {message.status}
              </span>
            </div>
            <p className="mt-5 whitespace-pre-wrap leading-8 text-newsprint">{message.message}</p>
            {message.status === "new" ? (
              <form action={`/api/admin/messages/${message.id}/read`} className="mt-5" method="post">
                <button className="border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" type="submit">
                  Mark Read
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
