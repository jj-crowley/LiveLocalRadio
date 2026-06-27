import Link from "next/link";
import { CassetteTape, Mic2, Radio, Send } from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { BandCard } from "@/components/BandCard";
import { getArticlesBySection, getFeaturedBands } from "@/lib/db";
import { getRadioState } from "@/lib/radio";

export const metadata = {
  title: "Local Noise | Route666.live"
};

export const dynamic = "force-dynamic";

export default function LocalNoisePage() {
  const bands = getFeaturedBands(4);
  const articles = getArticlesBySection("local_noise");
  const radio = getRadioState();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_.75fr]">
        <div className="paper-edge border-4 border-ink bg-newsprint p-6 text-ink shadow-flyer sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-rust">Basement demos, desert amps, after-hours radio</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-none sm:text-7xl">Local Noise</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8">
            The loose wire between the bands, the radio box, flyer drops, MP3s, and the scene reports that do not fit cleanly anywhere else.
          </p>
        </div>
        <aside className="border-2 border-newsprint bg-ink p-5">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-arcade">Now wired into the rotation</p>
          <h2 className="mt-3 font-display text-3xl uppercase text-bone">
            {radio.nowPlaying?.track ? radio.nowPlaying.track.band : "Radio Waiting"}
          </h2>
          <p className="mt-2 font-mono text-sm uppercase text-radio">
            {radio.nowPlaying?.track ? radio.nowPlaying.track.song : "Drop MP3s into the radio folders"}
          </p>
          <p className="mt-4 leading-7 text-newsprint">
            The site player follows the day-of-week radio folders and loops whatever is loaded for the day.
          </p>
        </aside>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <NoiseLink href="/artists" icon={<Mic2 size={22} />} label="Artists / Bands" text="Browse the acts currently taped to the Route666 wall." />
        <NoiseLink href="/submit" icon={<Send size={22} />} label="Submit Profile" text="Send a bio, photo, and links through the intake form." />
        <NoiseLink href="/contact" icon={<CassetteTape size={22} />} label="Send Music" text="Contact the station about MP3s, demos, scans, and scene notes." />
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center gap-3">
          <Radio className="text-arcade" size={24} />
          <h2 className="font-display text-3xl uppercase text-bone">Interviews / Articles</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {articles.length ? (
            articles.map((article) => <ArticleCard article={article} key={article.id} />)
          ) : (
            <div className="border-2 border-newsprint bg-ink p-5 text-newsprint md:col-span-2">
              No Local Noise interviews posted yet.
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center gap-3">
          <Radio className="text-arcade" size={24} />
          <h2 className="font-display text-3xl uppercase text-bone">Featured Artists</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {bands.map((band) => <BandCard band={band} key={band.id} />)}
        </div>
      </section>
    </div>
  );
}

function NoiseLink({ href, icon, label, text }) {
  return (
    <Link className="border-2 border-newsprint bg-ink p-5 transition hover:-translate-y-1 hover:border-radio" href={href}>
      <span className="grid h-11 w-11 place-items-center border-2 border-arcade text-arcade">{icon}</span>
      <span className="mt-4 block font-display text-3xl uppercase leading-none text-bone">{label}</span>
      <span className="mt-3 block leading-7 text-newsprint">{text}</span>
    </Link>
  );
}
