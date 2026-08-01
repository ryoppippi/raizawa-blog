import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { Pagination } from "../../components/pagination";
import { PostList, PostsHeadNote } from "../../components/post-list";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../../lib/config";
import { getPostsForPage, getTotalPages } from "../../lib/posts";

const FIRST_PAGE = 1;

export default createRoute((c) => {
  const posts = getPostsForPage(FIRST_PAGE);
  const totalPages = getTotalPages();

  return c.render(
    <Layout
      description={SITE_DESCRIPTION}
      headNote={<PostsHeadNote currentPage={FIRST_PAGE} totalPages={totalPages} />}
      nav="posts"
      ogUrl={`${SITE_URL}/posts`}
      title={`記事 - ${SITE_TITLE}`}
    >
      {/* 見出し欄（赤線の左）は Layout がサイトの目次を描くので、ここでは持たない */}
      <main class="body-col">
        <PostList posts={posts} />
        <Pagination currentPage={FIRST_PAGE} totalPages={totalPages} />
      </main>
    </Layout>,
  );
});
