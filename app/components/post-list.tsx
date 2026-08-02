import type { FC } from "hono/jsx";
import { toSlashDate } from "../lib/date";
import { getAllPosts } from "../lib/posts";
import type { PostMeta } from "../lib/posts";

/*
 * 一覧＝書き足していく索引。
 *
 * デザインには「← 写真12枚、まだ半分しか貼ってない」のようなエンジの走り書きや、
 * 取消線での書き直し、矢印の注記が混ざっている。README が
 * 「実データでは frontmatter やビルドで制御、乱発しない」としている通り、
 * 出どころになるフィールドがまだ無いので入れていない。
 */

interface PostListProps {
  /* タグ・カテゴリ配下の一覧から `/tag/Rust/posts/` のような prefix を渡して使い回す */
  linkPrefix?: string;
  posts: PostMeta[];
}

/* 行ごとに傾きを変える。全部同じだと定規で書いたように見える */
const TILTS = ["-0.4deg", "0.3deg", "-0.2deg", "0.4deg", "-0.3deg"];

const tiltOf = (index: number): string => TILTS[index % TILTS.length] ?? "0deg";

/* 最新の1件だけ字を大きくする。どこから読めばいいか分かるように */
const titleSizeOf = (index: number): string => {
  if (index === 0) {
    return "lg:text-lead-lg";
  }
  return "lg:text-lead";
};

/* モバイルは日付とカテゴリを1行にまとめる。狭い画面で横に並べると索引に見えない */
const metaTextOf = (post: PostMeta): string => {
  if (post.category === "") {
    return toSlashDate(post.createdAt);
  }
  return `${toSlashDate(post.createdAt)} ・ ${post.category}`;
};

const PostList: FC<PostListProps> = ({ linkPrefix = "/posts/", posts }) => (
  <ul class="flex flex-col">
    {posts.map((post, index) => (
      <li key={post.slug}>
        <a
          class="post-row min-h-11 flex-col items-start gap-0 py-[9px] lg:min-h-0 lg:flex-row lg:items-baseline lg:gap-4 lg:py-0"
          href={`${linkPrefix}${post.slug}`}
          style={`rotate: ${tiltOf(index)}`}
        >
          <time class="hidden lg:block" dateTime={post.createdAt}>
            {toSlashDate(post.createdAt)}
          </time>
          <span
            class={`text-[15.5px] leading-[1.55] font-semibold text-ink-strong lg:leading-[inherit] ${titleSizeOf(index)}`}
          >
            {post.title}
          </span>
          <span class="text-[12px] text-ink-faint lg:hidden">{metaTextOf(post)}</span>
          {post.tags.length > 0 && (
            <span class="hidden shrink-0 text-[13px] text-ink-soft lg:inline">
              {post.tags.map((tag) => `#${tag}`).join(" ")}
            </span>
          )}
        </a>
      </li>
    ))}
  </ul>
);

/*
 * ヘッダーのサイト名の右に添える走り書き。
 * 「8/1 現在」の日付はビルド日ではなく最新記事の日付にしてある。
 * ビルド日にすると記事を書いていない日のビルドでも差分が出る
 */
const PostsHeadNote: FC<{ currentPage: number; totalPages: number }> = ({
  currentPage,
  totalPages,
}) => {
  const posts = getAllPosts();
  const [latest] = posts;

  return (
    <>
      {latest !== undefined && `${toSlashDate(latest.createdAt)} 現在 `}
      <span class="font-label">{posts.length}</span>本 ・{" "}
      <span class="font-label tracking-[0.08em]">
        page {currentPage} / {totalPages}
      </span>
    </>
  );
};

export { PostList, PostsHeadNote };
