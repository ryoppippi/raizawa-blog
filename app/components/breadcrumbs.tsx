import type { FC } from "hono/jsx";

interface Crumb {
  href: string;
  label: string;
}

// 記事は /posts/ 直下のほかに、カテゴリ経由・タグ経由のURLでも配信される。
// 同じ記事なのにページを見てもどの経路で来たか分からないので、その一段を示す。
//
// 以前あったArticleNavは「トップ」から始まる形で、トップへ戻る動線が
// ヘッダーと重複していたため b903439 で消えた。ここではトップを入れず、
// 現在地の表示に用途を絞る。stickyにもしない。
const Breadcrumbs: FC<{ items: Crumb[] }> = ({ items }) => (
  <nav class="breadcrumbs text-sm mb-phi-3">
    <ul>
      {items.map((item) => (
        <li key={item.href}>
          <a href={item.href} class="link link-hover">
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

export { Breadcrumbs };
export type { Crumb };
