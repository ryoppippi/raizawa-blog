const SITE_URL = "https://r-aizawa.com";
const SITE_TITLE = "r-aizawa Blog";
const SITE_DESCRIPTION = "技術やら趣味やら戯言やら";

const GITHUB_URL = "https://github.com/Xantibody";
const ZENN_URL = "https://zenn.dev/master_peace_36";

/* 紙の外にある置き場。自己紹介とモバイルメニューの両方が同じ並びで出す */
const ELSEWHERE_LINKS: { href: string; label: string }[] = [
  { href: GITHUB_URL, label: "github" },
  { href: ZENN_URL, label: "zenn" },
];

/** モバイルメニューの開閉。CSS の peer-checked で開くので JS は要らない */
const NAV_TOGGLE_ID = "nav-toggle";

// ロゴと同じ手書きの円。紙の地にインクで書いた見た目に合わせる
const FAVICON_URL =
  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'><rect width='30' height='30' fill='%23f6f1e4'/><path d='M15 2.4 C 23.2 2.6, 28 7.4, 27.6 15.4 C 27.2 23.4, 22.4 27.8, 14.6 27.6 C 6.6 27.4, 2.4 22.6, 2.6 14.6 C 2.8 6.8, 7.6 2.4, 15 2.4' fill='none' stroke='%231f3d2b' stroke-width='1.7' stroke-linecap='round'/><text x='15' y='20' font-size='14' font-family='Georgia,serif' text-anchor='middle' fill='%231f3d2b'>R</text></svg>";

export { ELSEWHERE_LINKS, FAVICON_URL, NAV_TOGGLE_ID, SITE_DESCRIPTION, SITE_TITLE, SITE_URL };
