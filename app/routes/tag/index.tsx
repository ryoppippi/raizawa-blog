import { createRoute } from "honox/factory";
import { Layout } from "../../components/layout";
import { HandRule } from "../../components/paper";
import { SITE_TITLE, SITE_URL } from "../../lib/config";
import { getCategories, getPostsByCategory, getPostsByTag, getTags } from "../../lib/posts";

/*
 * タグ雲は頻度を字の大きさだけで示す。
 * 囲みを付けると「四角枠はカテゴリ / note / rss / 現在ページの4か所」の決まりを破るので、
 * バッジにはしない。件数は EB Garamond で小さく添えるだけ。
 */
const MAX_FONT_SIZE = 26;
const MIN_FONT_SIZE = 14;
/* 600 に切り替える境目。これ未満は 400 のまま置いて雲の粒を細かくする */
const BOLD_FONT_SIZE = 18;
const MAX_COUNT_FONT_SIZE = 14;
const MIN_COUNT_FONT_SIZE = 12;

/* 最頻タグを 26px、1件のタグを 14px として線形に割り当てる。
 * 対数にすると件数の少ないタグまで持ち上がって、雲が平らに見える */
const tagFontSize = (count: number, maxCount: number): number => {
  if (maxCount <= 1) {
    return MIN_FONT_SIZE;
  }
  const ratio = (count - 1) / (maxCount - 1);
  return Math.round(MIN_FONT_SIZE + ratio * (MAX_FONT_SIZE - MIN_FONT_SIZE));
};

/* 添える数字はタグ本体より一回り小さく、12〜14px の間だけ動かす */
const countFontSize = (fontSize: number): number => {
  const ratio = (fontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE);
  return Math.round(MIN_COUNT_FONT_SIZE + ratio * (MAX_COUNT_FONT_SIZE - MIN_COUNT_FONT_SIZE));
};

/* 大きいタグだけ 600 で沈める。小さいものは本文と同じ濃さに留めて雲を騒がしくしない */
const tagClass = (fontSize: number): string => {
  if (fontSize >= BOLD_FONT_SIZE) {
    return "font-semibold text-ink-strong";
  }
  return "text-ink-body";
};

export default createRoute((c) => {
  const tags = getTags()
    .map((tag) => ({ count: getPostsByTag(tag).length, tag }))
    .toSorted((tagA, tagB) => {
      if (tagA.count !== tagB.count) {
        return tagB.count - tagA.count;
      }
      return tagA.tag.localeCompare(tagB.tag);
    });
  const maxCount = tags[0]?.count ?? 1;

  const categories = getCategories().map((category) => ({
    category,
    count: getPostsByCategory(category).length,
  }));

  return c.render(
    <Layout
      title={`tags - ${SITE_TITLE}`}
      description="タグ一覧"
      nav="tags"
      ogUrl={`${SITE_URL}/tag`}
    >
      <main class="body-col">
        <h1 class="text-h2 font-semibold text-ink-strong" style="rotate: -0.3deg">
          タグ
        </h1>
        <p class="mt-[6px] mb-[22px] text-[14px] leading-[2] text-ink-body">
          よく書いているものは字を大きく。数字は添えるだけにした。
        </p>

        <div class="mb-[30px] flex flex-wrap items-baseline gap-x-5 gap-y-[14px]">
          {tags.map(({ count, tag }) => {
            const fontSize = tagFontSize(count, maxCount);
            return (
              <a
                key={tag}
                href={`/tag/${tag}`}
                class={tagClass(fontSize)}
                style={`font-size: ${fontSize}px`}
              >
                {tag}
                <span
                  class="ml-[5px] font-label font-normal text-ink-soft"
                  style={`font-size: ${countFontSize(fontSize)}px`}
                >
                  {count}
                </span>
              </a>
            );
          })}
        </div>

        <section class="relative pt-4">
          <HandRule thin class="absolute inset-x-0 top-0" />
          <h2 class="label mb-[14px] tracking-[0.12em]">categories</h2>
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
        </section>
      </main>
    </Layout>,
  );
});
