import type { FC } from "hono/jsx";
import { isSameDay, toSlashDate } from "../lib/date";

/*
 * `7/28 ・ しゅみ ・ 7/30 直した` の末尾。
 * 紙に書き足した体なので、英語の updated ではなく手書きの言い回しにする。
 * 同じ日に直しただけの記事に出しても読み手の判断は変わらないので出さない。
 * 年を省いているのは、直前に出る作成日と同じ年がほとんどで、繰り返すと日付が読みにくくなるため。
 */
const UpdatedAt: FC<{
  createdAt: string;
  updatedAt: string;
}> = ({ createdAt, updatedAt }) => {
  if (isSameDay(createdAt, updatedAt)) {
    return <></>;
  }
  return (
    <>
      {" ・ "}
      <time dateTime={updatedAt}>{toSlashDate(updatedAt)}</time>
      {" 直した"}
    </>
  );
};

export { UpdatedAt };
