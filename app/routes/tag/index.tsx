import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { PageHeader } from "../../components/page-header";
import { SITE_TITLE, SITE_URL } from "../../lib/config";
import { getPostsByTag, getTags } from "../../lib/posts";

export default createRoute((c) => {
  const tags = getTags();

  return c.render(
    <Layout title={`タグ一覧 - ${SITE_TITLE}`} description="タグ一覧" ogUrl={`${SITE_URL}/tag`}>
      <PageHeader title="タグ一覧" />

      <main>
        <ul class="space-y-4">
          {tags.map((tag) => {
            const posts = getPostsByTag(tag);
            return (
              <li class="card bg-base-100 shadow-sm" key={tag}>
                <div class="card-body p-4">
                  <h2 class="card-title">
                    <a href={`/tag/${tag}`} class="link link-hover">
                      {tag}
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
