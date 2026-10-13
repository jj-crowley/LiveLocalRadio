import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUsers, getCurrentAdmin } from "@/lib/adminAuth";

export const metadata = {
  title: "Admin Accounts | Route666.live"
};

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage({ searchParams }) {
  const query = await searchParams;
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  const admins = getAdminUsers();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Keys for trusted hands</p>
      <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Admin Accounts</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs uppercase">
        <p className="text-newsprint">Signed in as {admin.username}</p>
        <form action="/api/admin/logout" method="post">
          <button className="border border-newsprint/35 px-3 py-2 text-newsprint hover:border-rust hover:text-rust" type="submit">
            Log out
          </button>
        </form>
      </div>
      <section className="mt-8 border-2 border-newsprint bg-ink p-5">
        <h2 className="font-display text-3xl uppercase text-bone">Existing Admins</h2>
        <div className="mt-4 grid gap-2">
          {admins.map((account) => (
            <div className="flex items-center justify-between gap-4 border border-newsprint/35 bg-tar px-3 py-2 font-mono text-sm text-newsprint" key={account.id}>
              <span>{account.username}</span>
              <span className="text-arcade">{account.created_at}</span>
            </div>
          ))}
        </div>
      </section>
      <form action="/api/admin/accounts/password" className="mt-6 grid gap-4 border-2 border-newsprint bg-ink p-5" method="post">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-arcade">Your account only</p>
          <h2 className="mt-2 font-display text-3xl uppercase text-bone">Change Password</h2>
          <p className="mt-2 leading-7 text-newsprint">This changes the password for {admin.username}. Admins cannot change passwords for other admin accounts from this page.</p>
        </div>
        <TextField label="Current Password" name="currentPassword" required type="password" />
        <TextField label="New Password" name="newPassword" required type="password" />
        <TextField label="Confirm New Password" name="confirmPassword" required type="password" />
        <button className="w-fit border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" type="submit">
          Change My Password
        </button>
        {query?.passwordChanged ? <p className="font-mono text-sm text-arcade">Password changed.</p> : null}
        {query?.passwordError ? <p className="font-mono text-sm text-rust">Could not change password. Check the current password and use matching new passwords with at least 8 characters.</p> : null}
      </form>
      <form action="/api/admin/accounts" className="mt-6 grid gap-4 border-2 border-newsprint bg-ink p-5" method="post">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-arcade">Invite another trusted hand</p>
          <h2 className="mt-2 font-display text-3xl uppercase text-bone">Create Admin</h2>
        </div>
        <TextField label="New Username" name="username" required />
        <TextField label="Password" name="password" required type="password" />
        <button className="w-fit border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer hover:bg-arcade" type="submit">
          Create Admin
        </button>
        {query?.created ? <p className="font-mono text-sm text-arcade">Admin created.</p> : null}
        {query?.error ? <p className="font-mono text-sm text-rust">Could not create admin. Use a unique username and at least 8 characters for the password.</p> : null}
      </form>
      <div className="mt-5 flex flex-wrap gap-3 font-mono text-xs uppercase">
        <Link className="text-arcade hover:text-radio" href="/admin/messages">Messages</Link>
        <Link className="text-arcade hover:text-radio" href="/admin/profiles">Profiles</Link>
        <Link className="text-arcade hover:text-radio" href="/admin/articles">New article</Link>
        <Link className="text-arcade hover:text-radio" href="/admin/radio">Schedule radio</Link>
        <Link className="text-arcade hover:text-radio" href="/admin/settings">Settings</Link>
        <Link className="text-rust hover:text-radio" href="/admin/takedown">Takedowns</Link>
      </div>
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
