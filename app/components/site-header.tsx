import type { FC } from "hono/jsx";
import { HandRule, HandStamp, HandUnderline, Signature } from "./paper";
import { getAllPosts } from "../lib/posts";
import { GITHUB_URL, NAV_TOGGLE_ID, ZENN_URL } from "../lib/config";

/* ヘッダーの現在地。UIラベルは小文字の英語で揃える */
type NavKey = "posts" | "categories" | "tags" | "search" | "about";

const NAV_ITEMS: { key: NavKey; href: string }[] = [
  { href: "/posts", key: "posts" },
  { href: "/category", key: "categories" },
  { href: "/tag", key: "tags" },
  { href: "/search", key: "search" },
];

/* 手書きの円に囲まれた r。二度書きの重なりを残してある */
const Logo: FC = () => (
  <a href="/" class="relative flex items-center gap-3 font-label text-[15px] tracking-[0.2em]">
    <span class="relative flex h-[30px] w-[30px] shrink-0 items-center justify-center text-green">
      <span class="relative tracking-normal">R</span>
      <svg
        class="absolute inset-0 overflow-visible"
        width="30"
        height="30"
        viewBox="0 0 30 30"
        aria-hidden="true"
      >
        <path
          d="M15 2.4 C 23.2 2.6, 28 7.4, 27.6 15.4 C 27.2 23.4, 22.4 27.8, 14.6 27.6 C 6.6 27.4, 2.4 22.6, 2.6 14.6 C 2.8 6.8, 7.6 2.4, 15 2.4"
          fill="none"
          stroke="#1f3d2b"
          stroke-width="1.7"
          stroke-linecap="round"
        />
        <path
          d="M17 2.6 C 24.4 3.4, 28.2 8.6, 27.4 15"
          fill="none"
          stroke="#1f3d2b"
          stroke-width="1.1"
          opacity=".5"
          stroke-linecap="round"
        />
      </svg>
    </span>
    <span class="text-green">r-aizawa</span>
  </a>
);

/* 読了バー。薄い鉛筆線の上をエンジの線が伸びる。角丸の棒は使わない */
const ReadingBar: FC<{ minutes: number }> = ({ minutes }) => (
  <div class="flex items-center gap-3">
    <span class="label-date whitespace-nowrap">{minutes} min read</span>
    <span class="relative block h-[9px] w-[90px] lg:w-[120px]">
      <svg
        class="absolute inset-0 overflow-visible"
        viewBox="0 0 120 9"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M1 5.4 C 26 3, 62 7.4, 92 4.8 C 106 3.6, 114 6, 119 4.6"
          fill="none"
          stroke="#1f3d2b"
          stroke-width="1"
          opacity=".28"
          stroke-linecap="round"
        />
        {/* デスクトップとモバイルで2本描くので id ではなく class で拾わせる */}
        <path
          class="reading-progress"
          d="M1 5.4 C 26 3, 62 7.4, 92 4.8 C 106 3.6, 114 6, 119 4.6"
          fill="none"
          stroke="#8c1c2b"
          stroke-width="2.1"
          stroke-linecap="round"
          pathLength="1"
          style="stroke-dasharray: var(--read, 0) 1"
        />
      </svg>
    </span>
  </div>
);

/* 3本の揺れた線。タップ領域は 44px */
const HamburgerIcon: FC = () => (
  <svg width="26" height="18" viewBox="0 0 26 18" class="overflow-visible" aria-hidden="true">
    <path
      d="M2 3 C 8 1.6, 18 4, 24 2.4"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <path
      d="M2 9 C 9 7.4, 17 10.4, 24 8.6"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <path
      d="M2 15 C 8 13.4, 18 16, 24 14.4"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  </svg>
);

const CloseIcon: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" class="overflow-visible" aria-hidden="true">
    <path
      d="M2 2.4 C 8 7, 15 14, 20 19.6"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.8"
      stroke-linecap="round"
    />
    <path
      d="M20 2.4 C 14.4 7.4, 7.4 14, 2 19.6"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  </svg>
);

// 三項演算子はこのリポジトリでは禁止（oxlint の no-ternary）なので、現在地の出し分けは関数に出す
const navLinkClass = (isCurrent: boolean): string => {
  if (isCurrent) {
    return "hand-underline text-ink-strong";
  }
  return "text-green-soft";
};

const ariaCurrent = (isCurrent: boolean): "page" | undefined => {
  if (isCurrent) {
    return "page";
  }
  return undefined;
};

