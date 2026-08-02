import type { Child, FC } from "hono/jsx";
import { Link } from "honox/server";
import { PaperFilters, PaperTexture } from "./paper";
import { SiteHeader } from "./site-header";
import type { NavKey } from "./site-header";
import { MobileMenu, SiteIndex } from "./site-index";
import { FAVICON_URL, NAV_TOGGLE_ID, SITE_TITLE } from "../lib/config";

const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Parisienne&family=JetBrains+Mono:wght@400;500&display=swap";

interface JsonLd {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

interface LayoutProps {
  children: Child;
  description: string;
  /* ヘッダーのサイト名の右に添える走り書き */
  headNote?: Child;
  jsonLd?: JsonLd;
  /*
   * 見出し欄（赤線の左）。1ページ1役割なので、
   * 渡さなければサイトの目次、渡せばその中身（記事詳細では記事の目次）に入れ替わる
   */
  marginCol?: Child;
  /* 見出し欄の現在地 */
  nav?: NavKey;
  ogType?: "website" | "article";
  ogUrl: string;
  /* 記事ページだけ。ヘッダーに `6 min read` と読了バーを出す */
  readingMinutes?: number;
  title: string;
}

// 読了バーはスクロール量をそのまま path の描き出し量にする。
// PathLength=1 にしてあるので、割合をそのまま stroke-dasharray へ渡せる
const readingProgressScript = `{
  const bars = document.querySelectorAll('.reading-progress');
  const article = document.querySelector('article');
  if (bars.length && article) {
    const update = () => {
      const start = article.offsetTop;
      const span = article.offsetHeight - innerHeight;
      const ratio = span > 0 ? (scrollY - start) / span : 1;
      const read = String(Math.min(1, Math.max(0, ratio)));
      bars.forEach((bar) => { bar.style.setProperty('--read', read); });
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }
}`;

const Layout: FC<LayoutProps> = ({
  children,
  description,
  headNote,
  jsonLd,
  marginCol,
  nav,
  ogType = "website",
  ogUrl,
  readingMinutes,
  title,
}) => (
  <html lang="ja">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:site_name" content={SITE_TITLE} />
      <meta name="twitter:card" content="summary" />
      <link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="/feed.xml" />
      <link rel="canonical" href={ogUrl} />
      <link rel="icon" href={FAVICON_URL} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
      <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
      <Link href="/app/style.css" rel="stylesheet" />
      {jsonLd !== undefined && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </head>
    <body class="min-h-screen">
      <PaperFilters />
      <div class="paper-sheet">
        <PaperTexture />
        {/* モバイルメニューの開閉。peer なので後ろの兄弟から peer-checked で参照する */}
        <input id={NAV_TOGGLE_ID} type="checkbox" class="peer sr-only" aria-hidden="true" />
        <SiteHeader headNote={headNote} readingMinutes={readingMinutes} />
        <MobileMenu nav={nav} />
        {marginCol ?? <SiteIndex nav={nav} />}
        <div class="paper-layer pb-16">{children}</div>
      </div>
      {readingMinutes !== undefined && (
        <script dangerouslySetInnerHTML={{ __html: readingProgressScript }} />
      )}
    </body>
  </html>
);

export { Layout };
