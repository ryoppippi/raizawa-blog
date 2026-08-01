import type { FC } from "hono/jsx";

/*
 * 手書きの矢印。
 * 文字の「→」「↗」グリフは使わない（決定事項メモ 9）。
 * 矢印は説明の向きに引くもので、活字の記号ではないため。
 */

const CRIMSON = "#8c1c2b";

/* 長い矢印。prev と next に使う。二度書きで、矢じりは開いた V */
const LEFT = {
  head: "M30 4 C 22 7.4, 13 10.6, 9 12.6 C 14 15.4, 24 19.6, 32 23",
  second: "M292 17.6 C 230 14.6, 160 18.8, 96 15.6",
  shaft: "M298 14 C 220 10.4, 120 16.8, 10 12.6",
};
const RIGHT = {
  head: "M268 4 C 276 7.4, 286 11, 290 14 C 285 16.4, 275 20, 267 23.4",
  second: "M10 16.8 C 80 19.4, 150 14.6, 210 17.2",
  shaft: "M2 12.6 C 90 16.8, 190 10.4, 290 14",
};

// 三項演算子はこのリポジトリでは禁止（oxlint の no-ternary）なので、向きの選択は関数に出す
const shapeOf = (direction: "prev" | "next"): { head: string; second: string; shaft: string } => {
  if (direction === "prev") {
    return LEFT;
  }
  return RIGHT;
};

const LongArrow: FC<{ direction: "prev" | "next" }> = ({ direction }) => {
  const shape = shapeOf(direction);
  return (
    <svg viewBox="0 0 300 26" preserveAspectRatio="none" aria-hidden="true">
      <path
        d={shape.shaft}
        fill="none"
        stroke={CRIMSON}
        stroke-width="1.7"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <path
        d={shape.head}
        fill="none"
        stroke={CRIMSON}
        stroke-width="1.7"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <path
        d={shape.second}
        fill="none"
        stroke={CRIMSON}
        stroke-width=".9"
        opacity=".4"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  );
};

/* 「つづきは次の紙」に添える短い矢印 */
const ShortArrow: FC<{ class?: string }> = ({ class: className = "" }) => (
  <svg
    class={className}
    width="38"
    height="13"
    viewBox="0 0 38 13"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M2 7 C 13 5.4, 26 8, 34 6.6"
      fill="none"
      stroke={CRIMSON}
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M28 2 C 30.4 3.8, 33 5.6, 34.6 6.6 C 32 8, 29 9.8, 27 11.4"
      fill="none"
      stroke={CRIMSON}
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
);

/* 外部リンクの斜め上向き。文字のグリフではなく手書きの線で引く */
const ExternalArrow: FC = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" class="self-center" aria-hidden="true">
    <path
      d="M2 11 C 4.6 8, 7.6 5, 10.6 2.8"
      fill="none"
      stroke={CRIMSON}
      stroke-width="1.4"
      stroke-linecap="round"
    />
    <path
      d="M5.6 2 C 7.6 2.2, 9.4 2.3, 11 2.4 C 10.8 4, 10.8 6.2, 10.9 8"
      fill="none"
      stroke={CRIMSON}
      stroke-width="1.4"
      stroke-linecap="round"
    />
  </svg>
);

export { ExternalArrow, LongArrow, ShortArrow };
