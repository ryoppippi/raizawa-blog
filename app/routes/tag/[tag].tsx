import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { HandRule } from "../../components/paper";
import { PostList } from "../../components/post-list";
import { SITE_TITLE, SITE_URL } from "../../lib/config";
import { getPostsByTag, getTags } from "../../lib/posts";

export default createRoute(
  ssgParams(() => getTags().map((tag) => ({ tag }))),
  (c) => {
    const tag = c.req.param("tag");
    if (tag === undefined || tag === "") {
      return c.notFound();
    }

    const posts = getPostsByTag(tag);
    if (posts.length === 0) {
      return c.notFound();
    }

    return c.render(
      <Layout
        title={`${tag} - ${SITE_TITLE}`}
        description={`${tag}の記事一覧`}
        nav="tags"
        ogUrl={`${SITE_URL}/tag/${tag}`}
      >
        <main class="sheet-narrow pt-8 pb-14">
          {/* 見出しはタグ名そのまま。タグは囲まない決まりなので枠は付けない */}
          <header class="relative flex items-baseline justify-between gap-4 pb-4">
            <h1 class="text-h2 font-semibold text-ink-strong">{tag}</h1>
            <span class="label-date shrink-0">{posts.length} posts</span>
            <HandRule thin class="absolute inset-x-0 bottom-0" />
          </header>

          <PostList posts={posts} linkPrefix={`/tag/${tag}/posts/`} />
        </main>
      </Layout>,
    );
  },
);
