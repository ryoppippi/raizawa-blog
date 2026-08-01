import type { FC } from "hono/jsx";
import { ExternalArrow } from "./hand-arrows";
import { HandEllipse, HandStamp } from "./hand-boxes";
import { HandRule, Signature } from "./paper";
import { Logo, NAV_ITEMS, tiltOf } from "./site-header";
import type { NavKey } from "./site-header";
import { getAllPosts, getCategories, getPostsByCategory } from "../lib/posts";
import { ELSEWHERE_LINKS, NAV_TOGGLE_ID } from "../lib/config";

// 三項演算子はこのリポジトリでは禁止（oxlint の no-ternary）なので、現在地の印は関数に出す
const ariaCurrent = (current: boolean): "page" | undefined => {
  if (current) {
    return "page";
  }
  return undefined;
};

/* 閉じる印も手書き。文字の x は使わない */
const CloseIcon: FC = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <path
      d="M4 4.5 C 9.5 10, 15.5 16, 22 21.5 M22 4.5 C 16 10.5, 10 16.5, 4 21.5"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.7"
      stroke-linecap="round"
    />
  </svg>
);

/*
 * 見出し欄（赤線の左）はサイトの目次。
 * 記事詳細ではその記事の目次に入れ替わるので、こちらは使わない（1ページ1役割）
 */
const SiteIndex: FC<{ nav?: NavKey }> = ({ nav }) => {
  const categories = getCategories()
    .filter((name) => name !== "")
    .map((name) => ({ count: getPostsByCategory(name).length, name }));
  categories.sort((left, right) => right.count - left.count);

  return (
    <nav class="margin-col">
      {NAV_ITEMS.map((item, index) => (
        <NavRow index={index} item={item} key={item.key} nav={nav} />
      ))}

      <svg
        class="my-3 block h-[10px] w-[100px]"
        viewBox="0 0 100 10"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M2 5 C 30 3, 70 7, 98 4.4"
          fill="none"
          stroke="#1f3d2b"
          stroke-width="1.2"
          opacity=".6"
          stroke-linecap="round"
        />
      </svg>

      {categories.map((category, index) => (
        <a
          class="text-[13px] text-green-soft"
          href={`/category/${category.name}`}
          key={category.name}
          style={`rotate: ${tiltOf(index)}`}
        >
          {category.name} <span class="font-label text-ink-faint">{category.count}</span>
        </a>
      ))}

      <div class="mt-10 flex flex-col gap-2">
        <span class="text-[12.5px] text-green" style="rotate: -1deg">
          更新はこれ
        </span>
        <a href="/feed.xml" class="w-fit" style="rotate: -2deg">
          <HandStamp class="grid h-8 w-12 place-items-center px-0 font-label tracking-[0.08em] text-paper">
            rss
          </HandStamp>
        </a>
      </div>
    </nav>
  );
};

const NavRow: FC<{
  index: number;
  item: { href: string; key: NavKey; label: string };
  nav?: NavKey;
}> = ({ index, item, nav }) => {
  if (item.key === nav) {
    return (
      <a href={item.href} class="w-fit text-ink-strong" aria-current="page">
        <HandEllipse class="-ml-2 px-2">{item.label}</HandEllipse>
      </a>
    );
  }
  return (
    <a href={item.href} style={`rotate: ${tiltOf(index)}`}>
      {item.label}
    </a>
  );
};

/* 開くと全画面の紙になるメニュー。見出し欄はここへ畳む */
const MobileMenu: FC<{ nav?: NavKey }> = ({ nav }) => {
  const postCount = getAllPosts().length;
  const items: { en: string; href: string; key: NavKey; label: string }[] = [
    { en: `posts ・ ${postCount}`, href: "/posts", key: "posts", label: "記事" },
    { en: "tags", href: "/tag", key: "tags", label: "タグ" },
    { en: "search", href: "/search", key: "search", label: "検索" },
    { en: "about", href: "/", key: "about", label: "自己紹介" },
  ];

  return (
    <div class="paper-sheet fixed inset-0 z-40 hidden overflow-y-auto bg-paper peer-checked:block lg:hidden">
      <div class="paper-texture" aria-hidden="true" />
      <header class="sheet-head">
        <Logo small />
        <label
          for={NAV_TOGGLE_ID}
          class="-mr-2 ml-auto flex h-11 w-11 cursor-pointer items-center justify-center"
          aria-label="メニューを閉じる"
        >
          <CloseIcon />
        </label>
        <HandRule class="absolute inset-x-0 bottom-0" />
      </header>

      <nav class="body-col relative flex flex-col pt-10 pb-10">
        {items.map((item, index) => (
          <MenuRow index={index} item={item} key={item.key} nav={nav} />
        ))}

        <svg
          class="my-6 block h-[10px] w-[240px]"
          viewBox="0 0 240 10"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M2 5 C 60 3, 150 7, 238 4.4"
            fill="none"
            stroke="#1f3d2b"
            stroke-width="1.1"
            opacity=".6"
            stroke-linecap="round"
          />
        </svg>

        <div class="flex items-center gap-4">
          <a href="/feed.xml" style="rotate: -2deg">
            <HandStamp class="grid h-[34px] w-[52px] place-items-center px-0 font-label tracking-[0.08em] text-paper">
              rss
            </HandStamp>
          </a>
          <span class="text-[12.5px] text-ink-soft" style="rotate: -0.6deg">
            更新はこれで
          </span>
        </div>

        <div class="flex flex-col gap-1 pt-6">
          {ELSEWHERE_LINKS.map((link) => (
            <a
              class="flex min-h-11 items-baseline gap-[10px]"
              href={link.href}
              key={link.label}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span class="font-label text-[15px] text-green">{link.label}</span>
              <ExternalArrow />
            </a>
          ))}
        </div>

        <div class="flex justify-end pt-6">
          <Signature class="text-[26px]" />
        </div>
      </nav>
    </div>
  );
};

const MenuRow: FC<{
  index: number;
  item: { en: string; href: string; key: NavKey; label: string };
  nav?: NavKey;
}> = ({ index, item, nav }) => (
  <a
    aria-current={ariaCurrent(item.key === nav)}
    class="flex min-h-[52px] items-baseline gap-3"
    href={item.href}
  >
    <MenuLabel current={item.key === nav} index={index} label={item.label} />
    <span class="font-label text-[13.5px] text-ink-faint">{item.en}</span>
  </a>
);

const MenuLabel: FC<{ current: boolean; index: number; label: string }> = ({
  current,
  index,
  label,
}) => {
  if (current) {
    return (
      <HandEllipse class="-ml-[10px] px-[10px] py-[2px] text-[21px] font-semibold text-ink-strong">
        {label}
      </HandEllipse>
    );
  }
  return (
    <span class="text-[21px] font-semibold text-ink-strong" style={`rotate: ${tiltOf(index)}`}>
      {label}
    </span>
  );
};

export { MobileMenu, SiteIndex };
