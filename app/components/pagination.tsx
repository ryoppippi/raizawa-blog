import type { FC } from "hono/jsx";
import { ShortArrow } from "./hand-arrows";
import { getPageHref, getPrevHref } from "../lib/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

/*
 * ページ送り。
 * 数字を並べるページャは紙に無いので、「つづきは次の紙」のペン書き1行にした。
 * 何枚目かは括弧で添えるだけ。getPageNumbers は使わなくなったが、
 * lib/pagination.ts はテストが持っているのでそのまま残してある。
 */
const Pagination: FC<PaginationProps> = ({ currentPage, totalPages }) => {
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  if (!hasPrev && !hasNext) {
    return <></>;
  }

  return (
    <nav
      class="flex flex-wrap items-center justify-between gap-4 pt-8 text-[15px] text-crimson"
      aria-label="ページ送り"
    >
      {hasPrev && (
        <a
          class="inline-flex min-h-11 items-center lg:min-h-0"
          href={getPrevHref(currentPage)}
          style="rotate: 0.4deg"
        >
          {/* 同じ矢印を左右反転して戻り向きにする。逆向きの path を増やさない */}
          <ShortArrow class="mx-1 -scale-x-100" />
          前の紙へ戻る（{currentPage - 1}枚目 / {totalPages}枚）
        </a>
      )}
      {hasNext && (
        <a
          class="ml-auto inline-flex min-h-11 items-center lg:min-h-0"
          href={getPageHref(currentPage + 1)}
          style="rotate: -0.5deg"
        >
          つづきは次の紙
          <ShortArrow class="mx-1" />（{currentPage + 1}枚目 / {totalPages}枚）
        </a>
      )}
    </nav>
  );
};

export { Pagination };
