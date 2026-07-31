import type { FC } from "hono/jsx";
import { Layout } from "./layout";
import { Lightbox } from "./lightbox";
import { HandBox, HandRule, Signature } from "./paper";
import { MobileToc, TocLayout } from "./toc";
import { UpdatedAt } from "./updated-at";
import { SITE_TITLE, SITE_URL } from "../lib/config";
import { toLongEnglishDate } from "../lib/date";
import type { Post, PostMeta } from "../lib/posts";
import { readingMinutes } from "../lib/reading-time";

// 行番号は ::before の counter ではなく innerText に混ざるので、貼り付ける前に落とす
const copyScript = `document.querySelectorAll('.copy-button').forEach(button => {
  button.addEventListener('click', async () => {
    const wrapper = button.closest('.code-block-wrapper');
    const code = wrapper.querySelector('code');
    const text = code.innerText.replace(/^\\d+\\s*/gm, '');
    await navigator.clipboard.writeText(text);
    button.textContent = 'copied';
    button.classList.add('copied');
    setTimeout(() => { button.textContent = 'copy'; button.classList.remove('copied'); }, 2000);
  });
});`;

const PrevPostLink: FC<{ linkPrefix: string; prev: PostMeta | undefined }> = ({
  linkPrefix,
  prev,
}) => {
  if (prev === undefined) {
    return <div class="hidden lg:block" />;
  }
  return (
    <a class="group block min-h-11" href={`${linkPrefix}${prev.slug}`}>
      <span class="mb-[6px] block font-label text-meta tracking-[0.16em] text-crimson">← prev</span>
      <span class="block text-[15px] leading-[1.75] font-semibold text-ink-strong group-hover:text-crimson">
        {prev.title}
      </span>
    </a>
  );
};

const NextPostLink: FC<{ linkPrefix: string; next: PostMeta | undefined }> = ({
  linkPrefix,
  next,
}) => {
  if (next === undefined) {
    return <></>;
  }
  return (
    <a class="group block min-h-11 lg:text-right" href={`${linkPrefix}${next.slug}`}>
      <span class="mb-[6px] block font-label text-meta tracking-[0.16em] text-crimson">next →</span>
      <span class="block text-[15px] leading-[1.75] font-semibold text-ink-strong group-hover:text-crimson">
        {next.title}
      </span>
    </a>
  );
};

const PostNav: FC<{
  linkPrefix: string;
  next: PostMeta | undefined;
  prev: PostMeta | undefined;
}> = ({ linkPrefix, next, prev }) => {
  if (prev === undefined && next === undefined) {
    return <></>;
  }
  return (
    <nav class="relative mt-9 grid grid-cols-1 gap-[14px] pt-5 lg:grid-cols-2">
      <HandRule thin class="absolute inset-x-0 top-0" />
      <PrevPostLink prev={prev} linkPrefix={linkPrefix} />
      <NextPostLink next={next} linkPrefix={linkPrefix} />
    </nav>
  );
};

/* カテゴリの手書き囲み ＋ `July 28, 2026 ・ updated 07/30`
 * 日付は検索の抜粋に `03/27.` のような断片として出てしまうので索引から外す */
const PostMetaLine: FC<{ meta: PostMeta }> = ({ meta }) => (
  <div class="mb-[14px] flex flex-wrap items-center gap-[10px]" data-pagefind-ignore="">
    {meta.category !== "" && (
      <a href={`/category/${meta.category}`}>
        <HandBox>{meta.category}</HandBox>
      </a>
    )}
    <span class="label-date">
      <time>{toLongEnglishDate(meta.createdAt)}</time>
      <UpdatedAt createdAt={meta.createdAt} updatedAt={meta.updatedAt} />
    </span>
  </div>
);

/* 囲みは カテゴリ / note / rss / 現在ページ の4か所だけなので、タグは字だけで並べる */
const PostTags: FC<{ tags: string[] }> = ({ tags }) => {
  if (tags.length === 0) {
    return <></>;
  }
  return (
    <div class="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-tag">
      {tags.map((tag) => (
        <a class="text-ink-soft" href={`/tag/${tag}`} key={tag}>
          #{tag}
        </a>
      ))}
    </div>
  );
};

interface PostDetailProps {
  linkPrefix: string;
  next: PostMeta | undefined;
  ogUrl: string;
  pagefindBody?: boolean;
  post: Post;
  prev: PostMeta | undefined;
}

const PostDetail: FC<PostDetailProps> = ({
  linkPrefix,
  next,
  ogUrl,
  pagefindBody = false,
  post,
  prev,
}) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author: { "@type": "Person", name: "r-aizawa" },
    dateModified: post.meta.updatedAt,
    datePublished: post.meta.createdAt,
    headline: post.meta.title,
    url: `${SITE_URL}/posts/${post.meta.slug}`,
  };

  return (
    <Layout
      description={`${post.meta.title} - ${SITE_TITLE}`}
      jsonLd={jsonLd}
      nav="posts"
      ogType="article"
      ogUrl={ogUrl}
      readingMinutes={readingMinutes(post.content)}
      title={`${post.meta.title} - ${SITE_TITLE}`}
    >
      <TocLayout items={post.toc}>
        <header data-pagefind-body={pagefindBody || undefined}>
          <PostMetaLine meta={post.meta} />
          {/* 滲みは SVG フィルターだけで出す。Blotter.js は WebGL 1枚分の依存が増えるので入れない */}
          <h1
            class="mb-6 text-h1-sm leading-[1.5] font-semibold tracking-[0.02em] text-pretty text-ink-strong lg:text-h1"
            style="filter: url(#ink)"
          >
            {post.meta.title}
          </h1>
        </header>
        <MobileToc items={post.toc} />
        {/* 読了バーが offsetTop / offsetHeight を測る先。1ページに1つだけ置く */}
        <article
          class="prose-article"
          data-pagefind-body={pagefindBody || undefined}
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
        <PostTags tags={post.meta.tags} />
        <PostNav linkPrefix={linkPrefix} next={next} prev={prev} />
        <div class="mt-[22px] flex justify-end">
          <Signature class="text-[26px] lg:text-[30px]" />
        </div>
      </TocLayout>
      <Lightbox />
      <script dangerouslySetInnerHTML={{ __html: copyScript }} />
    </Layout>
  );
};

export { PostDetail };
