import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { PageHeader } from "../../components/page-header";
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
        ogUrl={`${SITE_URL}/tag/${tag}`}
      >
        <PageHeader title={tag} />

        <main>
          <PostList posts={posts} linkPrefix={`/tag/${tag}/posts/`} />
        </main>
      </Layout>,
    );
  },
);
