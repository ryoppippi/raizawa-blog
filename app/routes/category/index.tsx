import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { SITE_TITLE, SITE_URL } from "../../lib/config";
import { getCategories, getPostsByCategory } from "../../lib/posts";

export default createRoute((c) => {
  const categories = getCategories().map((category) => ({
    category,
    count: getPostsByCategory(category).length,
  }));

  return c.render(
    <Layout
      title={`categories - ${SITE_TITLE}`}
      description="カテゴリ一覧"
      nav="tags"
      ogUrl={`${SITE_URL}/category`}
    >
      <main class="body-col">
        {/* タグ一覧の下半分と同じ行。カテゴリは3つしかないので雲にはしない */}
        <h1 class="mb-[18px] text-h2 font-semibold text-ink-strong" style="rotate: -0.3deg">
          分類
        </h1>
        <div class="flex flex-col gap-[2px]">
          {categories.map(({ category, count }) => (
            <a
              key={category}
              href={`/category/${category}`}
              class="post-row items-baseline justify-between px-3 py-[11px]"
            >
              <span class="text-lead font-semibold">{category}</span>
              <span class="label-date">{count} posts</span>
            </a>
          ))}
        </div>
      </main>
    </Layout>,
  );
});
