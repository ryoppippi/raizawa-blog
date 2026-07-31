import type { FC } from "hono/jsx";
import { HandBox, HandStamp } from "./paper";
import { getPageHref, getPageNumbers, getPrevHref } from "../lib/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

/* モバイルのタップ領域は 44px。デスクトップでは行間が空きすぎるので詰める */
const NUMBER_CLASS =
  "inline-flex min-h-11 min-w-11 items-center justify-center text-green-soft lg:min-h-0 lg:min-w-0 lg:px-[11px] lg:py-1";

/*
 * ページ送り。
 * 現在ページは深緑のゴム印、next だけ手書きの枠。数字は囲まない。
 * prev をエンジにしていないのは、書き込みの色が2か所に増えると next の枠が埋もれるため。
 */
const Pagination: FC<PaginationProps> = ({ currentPage, totalPages }) => {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav
      class="mt-[22px] flex flex-wrap items-center justify-center gap-[6px] font-label text-[15px] tracking-[0.1em] lg:mt-[30px] lg:gap-2 lg:text-[14.5px]"
      aria-label="ページ送り"
    >
      {currentPage > 1 && (
        <a class={NUMBER_CLASS} href={getPrevHref(currentPage)}>
          prev
        </a>
      )}
      {pageNumbers.map((pageNum, index) => {
        if (pageNum === "...") {
          return (
            <span key={`ellipsis-${index}`} class="px-1 text-ink-faint" aria-hidden="true">
              …
            </span>
          );
        }
        const pageNumber = Number(pageNum);
        if (pageNumber === currentPage) {
          return (
            <HandStamp
              key={pageNumber}
              class="inline-flex min-h-11 items-center justify-center px-[13px] text-[15px] text-paper lg:min-h-0 lg:px-[11px] lg:py-1 lg:text-[14.5px]"
            >
              <span aria-current="page">{pageNumber}</span>
            </HandStamp>
          );
        }
        return (
          <a key={pageNumber} class={NUMBER_CLASS} href={getPageHref(pageNumber)}>
            {pageNumber}
          </a>
        );
      })}
      {currentPage < totalPages && (
        <a href={getPageHref(currentPage + 1)}>
          <HandBox
            class="inline-flex min-h-11 items-center justify-center px-[15px] text-[15px] text-crimson lg:min-h-0 lg:px-3 lg:py-1 lg:text-[14.5px]"
            stroke="crimson"
          >
            next
          </HandBox>
        </a>
      )}
    </nav>
  );
};

export { Pagination };
