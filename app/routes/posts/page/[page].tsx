import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { Layout } from "../../../components/layout";
import { Pagination } from "../../../components/pagination";
import { PostList, PostsHeadNote } from "../../../components/post-list";
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
        description={SITE_DESCRIPTION}
        headNote={<PostsHeadNote currentPage={currentPage} totalPages={totalPages} />}
        nav="posts"
        ogUrl={`${SITE_URL}/posts/page/${currentPage}`}
        title={`記事 ${currentPage}枚目 - ${SITE_TITLE}`}
      >
        <main class="body-col">
          <PostList posts={posts} />
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </main>
      </Layout>,
    );
  },
);
