import { redirect } from "next/navigation";

export default async function OkGrampsArticleRedirectPage({ params }) {
  const { slug } = await params;
  redirect(`/articles/${slug}`);
}
