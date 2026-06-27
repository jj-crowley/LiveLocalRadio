export const metadata = {
  title: "Admin Setup Disabled | Route666.live"
};

export const dynamic = "force-dynamic";

export default function AdminSetupPage() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Backend only</p>
      <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Setup Disabled</h1>
      <div className="mt-8 border-2 border-newsprint bg-ink p-5">
        <p className="leading-7 text-newsprint">First admin accounts must be created from the server terminal.</p>
        <pre className="mt-4 overflow-x-auto border border-newsprint/40 bg-tar p-3 font-mono text-sm text-arcade">
          npm run admin:create -- username strong-password
        </pre>
      </div>
    </div>
  );
}
