import { ArticleCard } from "@/components/ArticleCard";
import { getArticlesBySection } from "@/lib/db";

export const metadata = {
  title: "OK Gramps | Route666.live"
};

export default function OkGrampsPage() {
  const articles = getArticlesBySection("ok_gramps");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="paper-edge border-4 border-ink bg-newsprint p-6 text-ink shadow-flyer">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-rust">Local newspaper for people who missed the paper</p>
        <h1 className="mt-3 font-display text-5xl uppercase sm:text-7xl">OK Gramps</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8">
          Scene notes, interviews, old-man rants, cheap wisdom, and dispatches from the back booth.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
      </div>
    </div>
  );
}
