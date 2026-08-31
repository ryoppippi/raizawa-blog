import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { PageHeader } from "../../components/page-header";
import { SITE_TITLE, SITE_URL } from "../../lib/config";
import { getCategories, getPostsByCategory } from "../../lib/posts";

export default createRoute((c) => {
  const categories = getCategories();

  return c.render(
    <Layout
      title={`カテゴリ一覧 - ${SITE_TITLE}`}
      description="カテゴリ一覧"
      ogUrl={`${SITE_URL}/category`}
    >
      <PageHeader title="カテゴリ一覧" />

      <main>
        <ul class="space-y-phi-4">
          {categories.map((category) => {
            const posts = getPostsByCategory(category);
            return (
              <li class="card bg-base-100 shadow-sm" key={category}>
                <div class="card-body p-phi-4">
                  <h2 class="card-title">
                    <a href={`/category/${category}`} class="link link-hover">
                      {category}
                    </a>
                  </h2>
                  <div class="text-sm text-base-content/70">{posts.length}件の記事</div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </Layout>,
  );
});
