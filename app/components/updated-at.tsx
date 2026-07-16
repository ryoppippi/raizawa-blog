import type { FC } from "hono/jsx";
import { isSameDay, toLocalDate } from "../lib/date";

const UpdatedAt: FC<{
  createdAt: string;
  updatedAt: string;
}> = ({ createdAt, updatedAt }) => {
  if (isSameDay(createdAt, updatedAt)) {
    return <></>;
  }
  return (
    <span>
      {" "}
      (更新: <time>{toLocalDate(updatedAt)}</time>)
    </span>
  );
};

export { UpdatedAt };
