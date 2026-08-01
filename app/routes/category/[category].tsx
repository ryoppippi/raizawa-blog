import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { HandRule } from "../../components/paper";
import { PostList } from "../../components/post-list";
import { SITE_TITLE, SITE_URL } from "../../lib/config";
import { getCategories, getPostsByCategory } from "../../lib/posts";

export default createRoute(
  ssgParams(() => getCategories().map((category) => ({ category }))),
  (c) => {
    const category = c.req.param("category");
    if (category === undefined || category === "") {
      return c.notFound();
    }

    const posts = getPostsByCategory(category);
    if (posts.length === 0) {
      return c.notFound();
    }

    return c.render(
      <Layout
        title={`${category} - ${SITE_TITLE}`}
        description={`${category}の記事一覧`}
        nav="tags"
        ogUrl={`${SITE_URL}/category/${category}`}
      >
        <main class="body-col">
          {/* カテゴリの手書き囲みは記事の行の中で使う印なので、見出しでは重ねない */}
          <header class="relative flex items-baseline justify-between gap-4 pb-4">
            <h1 class="text-h2 font-semibold text-ink-strong">{category}</h1>
            <span class="label-date shrink-0">{posts.length} posts</span>
            <HandRule thin class="absolute inset-x-0 bottom-0" />
          </header>

          <PostList posts={posts} linkPrefix={`/category/${category}/posts/`} />
        </main>
      </Layout>,
    );
  },
);
