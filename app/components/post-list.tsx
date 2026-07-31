import type { FC } from "hono/jsx";
import { toShortEnglishDate } from "../lib/date";
import { getCategories, getPostsByCategory, getPostsByTag, getTags } from "../lib/posts";
import type { PostMeta } from "../lib/posts";

/*
 * 記事一覧。
 * デザインでは最新記事だけ大きな白フチ写真のブロックになっているが、
 * 写真は未提供で frontmatter に cover も無いので、最新記事も同じ1行で並べている。
 */

interface PostListProps {
  /* タグ・カテゴリ配下の一覧から `/tag/Rust/posts/` のような prefix を渡して使い回す */
  linkPrefix?: string;
  posts: PostMeta[];
}

const PostList: FC<PostListProps> = ({ linkPrefix = "/posts/", posts }) => (
  <ul class="flex flex-col gap-[2px]">
    {posts.map((post) => (
      <li key={post.slug}>
        <a
          class="post-row min-h-11 flex-col items-start gap-[5px] px-[10px] py-3 lg:min-h-0 lg:flex-row lg:items-center lg:gap-4 lg:px-[14px] lg:py-[14px]"
          href={`${linkPrefix}${post.slug}`}
        >
          {/* モバイルは日付とカテゴリを1行にまとめる。デスクトップは lg:contents で束ねを解いて
              日付｜カテゴリ｜タイトル｜#タグ の4カラムに戻す */}
          <span class="flex shrink-0 items-baseline gap-[6px] lg:contents">
            <time class="label-date tracking-[0.12em]" datetime={post.createdAt}>
              {toShortEnglishDate(post.createdAt)}
            </time>
            {post.category !== "" && (
              <>
                <span class="text-ink-faint lg:hidden" aria-hidden="true">
                  ・
                </span>
                <span class="shrink-0 text-[12.5px] text-green">{post.category}</span>
              </>
            )}
          </span>
          <span class="min-w-0 flex-1 text-[16.5px] leading-[1.6] font-semibold lg:text-lead">
            {post.title}
          </span>
          {/* タグは行の中では字だけ。囲みは カテゴリ / note / rss / 現在ページ の4か所に限る */}
          {post.tags.length > 0 && (
            <span class="hidden shrink-0 font-mono text-tag text-ink-soft lg:inline">
              {post.tags.map((tag) => `#${tag}`).join(" ")}
            </span>
          )}
        </a>
      </li>
    ))}
  </ul>
);

interface PostsHeadingProps {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

/* `posts` ＋ 細い1px罫線 ＋ 件数とページ番号 */
const PostsHeading: FC<PostsHeadingProps> = ({ currentPage, totalPages, totalPosts }) => (
  <div class="mb-6 flex items-baseline gap-[14px]">
    <h1 class="label-heading">posts</h1>
    <span class="h-px flex-1 bg-[rgb(31_61_43_/_0.2)]" aria-hidden="true" />
    <span class="label-date tracking-[0.16em] whitespace-nowrap">
      {/* 狭い画面では件数を落とす。折り返すと罫線が2段になって紙に見えない */}
      <span class="hidden lg:inline">{totalPosts} posts ・ </span>
      page {currentPage} / {totalPages}
    </span>
  </div>
);

const SIDE_TAG_LIMIT = 12;

interface TagCount {
  count: number;
  name: string;
}

/* 件数の多い順。同数は名前順にして、ビルドのたびに並びが変わらないようにする */
const countedTags = (): TagCount[] => {
  const tags = getTags().map((name) => ({ count: getPostsByTag(name).length, name }));
  tags.sort((tagA, tagB) => {
    if (tagA.count !== tagB.count) {
      return tagB.count - tagA.count;
    }
    return tagA.name.localeCompare(tagB.name);
  });
  return tags.slice(0, SIDE_TAG_LIMIT);
};

const countedCategories = (): TagCount[] => {
  const categories = getCategories()
    .filter((name) => name !== "")
    .map((name) => ({ count: getPostsByCategory(name).length, name }));
  categories.sort((categoryA, categoryB) => categoryB.count - categoryA.count);
  return categories;
};

/*
 * 一覧のサイド（240px）。
 * デザインの `about`（顔写真＋2行）と `最近の写真` は写真が未提供なので出していない。
 * タグは字の大きさを変えずに並べる（タグ雲は /tag に任せる）。
 */
const PostsAside: FC = () => (
  <aside class="hidden flex-col gap-6 lg:flex">
    <section class="flex flex-col gap-2">
      <h2 class="label">categories</h2>
      {countedCategories().map((category) => (
        <a
          key={category.name}
          class="flex justify-between gap-3 text-meta-lg text-ink-strong"
          href={`/category/${category.name}`}
        >
          {category.name}
          <span class="font-label text-ink-faint">{category.count}</span>
        </a>
      ))}
    </section>
    <section class="flex flex-col gap-2">
      <h2 class="label">tags</h2>
      <div class="flex flex-wrap gap-x-3 gap-y-[6px]">
        {countedTags().map((tag) => (
          <a key={tag.name} class="text-meta-lg text-ink-strong" href={`/tag/${tag.name}`}>
            {tag.name}
            <span class="ml-[5px] font-label text-ink-faint">{tag.count}</span>
          </a>
        ))}
      </div>
    </section>
  </aside>
);

export { PostList, PostsAside, PostsHeading };
