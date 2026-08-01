import type { FC } from "hono/jsx";
import { HandUnderline } from "./paper";
import type { TocItem } from "../lib/toc";

const MIN_TOC_ITEMS = 2;
const H2_LEVEL = 2;
const H3_LEVEL = 3;
const H3_INDENT = "pl-3";
const H4_INDENT = "pl-6";

/*
 * 現在地の印。
 * 裸のブロックの直下で return すると「Illegal return statement」でスクリプトごと落ちるので、
 * 早期脱出ではなく条件で包む。rootMargin は px と % しか取らない（rem は無効値で例外）。
 * 目次は見出し欄とモバイルの折りたたみで2つ描かれるので、印は両方に付ける。
 */
const scrollspyScript = `{
  const tocLinks = document.querySelectorAll('.toc-link');
  const headings = document.querySelectorAll('article h2[id], article h3[id], article h4[id]');
  if (tocLinks.length > 0 && headings.length > 0) {
    const topGap = window.matchMedia('(min-width: 1024px)').matches ? '0px' : '-80px';
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          tocLinks.forEach((link) => { link.classList.remove('active'); });
          const selector = '.toc-link[href="#' + CSS.escape(entry.target.id) + '"]';
          document.querySelectorAll(selector).forEach((link) => { link.classList.add('active'); });
        }
      }
    }, { rootMargin: topGap + ' 0px -80% 0px' });

    headings.forEach((heading) => { observer.observe(heading); });
  }
}`;

const shouldShowToc = (items: TocItem[]): boolean => items.length >= MIN_TOC_ITEMS;

const indentClass = (level: number): string => {
  if (level === H3_LEVEL) {
    return H3_INDENT;
  }
  if (level > H3_LEVEL) {
    return H4_INDENT;
  }
  return "";
};

/* 行ごとに少し傾ける。定規で書いたように揃えない */
const TILTS = ["-0.4deg", "0.3deg", "-0.3deg", "0.4deg"];

const tiltOf = (index: number): string => TILTS[index % TILTS.length] ?? "0deg";

/*
 * 目次の行。現在地はエンジの手書き下線で示すので、罫線もマーカーも引かない。
 * 下線は active のときだけ CSS で見せる（.toc-link > svg）ため、
 * 出し分けを JS に持たせず全部の行に置いてある。
 */
const TocLinks: FC<{ items: TocItem[] }> = ({ items }) => (
  <>
    {items
      .filter((item) => item.level >= H2_LEVEL)
      .map((item, index) => (
        <a
          class={`toc-link ${indentClass(item.level)}`}
          href={`#${item.id}`}
          key={item.id}
          style={`rotate: ${tiltOf(index)}`}
        >
          {item.text}
          <HandUnderline />
        </a>
      ))}
  </>
);

/*
 * 見出し欄（赤線の左）に置く記事の目次。
 * 1ページ1役割なので、ここにサイトのナビもメタ情報も置かない。
 * 目次が無い記事では欄ごと空にする（無理に何かを書き足さない）
 */
const ArticleIndex: FC<{ items: TocItem[] }> = ({ items }) => {
  if (!shouldShowToc(items)) {
    return <div class="margin-col" />;
  }
  return (
    <nav class="margin-col" aria-label="目次">
      <div class="sticky top-6 flex flex-col">
        <span class="text-[12.5px] text-ink-soft">目次</span>
        <TocLinks items={items} />
      </div>
    </nav>
  );
};

/* 折りたたみの向きを示す小さな山。文字の ▾ は使わない */
const Chevron: FC = () => (
  <svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
    <path
      d="M1.5 1.5 C 3 4, 4.5 6, 6 7 C 7.5 6, 9 4, 10.5 1.5"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.4"
      stroke-linecap="round"
    />
  </svg>
);

/*
 * モバイルの目次。本文の上に折りたたむ。
 * 囲まない（囲みは 現在地の楕円 / カテゴリ / note だけ）ので、薄い線だけ引く。
 * <details> にしたのは開閉に JS も追加の状態も要らないため
 */
const MobileToc: FC<{ items: TocItem[] }> = ({ items }) => {
  if (!shouldShowToc(items)) {
    return <></>;
  }
  return (
    <details class="group lg:hidden">
      <summary class="flex min-h-11 cursor-pointer list-none items-center gap-[10px] [&::-webkit-details-marker]:hidden">
        <span class="text-[13.5px] text-green" style="rotate: -0.4deg">
          目次
        </span>
        <span class="transition-transform group-open:-scale-y-100">
          <Chevron />
        </span>
        <svg
          class="h-[6px] flex-1"
          viewBox="0 0 140 6"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M2 3.4 C 40 1.8, 100 4.8, 138 2.8"
            fill="none"
            stroke="#1f3d2b"
            stroke-width=".9"
            opacity=".5"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </summary>
      <nav class="flex flex-col pb-2" aria-label="目次">
        <TocLinks items={items} />
      </nav>
    </details>
  );
};

/* スクロールスパイ。目次を出したページだけが読み込む */
const TocScript: FC<{ items: TocItem[] }> = ({ items }) => {
  if (!shouldShowToc(items)) {
    return <></>;
  }
  return <script dangerouslySetInnerHTML={{ __html: scrollspyScript }} />;
};

export { ArticleIndex, MobileToc, shouldShowToc, TocScript };
