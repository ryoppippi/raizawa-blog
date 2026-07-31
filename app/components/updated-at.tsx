import type { FC } from "hono/jsx";
import { isSameDay, toSlashDate } from "../lib/date";

/*
 * `July 28, 2026 ・ updated 07/30` の後半。
 * 同じ日に直しただけの記事に updated を出しても読み手の判断は変わらないので出さない。
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
      {" ・ updated "}
      <time>{toSlashDate(updatedAt)}</time>
    </>
  );
};

export { UpdatedAt };
