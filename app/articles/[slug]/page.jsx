import { notFound } from "next/navigation";
import { getArticleBySlug, getArticles } from "@/lib/db";

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return { title: "Article Not Found | Route666.live" };
  }

  return { title: `${article.title} | Route666.live` };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="paper-edge border-4 border-ink bg-newsprint p-6 text-ink shadow-flyer sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-rust">
          {article.author} / {article.published_at}
        </p>
        <h1 className="mt-4 font-display text-5xl uppercase leading-none sm:text-7xl">{article.title}</h1>
        <p className="mt-6 text-xl leading-8">{article.excerpt}</p>
      </div>
      {article.image_path ? (
        <img className="mt-8 aspect-[16/9] w-full border-4 border-newsprint object-cover shadow-flyer" src={article.image_path} alt={article.title} />
      ) : null}
      <div className="mt-10 border-l-4 border-radio pl-5 text-lg leading-9 text-newsprint">
        {article.body.split("\n\n").map((paragraph) => (
          <p className="mb-6" key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
