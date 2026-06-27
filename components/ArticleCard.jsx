import Link from "next/link";
import { Newspaper } from "lucide-react";

export function ArticleCard({ article }) {
  return (
    <article className="paper-edge border-2 border-ink bg-newsprint p-5 text-ink shadow-flyer">
      <div className="flex items-center gap-2 font-mono text-xs uppercase text-rust">
        <Newspaper size={16} />
        <span>{article.author} / {article.published_at}</span>
      </div>
      {article.image_path ? (
        <img className="mt-4 aspect-[16/9] w-full border-2 border-ink object-cover" src={article.image_path} alt={article.title} />
      ) : null}
      <h3 className="mt-3 font-display text-3xl uppercase leading-none">{article.title}</h3>
      <p className="mt-4 leading-7">{article.excerpt}</p>
      <Link className="mt-4 inline-block font-mono text-xs uppercase text-rust hover:text-bruise" href={`/articles/${article.slug}`}>
        Read dispatch
      </Link>
    </article>
  );
}
