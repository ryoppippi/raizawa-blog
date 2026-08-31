import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { PageHeader } from "../../components/page-header";
import { Pagination } from "../../components/pagination";
import { PostList } from "../../components/post-list";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../../lib/config";
import { getPostsForPage, getTotalPages } from "../../lib/posts";

export default createRoute((c) => {
  const currentPage = 1;
  const posts = getPostsForPage(currentPage);
  const totalPages = getTotalPages();

  return c.render(
    <Layout
      title={`ブログ記事一覧 - ${SITE_TITLE}`}
      description={SITE_DESCRIPTION}
      ogUrl={`${SITE_URL}/posts`}
    >
      <PageHeader title="ブログ記事一覧" />
      <main>
        <PostList posts={posts} />
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </main>
    </Layout>,
  );
});
