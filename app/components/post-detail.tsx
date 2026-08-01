import type { FC } from "hono/jsx";
import { Layout } from "./layout";
import { Lightbox } from "./lightbox";
import { LongArrow } from "./hand-arrows";
import { Signature } from "./paper";
import { ArticleIndex, MobileToc, TocScript } from "./toc";
import { PostMetaLine } from "./post-meta-line";
import { SITE_TITLE, SITE_URL } from "../lib/config";
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

/*
 * 前後の記事へは紙の左右いっぱいに伸びる手書きの矢印で送る。
 * ラベルは説明を付けず記事タイトルだけにする（決定事項メモ 6）
 */
const PrevPostLink: FC<{ linkPrefix: string; prev: PostMeta | undefined }> = ({
  linkPrefix,
  prev,
}) => {
  if (prev === undefined) {
    return <span />;
  }
  return (
    <a class="paper-nav paper-nav-prev" href={`${linkPrefix}${prev.slug}`}>
      <LongArrow direction="prev" />
      <span>{prev.title}</span>
    </a>
  );
};

const NextPostLink: FC<{ linkPrefix: string; next: PostMeta | undefined }> = ({
  linkPrefix,
  next,
}) => {
  if (next === undefined) {
    return <span />;
  }
  return (
    <a class="paper-nav paper-nav-next" href={`${linkPrefix}${next.slug}`}>
      <LongArrow direction="next" />
      <span>{next.title}</span>
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
    /* 本文カラムからはみ出して紙の幅いっぱいに置く */
    <nav class="mt-11 flex items-start justify-between gap-6 max-lg:mx-0 lg:-ml-[var(--body-x)]">
      <PrevPostLink prev={prev} linkPrefix={linkPrefix} />
      <NextPostLink next={next} linkPrefix={linkPrefix} />
    </nav>
  );
};

/* 囲みは 現在地の楕円 / カテゴリ / note だけなので、タグは字だけで並べる */
const PostTags: FC<{ tags: string[] }> = ({ tags }) => {
  if (tags.length === 0) {
    return <></>;
  }
  return (
    <div class="mt-8 flex flex-wrap items-center gap-x-4 text-[13px] text-ink-soft">
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
      /* 見出し欄は1ページ1役割。記事ではサイトのナビではなくこの記事の目次だけを置く */
      marginCol={<ArticleIndex items={post.toc} />}
      nav="posts"
      ogType="article"
      ogUrl={ogUrl}
      readingMinutes={readingMinutes(post.content)}
      title={`${post.meta.title} - ${SITE_TITLE}`}
    >
      <div class="body-col">
        <header data-pagefind-body={pagefindBody || undefined}>
          {/* 滲みは SVG フィルターだけで出す。Blotter.js は WebGL 1枚分の依存が増えるので入れない */}
          <h1
            class="text-h1-sm leading-[var(--line)] font-semibold text-ink-strong lg:text-h1 lg:leading-[calc(var(--line)*2)]"
            style="filter: url(#ink); rotate: -0.3deg"
          >
            {post.meta.title}
          </h1>
          <PostMetaLine meta={post.meta} />
        </header>
        <MobileToc items={post.toc} />
        {/* 読了バーが offsetTop / offsetHeight を測る先。1ページに1つだけ置く */}
        <article
          class="prose-article pt-[6px]"
          data-pagefind-body={pagefindBody || undefined}
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
        <PostTags tags={post.meta.tags} />
        <PostNav linkPrefix={linkPrefix} next={next} prev={prev} />
        <div class="mt-6 flex justify-end">
          <Signature class="text-[26px] lg:text-[30px]" />
        </div>
      </div>
      <TocScript items={post.toc} />
      <Lightbox />
      <script dangerouslySetInnerHTML={{ __html: copyScript }} />
    </Layout>
  );
};

export { PostDetail };
