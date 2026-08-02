import type { Child, FC } from "hono/jsx";

/*
 * 手書きの囲みとテープ。
 * 囲みは 現在地の楕円 / カテゴリ / note の3つだけに限る（決定事項メモ 4）。
 * 線幅が伸縮で太らないよう vector-effect="non-scaling-stroke" を付ける。
 */

const INK = "#1f3d2b";
const CRIMSON = "#8c1c2b";
const OCHRE = "#c8952f";

// 三項演算子はこのリポジトリでは禁止（oxlint の no-ternary）なので、色の選択は関数に出す
const strokeColorOf = (stroke: "green" | "crimson"): string => {
  if (stroke === "crimson") {
    return CRIMSON;
  }
  return INK;
};

const stampFillOf = (fill: "green" | "ochre"): string => {
  if (fill === "ochre") {
    return OCHRE;
  }
  return INK;
};

/*
 * 手書きの四角。囲みは増やすほど騒がしくなるので、
 * カテゴリ / note / rss / 現在ページ の4か所だけに使う
 */
const BOX_OUTER =
  "M3 4 C 30 2, 68 3.4, 97 3 C 98.6 11, 98 22, 97.4 28.6 C 70 30, 32 29.4, 3.6 28.8 C 2 21, 2.2 11, 3 4 Z";
const BOX_SECOND = "M6 5.4 C 34 3.6, 72 4.6, 95 4.2";
/* 同じ形を塗りに使うとゴム印になる */
const STAMP =
  "M2.4 3 C 12 1.6, 24 2.6, 31.6 2.4 C 32.8 10, 32.4 21, 31.8 27 C 22 28.4, 11 27.8, 2.8 27.4 C 1.6 20, 1.6 10, 2.4 3 Z";

interface HandBoxProps {
  children: Child;
  /* 枠の色。既定は深緑。next だけエンジ */
  stroke?: "green" | "crimson";
  class?: string;
}

/* 手書きの四角で囲んだラベル */
const HandBox: FC<HandBoxProps> = ({ children, stroke = "green", class: className = "" }) => (
  <span class={`hand-box ${className}`}>
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <path
        d={BOX_OUTER}
        fill="none"
        stroke={strokeColorOf(stroke)}
        stroke-width="1.5"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <path
        d={BOX_SECOND}
        fill="none"
        stroke={strokeColorOf(stroke)}
        stroke-width=".9"
        opacity=".45"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <span>{children}</span>
  </span>
);

/*
 * 手書きの楕円囲み。サイト名と、見出し欄の現在地に使う。
 * 四角の枠はカテゴリと note だけに残し、ナビは楕円で囲む
 */
const ELLIPSE_OUTER =
  "M38 4.4 C 60 3.2, 74 8.6, 73 17 C 72 26, 56 30.6, 37 29.8 C 17 29, 3 25.4, 4 16.4 C 5 8, 18 5.4, 38 4.4 Z";
const ELLIPSE_SECOND = "M36 6.6 C 56 5.2, 71 9, 70.6 16";

/*
 * 横長の楕円。サイト名のように中身が長いとき用。
 * 短い楕円を横へ引き伸ばすと上下の弧だけ平らになって形が崩れる
 */
const WIDE_OUTER =
  "M80 3 C 128 1, 158 8, 156 22 C 154 37, 120 42.4, 78 41 C 34 39.6, 3 35, 4.6 21 C 6 8, 36 4.6, 80 3 Z";
const WIDE_SECOND = "M76 5.6 C 118 3.8, 150 9, 149 20";

/* 中身の長さで楕円の形を選ぶ。三項演算子は禁止なので関数に出す */
const ellipseShapeOf = (wide: boolean): { box: string; outer: string; second: string } => {
  if (wide) {
    return { box: "0 0 160 44", outer: WIDE_OUTER, second: WIDE_SECOND };
  }
  return { box: "0 0 76 34", outer: ELLIPSE_OUTER, second: ELLIPSE_SECOND };
};

const HandEllipse: FC<{
  children: Child;
  stroke?: "green" | "crimson";
  /* 二度書きを重ねる。サイト名だけ */
  twice?: boolean;
  /* サイト名のように中身が長いとき */
  wide?: boolean;
  class?: string;
}> = ({ children, stroke = "crimson", twice = false, wide = false, class: className = "" }) => {
  const shape = ellipseShapeOf(wide);
  return (
    <span class={`hand-ellipse ${className}`}>
      <svg viewBox={shape.box} preserveAspectRatio="none" aria-hidden="true">
        <path
          d={shape.outer}
          fill="none"
          stroke={strokeColorOf(stroke)}
          stroke-width="1.6"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
        {twice && (
          <path
            d={shape.second}
            fill="none"
            stroke={strokeColorOf(stroke)}
            stroke-width=".9"
            opacity=".4"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        )}
      </svg>
      <span>{children}</span>
    </span>
  );
};

/* 深緑のゴム印。rss に使う */
const HandStamp: FC<{ children: Child; fill?: "green" | "ochre"; class?: string }> = ({
  children,
  fill = "green",
  class: className = "",
}) => (
  <span class={`hand-box ${className}`}>
    <svg viewBox="0 0 34 30" preserveAspectRatio="none" aria-hidden="true">
      <path d={STAMP} fill={stampFillOf(fill)} />
    </svg>
    <span>{children}</span>
  </span>
);

export { HandBox, HandEllipse, HandStamp };
