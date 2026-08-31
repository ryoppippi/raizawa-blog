import type { FC } from "hono/jsx";
import { SITE_TITLE, SITE_URL } from "../lib/config";
import type { Post, PostMeta } from "../lib/posts";
import { Breadcrumbs } from "./breadcrumbs";
import type { Crumb } from "./breadcrumbs";
import { Layout } from "./layout";
import { TocLayout, shouldShowToc } from "./toc";
import { UpdatedAt } from "./updated-at";

const copyScript = `document.querySelectorAll('.copy-button').forEach(button => {
  button.addEventListener('click', async () => {
    const wrapper = button.closest('.code-block-wrapper');
    const code = wrapper.querySelector('code');
    const text = code.innerText.replace(/^\\d+\\s*/gm, '');
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied!';
    button.classList.add('copied');
    setTimeout(() => { button.textContent = 'Copy'; button.classList.remove('copied'); }, 2000);
  });
});`;

const PrevPostLink: FC<{ linkPrefix: string; prev: PostMeta | undefined }> = ({
  linkPrefix,
  prev,
}) => {
  if (prev === undefined) {
    return <div />;
  }
  return (
    <a
      href={`${linkPrefix}${prev.slug}`}
      class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
    >
      <div class="card-body p-phi-4">
        <span class="text-xs opacity-60">← 前の記事</span>
        <span class="text-sm font-medium">{prev.title}</span>
      </div>
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
    <a
      href={`${linkPrefix}${next.slug}`}
      class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow sm:text-right"
    >
      <div class="card-body p-phi-4">
        <span class="text-xs opacity-60">次の記事 →</span>
        <span class="text-sm font-medium">{next.title}</span>
      </div>
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
    <nav class="grid grid-cols-1 sm:grid-cols-2 gap-phi-4 mt-phi-6 pt-phi-5 border-t border-base-300">
      <PrevPostLink prev={prev} linkPrefix={linkPrefix} />
      <NextPostLink next={next} linkPrefix={linkPrefix} />
    </nav>
  );
};

// タイトルと本文はひと続きの記事なので、別々の箱に分けず
// 1枚の紙の中で罫線だけで区切る。
const PostHeader: FC<{ meta: PostMeta }> = ({ meta }) => (
  <header class="mb-phi-5 pb-phi-5 border-b border-base-300">
    <h1 class="text-2xl sm:text-3xl font-bold">{meta.title}</h1>
    <div class="text-sm opacity-70 mt-phi-1">
      <time>{new Date(meta.createdAt).toLocaleDateString("ja-JP")}</time>
      <UpdatedAt createdAt={meta.createdAt} updatedAt={meta.updatedAt} />
      {meta.category !== "" && (
        <span>
          {" "}
          •{" "}
          <a href={`/category/${meta.category}`} class="link link-hover">
            {meta.category}
          </a>
        </span>
      )}
    </div>
    {meta.tags.length > 0 && (
      <div class="flex flex-wrap gap-phi-2 mt-phi-3">
        {meta.tags.map((tag) => (
          <a class="badge badge-primary badge-outline" key={tag} href={`/tag/${tag}`}>
            {tag}
          </a>
        ))}
      </div>
    )}
  </header>
);

interface PostDetailProps {
  breadcrumbs?: Crumb[];
  linkPrefix: string;
  next: PostMeta | undefined;
  ogUrl: string;
  pagefindBody?: boolean;
  post: Post;
  prev: PostMeta | undefined;
}

const PostDetail: FC<PostDetailProps> = ({
  breadcrumbs = [],
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
      title={`${post.meta.title} - ${SITE_TITLE}`}
      description={`${post.meta.title} - ${SITE_TITLE}`}
      ogType="article"
      ogUrl={ogUrl}
      jsonLd={jsonLd}
      wide={shouldShowToc(post.toc)}
    >
      <TocLayout items={post.toc}>
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
        {/* 読むための面。押せないので影は付けない */}
        <article
          class="bg-base-100 rounded-lg p-phi-5"
          data-pagefind-body={pagefindBody || undefined}
        >
          <PostHeader meta={post.meta} />
          <div class="prose-article" dangerouslySetInnerHTML={{ __html: post.html }}></div>
        </article>
        <PostNav linkPrefix={linkPrefix} next={next} prev={prev} />
      </TocLayout>
      <script dangerouslySetInnerHTML={{ __html: copyScript }} />
    </Layout>
  );
};

export { PostDetail };
