import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { PageHeader } from "../../components/page-header";
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
        ogUrl={`${SITE_URL}/category/${category}`}
      >
        <PageHeader title={category} />

        <main>
          <PostList posts={posts} linkPrefix={`/category/${category}/posts/`} />
        </main>
      </Layout>,
    );
  },
);
