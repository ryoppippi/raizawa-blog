import type { Child, FC } from "hono/jsx";
import { HandEllipse } from "./hand-boxes";
import { HandRule, PaperTexture } from "./paper";
import { NAV_TOGGLE_ID, SITE_TITLE } from "../lib/config";

/*
 * 見出し欄（赤線の左）の現在地。
 * ラベルは紙の用途に合わせて日本語にする（ルーズリーフに英語で書かない）
 */
type NavKey = "posts" | "tags" | "search" | "about";

const NAV_ITEMS: { href: string; key: NavKey; label: string }[] = [
  { href: "/posts", key: "posts", label: "記事" },
  { href: "/tag", key: "tags", label: "タグ" },
  { href: "/search", key: "search", label: "検索" },
  { href: "/", key: "about", label: "自己紹介" },
];

/* 行ごとに傾きを変える。全部同じだと定規で書いたように見える */
const TILTS = ["-0.5deg", "0.4deg", "-0.3deg", "0.5deg"];

const tiltOf = (index: number): string => TILTS[index % TILTS.length] ?? "0deg";

/* サイト名は手書きの楕円で囲む。二度書きの重なりを残してある */
const Logo: FC<{ small?: boolean }> = ({ small = false }) => {
  if (small) {
    return (
      <a
        href="/"
        class="font-label text-[15px] tracking-[0.12em] text-ink-strong"
        style="rotate: -0.6deg"
      >
        {SITE_TITLE}
      </a>
    );
  }
  return (
    <a href="/" style="rotate: -1deg">
      <HandEllipse stroke="green" twice wide class="px-[18px] py-2">
        <span class="font-label text-[24px] leading-none tracking-[0.16em] whitespace-nowrap text-ink-strong">
          {SITE_TITLE}
        </span>
      </HandEllipse>
    </a>
  );
};

/* 読了バー。鉛筆線の上をエンジが伸びる */
const ReadingBar: FC<{ minutes: number }> = ({ minutes }) => (
  <div class="flex items-center gap-3">
    <span class="hidden font-label text-[13.5px] tracking-[0.1em] whitespace-nowrap text-ink-soft lg:inline">
      {minutes} min read
    </span>
    <svg
      class="block h-[10px] w-[80px] lg:w-[140px]"
      viewBox="0 0 140 10"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 5.4 C 46 3.8, 94 6.6, 138 4.6"
        fill="none"
        stroke="#a99f88"
        stroke-width="1"
        opacity=".7"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      {/* デスクトップとモバイルで2本描くので id ではなく class で拾わせる */}
      <path
        class="reading-progress"
        d="M2 5.4 C 46 3.8, 94 6.6, 138 4.6"
        fill="none"
        stroke="#8c1c2b"
        stroke-width="1.7"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
        pathLength="1"
        style="stroke-dasharray: var(--read, 0) 1"
      />
    </svg>
  </div>
);

/* 揺れた3本線。タップ領域は 44px */
const HamburgerIcon: FC = () => (
  <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
    <path
      d="M2 3.4 C 11 2.2, 21 3.8, 28 2.8"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.7"
      stroke-linecap="round"
    />
    <path
      d="M3 10.2 C 12 9, 20 10.8, 27 9.6"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.7"
      stroke-linecap="round"
    />
    <path
      d="M2.4 17 C 10 15.8, 22 17.4, 28.6 16.2"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.7"
      stroke-linecap="round"
    />
  </svg>
);

/*
 * ヘッダー。下端は手書きのペン線で切る。
 * 罫線はこの線の下から始まるので、高さは --rule-top と合わせてある
 */
const SiteHeader: FC<{ headNote?: Child; readingMinutes?: number }> = ({
  headNote,
  readingMinutes,
}) => (
  <header class="sheet-head">
    {/* 帯を紙色で塞ぐぶん、同じテクスチャを内側にも敷いて地続きに見せる */}
    <PaperTexture />
    <Logo />
    {headNote !== undefined && (
      <span class="hidden pl-[26px] text-[14px] text-ink-soft lg:inline" style="rotate: -0.4deg">
        {headNote}
      </span>
    )}
    <div class="ml-auto flex items-center gap-3">
      {readingMinutes !== undefined && <ReadingBar minutes={readingMinutes} />}
      <label
        for={NAV_TOGGLE_ID}
        class="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center lg:hidden"
        aria-label="メニューを開く"
      >
        <HamburgerIcon />
      </label>
    </div>
    <HandRule class="absolute inset-x-0 bottom-0" />
  </header>
);

export type { NavKey };
export { Logo, NAV_ITEMS, SiteHeader, tiltOf };
