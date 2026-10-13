import { ArticleCard } from "@/components/ArticleCard";
import { BandCard } from "@/components/BandCard";
import { RadioSchedule } from "@/components/RadioSchedule";
import siteDefaults from "@/data/site-defaults.json";
import { getArticlesBySection, getBandByName, getFeaturedArticles, getFeaturedBands, getSiteSetting } from "@/lib/db";
import { getRadioSchedule } from "@/lib/radio";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const bands = getFeaturedBands(3);
  const articles = getFeaturedArticles(2, "ok_gramps");
  const homeArticles = getArticlesBySection("home");
  const radioSchedule = getRadioSchedule();
  const currentArtist = getBandByName(radioSchedule.nowPlaying?.track?.band);
  const homepageIntro = getSiteSetting("homepage_intro", siteDefaults.homepage_intro);
  const sidebarHeadline = getSiteSetting("homepage_sidebar_headline", siteDefaults.homepage_sidebar_headline);
  const sidebarText = getSiteSetting("homepage_sidebar_text", siteDefaults.homepage_sidebar_text);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
        <div className="paper-edge border-4 border-ink bg-bone p-5 text-ink shadow-flyer sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">Broadcasting from the shoulder of the lost highway</p>
          <h1 className="mt-3 max-w-4xl font-display text-5xl uppercase leading-[0.9] sm:text-6xl lg:text-7xl">
            Route666.live
          </h1>
          <p className="mt-4 max-w-4xl whitespace-pre-wrap text-base leading-7 sm:text-lg">
            {homepageIntro}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 font-mono text-xs uppercase">
            <a className="border-2 border-ink bg-rust px-3 py-2 text-bone hover:bg-ink" href="/submit">Submit Profile</a>
            <a className="border-2 border-ink bg-radio px-3 py-2 text-ink hover:bg-ink hover:text-radio" href="/ok-gramps">OK Gramps</a>
            <a className="border-2 border-ink bg-arcade px-3 py-2 text-ink hover:bg-ink hover:text-arcade" href="/local-noise">Local Noise</a>
          </div>
        </div>
        <aside className="border-2 border-newsprint bg-ink p-5 shadow-glow">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-arcade">AM 666</p>
          <h2 className="mt-3 whitespace-pre-wrap font-display text-3xl uppercase text-radio">{sidebarHeadline}</h2>
          <p className="mt-4 whitespace-pre-wrap leading-7 text-newsprint">
            {sidebarText}
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
