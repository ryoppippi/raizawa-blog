import type { FC } from "hono/jsx";

// 見出しは押せないので箱に入れない。地の上に直接置く。
// 箱（card + shadow）は押せるものだけに使う規則にしている。
const PageHeader: FC<{ title: string }> = ({ title }) => (
  <header class="mb-phi-5">
    <h1 class="text-2xl sm:text-3xl font-bold">{title}</h1>
  </header>
);

export { PageHeader };
