import { redirect } from "next/navigation";
import { getCurrentAdmin, hasAdminUsers } from "@/lib/adminAuth";

export const metadata = {
  title: "Admin Login | Route666.live"
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }) {
  const query = await searchParams;
  const adminsExist = hasAdminUsers();

  if (await getCurrentAdmin()) {
    redirect("/admin/messages");
  }

  return (
    <AdminShell eyebrow="Back booth access" title="Admin Login">
      {adminsExist ? (
        <form action="/api/admin/login" className="grid gap-4 border-2 border-newsprint bg-ink p-5" method="post">
          <TextField label="Username" name="username" required />
          <TextField label="Password" name="password" required type="password" />
          <button className="w-fit border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" type="submit">
            Log In
          </button>
          {query?.error ? <p className="font-mono text-sm text-rust">Login failed. Check the username and password.</p> : null}
        </form>
      ) : (
        <div className="border-2 border-newsprint bg-ink p-5">
          <p className="leading-7 text-newsprint">
            No admin account exists yet. Create the first admin from the server terminal.
          </p>
          <pre className="mt-4 overflow-x-auto border border-newsprint/40 bg-tar p-3 font-mono text-sm text-arcade">
            npm run admin:create -- username strong-password
          </pre>
        </div>
      )}
    </AdminShell>
  );
}

function AdminShell({ eyebrow, title, children }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">{eyebrow}</p>
      <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">{title}</h1>
      <div className="mt-8">{children}</div>
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