const SiteHeader: FC<{ nav?: NavKey; readingMinutes?: number }> = ({ nav, readingMinutes }) => (
  <header class="sticky top-0 z-20 bg-paper">
    <div class="paper-texture" aria-hidden="true" />
    <div class="sheet relative flex items-end justify-between pt-[18px] pb-[11px] lg:pt-[22px] lg:pb-[14px]">
      <Logo />

      {/*
       * デスクトップ：現在地だけエンジの手書き下線。
       * 設計の記事ページはナビを消して読了バーだけ置いているが、記事から他へ辿れなくなるので
       * 同じ行に並べる。絶対配置で重ねるとナビの字にぶつかる
       */}
      <div class="hidden items-center gap-6 lg:flex">
        <nav class="flex items-center gap-[18px] font-label text-[14px] text-green-soft">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              class={navLinkClass(item.key === nav)}
              aria-current={ariaCurrent(item.key === nav)}
            >
              {item.key}
              {item.key === nav && <HandUnderline />}
            </a>
          ))}
        </nav>
        {readingMinutes !== undefined && <ReadingBar minutes={readingMinutes} />}
      </div>

      {/* モバイル：読了バー（記事のみ）とハンバーガー */}
      <div class="flex items-center gap-3 lg:hidden">
        {readingMinutes !== undefined && <ReadingBar minutes={readingMinutes} />}
        <label
          for={NAV_TOGGLE_ID}
          class="-mr-2 -mb-1.5 flex h-11 w-11 cursor-pointer items-center justify-center"
          aria-label="メニューを開く"
        >
          <HamburgerIcon />
        </label>
      </div>
    </div>
    <HandRule alt={nav === undefined} class="absolute inset-x-0 -bottom-px" />
  </header>
);

/* 開くと全画面の紙になるメニュー。ドッグイヤーが使えないぶん rss と about もここへ */
const MobileMenu: FC<{ nav?: NavKey }> = ({ nav }) => {
  const postCount = getAllPosts().length;
  const items: { en: string; href: string; ja: string; key: NavKey }[] = [
    { en: `posts ・ ${postCount}`, href: "/posts", ja: "記事", key: "posts" },
    { en: "categories", href: "/category", ja: "分類", key: "categories" },
    { en: "tags", href: "/tag", ja: "タグ", key: "tags" },
    { en: "search", href: "/search", ja: "検索", key: "search" },
    { en: "about", href: "/", ja: "自己紹介", key: "about" },
  ];

  return (
    <div class="fixed inset-0 z-40 hidden overflow-y-auto bg-paper peer-checked:block lg:hidden">
      <div class="paper-texture" aria-hidden="true" />
      <div class="sheet relative flex items-end justify-between pt-[18px] pb-[11px]">
        <span class="font-label text-[16px] tracking-[0.14em] text-green">r-aizawa</span>
        <label
          for={NAV_TOGGLE_ID}
          class="-mr-2 -mb-1.5 flex h-11 w-11 cursor-pointer items-center justify-center"
          aria-label="メニューを閉じる"
        >
          <CloseIcon />
        </label>
        <HandRule class="absolute inset-x-0 -bottom-px" />
      </div>

      <nav class="sheet relative flex flex-col gap-1 pt-[30px] pb-[34px]">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            class="flex min-h-11 items-baseline gap-[10px] px-1 py-3 text-ink-strong"
            aria-current={ariaCurrent(item.key === nav)}
          >
            <span class="text-[22px] font-semibold">{item.ja}</span>
            <span class="font-label text-[15px] text-ink-soft">{item.en}</span>
          </a>
        ))}

        <div class="relative mt-[14px] flex items-center gap-3 pt-5">
          <HandRule thin class="absolute inset-x-0 top-0" />
          <a href="/feed.xml" class="min-h-11">
            <HandStamp fill="ochre" class="box-border min-h-11 px-[15px] py-[9px] text-[15px]">
              rss ↗
            </HandStamp>
          </a>
          <a
            href={GITHUB_URL}
            class="px-1 py-3 font-label text-[15px] text-green-soft"
            target="_blank"
            rel="noopener noreferrer"
          >
            github ↗
          </a>
          <a
            href={ZENN_URL}
            class="px-1 py-3 font-label text-[15px] text-green-soft"
            target="_blank"
            rel="noopener noreferrer"
          >
            zenn ↗
          </a>
        </div>

        <div class="mt-6 flex justify-center">
          <Signature class="text-[28px]" />
        </div>
      </nav>
    </div>
  );
};

export type { NavKey };
export { MobileMenu, SiteHeader };
