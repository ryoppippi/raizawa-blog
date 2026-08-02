import type { FC } from "hono/jsx";
import { HandBox } from "./hand-boxes";
import { UpdatedAt } from "./updated-at";
import { toSlashDate } from "../lib/date";
import type { PostMeta } from "../lib/posts";

/* 見出しの直下。`7/28 ・ [しゅみ] ・ 7/30 直した` */
const PostMetaLine: FC<{ meta: PostMeta }> = ({ meta }) => (
  <div class="flex flex-wrap items-baseline gap-4 text-[13px] text-ink-soft">
    <time dateTime={meta.createdAt}>{toSlashDate(meta.createdAt)}</time>
    {meta.category !== "" && (
      <a href={`/category/${meta.category}`}>
        <HandBox>{meta.category}</HandBox>
      </a>
    )}
    <span>
      <UpdatedAt createdAt={meta.createdAt} updatedAt={meta.updatedAt} />
    </span>
  </div>
);

export { PostMetaLine };
