import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { Pagination } from "../../components/pagination";
import { PostList, PostsAside, PostsHeading } from "../../components/post-list";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../../lib/config";
import { getAllPosts, getPostsForPage, getTotalPages } from "../../lib/posts";

const FIRST_PAGE = 1;

export default createRoute((c) => {
  const posts = getPostsForPage(FIRST_PAGE);
  const totalPages = getTotalPages();

  return c.render(
    <Layout
      title={`ブログ記事一覧 - ${SITE_TITLE}`}
      description={SITE_DESCRIPTION}
      nav="posts"
      ogUrl={`${SITE_URL}/posts`}
    >
      <div class="sheet grid gap-10 pt-6 pb-10 lg:grid-cols-[1fr_240px] lg:pt-8 lg:pb-[46px]">
        <main class="min-w-0">
          <PostsHeading
            currentPage={FIRST_PAGE}
            totalPages={totalPages}
            totalPosts={getAllPosts().length}
          />
          <PostList posts={posts} />
          <Pagination currentPage={FIRST_PAGE} totalPages={totalPages} />
        </main>
        <PostsAside />
      </div>
    </Layout>,
  );
});
