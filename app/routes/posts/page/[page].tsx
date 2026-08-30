import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { Layout } from "../../../components/layout";
import { PageHeader } from "../../../components/page-header";
import { Pagination } from "../../../components/pagination";
import { PostList } from "../../../components/post-list";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../../../lib/config";
import { getPostsForPage, getTotalPages } from "../../../lib/posts";

const SECOND_PAGE = 2;

export default createRoute(
  ssgParams(() => {
    const totalPages = getTotalPages();
    const pages = [];
    for (let pageNum = SECOND_PAGE; pageNum <= totalPages; pageNum += 1) {
      pages.push({ page: String(pageNum) });
    }
    return pages;
  }),
  (c) => {
    const pageParam = c.req.param("page");
    const currentPage = Number.parseInt(pageParam ?? "1", 10);
    const totalPages = getTotalPages();

    if (Number.isNaN(currentPage) || currentPage < 1 || currentPage > totalPages) {
      return c.notFound();
    }

    const posts = getPostsForPage(currentPage);

    return c.render(
      <Layout
        title={`ブログ記事一覧 - ページ ${currentPage} - ${SITE_TITLE}`}
        description={SITE_DESCRIPTION}
        ogUrl={`${SITE_URL}/posts/page/${currentPage}`}
      >
        <PageHeader title={`ブログ記事一覧 - ページ ${currentPage}`} />
        <main>
          <PostList posts={posts} />
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </main>
      </Layout>,
    );
  },
);
