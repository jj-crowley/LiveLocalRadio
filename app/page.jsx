import { ArticleCard } from "@/components/ArticleCard";
import { BandCard } from "@/components/BandCard";
import { RadioSchedule } from "@/components/RadioSchedule";
import { getArticlesBySection, getBandByName, getFeaturedArticles, getFeaturedBands } from "@/lib/db";
import { getRadioSchedule } from "@/lib/radio";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const bands = getFeaturedBands(3);
  const articles = getFeaturedArticles(2, "ok_gramps");
  const homeArticles = getArticlesBySection("home");
  const radioSchedule = getRadioSchedule();
  const currentArtist = getBandByName(radioSchedule.nowPlaying?.track?.band);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
        <div className="paper-edge border-4 border-ink bg-bone p-6 text-ink shadow-flyer sm:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-rust">Broadcasting from the shoulder of the lost highway</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl uppercase leading-[0.9] sm:text-7xl lg:text-8xl">
            Route666.live
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8">
            Bands with busted amps, newsprint dispatches, desert radio drift, and the signal that only comes in after midnight.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 font-mono text-xs uppercase">
            <a className="border-2 border-ink bg-rust px-3 py-2 text-bone hover:bg-ink" href="/submit">Submit Profile</a>
            <a className="border-2 border-ink bg-radio px-3 py-2 text-ink hover:bg-ink hover:text-radio" href="/ok-gramps">OK Gramps</a>
            <a className="border-2 border-ink bg-arcade px-3 py-2 text-ink hover:bg-ink hover:text-arcade" href="/local-noise">Local Noise</a>
          </div>
        </div>
        <aside className="border-2 border-newsprint bg-ink p-5 shadow-glow">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-arcade">AM 666</p>
          <h2 className="mt-3 font-display text-3xl uppercase text-radio">Dead Air Is Still Air</h2>
          <p className="mt-4 leading-7 text-newsprint">
            Built for flyers taped to poles, MP3 demos recorded in storage units, and listings that do not need a velvet rope.
          </p>
          <div className="scanlines mt-6 border border-arcade/40 p-4 font-mono text-sm text-arcade">
            signal: live<br />
            weather: dry lightning<br />
            intake: open
          </div>
        </aside>
      </section>

      <RadioSchedule currentArtist={currentArtist} schedule={radioSchedule} />

      {homeArticles.length ? (
        <section>
          <h2 className="mb-4 font-display text-3xl uppercase text-bone">Route666 Desk</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {homeArticles.map((article) => <ArticleCard article={article} key={article.id} />)}
          </div>
        </section>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <h2 className="mb-4 font-display text-3xl uppercase text-bone">Bands</h2>
          <div className="grid gap-4">
            {bands.map((band) => <BandCard key={band.id} band={band} />)}
          </div>
        </div>
        <div>
          <h2 className="mb-4 font-display text-3xl uppercase text-bone">OK Gramps</h2>
          <div className="grid gap-4">
            {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
