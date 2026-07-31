import type { Child, FC } from "hono/jsx";
import { HandBox, HandStamp, HandUnderline } from "./paper";
import type { TocItem } from "../lib/toc";

const MIN_TOC_ITEMS = 2;
const H2_LEVEL = 2;
const H3_LEVEL = 3;
const H3_INDENT = "pl-4";
const H4_INDENT = "pl-8";

/*
 * 現在地の印。
 * 裸のブロックの直下で return すると「Illegal return statement」でスクリプトごと落ちるので、
 * 早期脱出ではなく条件で包む。rootMargin は px と % しか取らない（rem は無効値で例外）。
 * 目次はデスクトップとモバイルで2つ描かれるので、印は querySelectorAll で両方に付ける。
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

/*
 * 目次の行。現在地はエンジの手書き下線で示すので、罫線もマーカーも引かない。
 * 下線は active のときだけ CSS で見せる（.toc-link > svg）ため、
 * 出し分けを JS に持たせず全部の行に置いてある。
 */
const TocLinks: FC<{ items: TocItem[] }> = ({ items }) => (
  <>
    {items
      .filter((item) => item.level >= H2_LEVEL)
      .map((item) => (
        <a class={`toc-link ${indentClass(item.level)}`} href={`#${item.id}`} key={item.id}>
          {item.text}
          <HandUnderline />
        </a>
      ))}
  </>
);

/* サイドの目次。デスクトップのみ */
const TocNav: FC<{ items: TocItem[] }> = ({ items }) => (
  <nav class="flex flex-col gap-3" aria-label="目次">
    <span class="label">contents</span>
    <TocLinks items={items} />
  </nav>
);

/*
 * 深緑のベタ面に黄土のゴム印。
 * 目次と同じ sticky の器に載るものなので、別ファイルには分けていない。
 */
const Subscribe: FC = () => (
  <div class="bg-green px-[15px] py-[14px] text-[#e8e2d0]">
    <span class="mb-2 block font-label text-[12.5px] tracking-[0.18em] text-ochre">subscribe</span>
    <p class="mb-[10px] text-[13px] leading-[1.95]">更新は rss で。右下の折り目からも辿れる。</p>
    <a href="/feed.xml">
      <HandStamp fill="ochre">rss ↗</HandStamp>
    </a>
  </div>
);

/*
 * モバイルの目次。本文の上に折りたたむ。
 * daisyUI の collapse をやめて <details> にしたのは、開閉に JS も追加の状態も要らないため。
 * HandBox の中身は inline なので、幅いっぱいの2列にするために直下の span を flex にしている。
 */
const MobileToc: FC<{ items: TocItem[] }> = ({ items }) => {
  if (!shouldShowToc(items)) {
    return <></>;
  }
  return (
    <details class="group mb-5 lg:hidden">
      <summary class="flex min-h-11 cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden">
        <HandBox class="block w-full px-[14px] py-3 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:justify-between">
          <>
            <span>contents</span>
            <span class="text-[16px]">
              <span class="group-open:hidden">＋</span>
              <span class="hidden group-open:inline">−</span>
            </span>
          </>
        </HandBox>
      </summary>
      <nav class="flex flex-col gap-3 px-[14px] pt-4" aria-label="目次">
        <TocLinks items={items} />
      </nav>
    </details>
  );
};

/*
 * 記事の2カラム。本文 + 224px のサイド。
 * サイドは目次が無い記事にも出す（subscribe だけが残る）。
 * 見出しの数で紙の形が変わると、記事を渡り歩いたときに別のサイトに見えるため。
 */
const TocLayout: FC<{ children: Child; items: TocItem[] }> = ({ children, items }) => (
  <>
    <div class="sheet grid grid-cols-1 gap-x-[42px] gap-y-9 pt-[26px] pb-12 lg:grid-cols-[minmax(0,1fr)_224px]">
      <div class="min-w-0">{children}</div>
      <aside class="hidden lg:block">
        <div class="sticky top-[76px] flex flex-col gap-[22px]">
          {shouldShowToc(items) && <TocNav items={items} />}
          <Subscribe />
        </div>
      </aside>
    </div>
    {shouldShowToc(items) && <script dangerouslySetInnerHTML={{ __html: scrollspyScript }} />}
  </>
);

export { MobileToc, shouldShowToc, TocLayout };
