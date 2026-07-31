import { ssgParams } from "hono/ssg";
import { createRoute } from "honox/factory";
import { Layout } from "../../../components/layout";
import { Pagination } from "../../../components/pagination";
import { PostList, PostsAside, PostsHeading } from "../../../components/post-list";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../../../lib/config";
import { getAllPosts, getPostsForPage, getTotalPages } from "../../../lib/posts";

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
        nav="posts"
        ogUrl={`${SITE_URL}/posts/page/${currentPage}`}
      >
        <div class="sheet grid gap-10 pt-6 pb-10 lg:grid-cols-[1fr_240px] lg:pt-8 lg:pb-[46px]">
          <main class="min-w-0">
            <PostsHeading
              currentPage={currentPage}
              totalPages={totalPages}
              totalPosts={getAllPosts().length}
            />
            <PostList posts={posts} />
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </main>
          <PostsAside />
        </div>
      </Layout>,
    );
  },
);
