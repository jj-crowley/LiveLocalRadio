import { Radio, Send } from "lucide-react";

export const metadata = {
  title: "Contact | Route666.live"
};

export default async function ContactPage({ searchParams }) {
  const query = await searchParams;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-radio">Get on the wire</p>
        <h1 className="mt-3 font-display text-5xl uppercase text-bone sm:text-6xl">Contact</h1>
        <p className="mt-5 max-w-xl leading-8 text-newsprint">
          Send corrections, website feedback or ideas, article pitches, radio notes, and rumors with receipts.
        </p>
        <div className="mt-6 flex items-center gap-3 font-mono text-sm text-arcade">
          <Radio size={18} />
          <span>station@route666.live</span>
        </div>
      </section>
      <form action="/api/contact" className="border-2 border-newsprint bg-ink p-5" method="post">
        <div className="grid gap-4">
          <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
            Name
            <input className="border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="name" required />
          </label>
          <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
            Email
            <input className="border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="email" required type="email" />
          </label>
          <label className="grid gap-2 font-mono text-sm uppercase text-newsprint">
            Transmission
            <textarea className="min-h-40 border-2 border-newsprint bg-tar px-3 py-3 font-body text-base normal-case text-bone outline-none focus:border-radio" name="message" required />
          </label>
          <button className="inline-flex w-fit items-center gap-2 border-2 border-ink bg-radio px-4 py-3 font-mono text-sm uppercase text-ink shadow-flyer transition hover:bg-arcade" type="submit">
            <Send size={16} />
            Send Signal
          </button>
          {query?.sent ? <p className="font-mono text-sm text-arcade">Signal received. We will read it in the admin inbox.</p> : null}
          {query?.error ? <p className="font-mono text-sm text-rust">The signal broke up. Fill out every field and try again.</p> : null}
        </div>
      </form>
    </div>
  );
}
