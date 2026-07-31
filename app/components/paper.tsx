import type { Child, FC } from "hono/jsx";

/*
 * 紙とインクの部品。
 * 手書きの線は Rough.js を使わず、手で引いた path を preserveAspectRatio="none" で
 * 伸ばしている。path を固定にしてあるのは、生成し直すとリロードのたびに形が変わるため。
 * 線幅まで一緒に伸びると、検索欄のような横長の枠で 5px 級になって破綻するので、
 * vector-effect="non-scaling-stroke" で太さだけ実寸に留める。
 */

/*
 * 紙の質感の定義。全ページで共有するので Layout が1回だけ描く。
 * CSS 側は filter: url(#paper) のように id で参照する。
 */
const PaperFilters: FC = () => (
  <svg width="0" height="0" class="absolute" aria-hidden="true">
    <title>paper texture filters</title>
    {/* 紙の表面（上質紙）：乱流を高さマップにして斜め225°から照らす */}
    <filter id="paper">
      <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="4" seed="3" result="n" />
      <feDiffuseLighting in="n" lighting-color="#fdfaf1" surfaceScale="1.1">
        <feDistantLight azimuth="225" elevation="65" />
      </feDiffuseLighting>
    </filter>
    {/* 写真に乗せる粒 */}
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    {/* 縦の繊維 */}
    <filter id="fiber">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.02 0.9"
        numOctaves="3"
        stitchTiles="stitch"
      />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    {/* 見出しと署名のインク沈み */}
    <filter id="ink">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" result="n" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="n"
        scale="3.2"
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

/* 紙の地。position: relative な器の直下に置く */
const PaperTexture: FC = () => <div class="paper-texture" aria-hidden="true" />;

const INK = "#1f3d2b";
const CRIMSON = "#8c1c2b";
const OCHRE = "#c8952f";

/*
 * 手書きの罫線。2本重ねの濃い線と薄い二度書き。
 * ヘッダーの下端と、節の区切りに使う。border-bottom は使わない
 */
const RULE_MAIN =
  "M4 5 C 130 2, 270 7.4, 430 4.4 C 590 1.6, 706 7.2, 866 4.6 C 962 3, 1030 6.4, 1076 4.2";
const RULE_ALT =
  "M4 4.6 C 128 7.2, 268 2.2, 428 5.2 C 588 8, 704 2.6, 864 5 C 960 6.4, 1032 3.2, 1076 5.4";
const RULE_SECOND = "M14 6.8 C 150 4.4, 320 8.6, 486 6";

// 三項演算子はこのリポジトリでは禁止（oxlint の no-ternary）なので、色や形の選択は関数に出す
const ruleShapeOf = (alt: boolean): string => {
  if (alt) {
    return RULE_ALT;
  }
  return RULE_MAIN;
};

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

interface HandRuleProps {
  /* True でヘッダー用の揺れ違いの線に切り替える */
  alt?: boolean;
  /* 薄い1本だけ（節の区切り） */
  thin?: boolean;
  class?: string;
}

const HandRule: FC<HandRuleProps> = ({ alt = false, thin = false, class: className = "" }) => {
  if (thin) {
    return (
      <svg
        class={`hand-rule h-2 ${className}`}
        viewBox="0 0 1080 8"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M2 4.4 C 260 2, 580 6.6, 810 4.2 C 950 2.8, 1024 5.6, 1078 4"
          fill="none"
          stroke={INK}
          stroke-width="1.3"
          opacity=".5"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
        />
      </svg>
    );
  }
  return (
    <svg
      class={`hand-rule ${className}`}
      viewBox="0 0 1080 9"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={ruleShapeOf(alt)}
        fill="none"
        stroke={INK}
        stroke-width="1.7"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <path
        d={RULE_SECOND}
        fill="none"
        stroke={INK}
        stroke-width=".9"
        opacity=".4"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  );
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

/* 深緑のゴム印。現在ページと rss に使う */
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

/* エンジの手書き下線。現在地を示す */
const HandUnderline: FC<{ class?: string }> = ({ class: className = "" }) => (
  <svg
    class={className}
    height="10"
    viewBox="0 0 40 10"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      d="M2 5 C 12 2, 28 8, 38 4"
      fill="none"
      stroke={CRIMSON}
      stroke-width="1.8"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
);

/* 黄土のハイライト。本文の書き込み専用 */
const HandHighlight: FC<{ children: Child }> = ({ children }) => (
  <span class="mark-highlight">
    <svg viewBox="0 0 90 28" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M2 4 C 24 1, 58 3, 88 4 C 89 12, 88 19, 87 24 C 60 26, 28 25, 3 24 C 1 17, 1 10, 2 4 Z"
        fill={OCHRE}
        opacity=".34"
      />
    </svg>
    <span>{children}</span>
  </span>
);

/*
 * 写真に重ねる粒・繊維・インク溜まりの JSX 版はここには置かない。
 * 今のところ写真を出すのは本文の figure だけで、markdown-it のレンダラは
 * 文字列しか返せず JSX の部品を呼べない。二重に持つと形がずれるので、
 * markdown-it-figure.ts の PHOTO_TEXTURE 一本にしてある。
 * カバー写真（#72）を JSX から出すときにこちらへ戻す。
 */

/* 右下の折り目。裏から rss と about が出る。モバイルでは使わない */
const DogEar: FC = () => (
  <div class="dogear">
    <div class="dogear-back">
      <a href="/feed.xml">rss</a>
      <a href="/">about</a>
    </div>
    <div class="dogear-fold" aria-hidden="true" />
  </div>
);

/* 記事末と メニューの署名。1ページ1回だけ */
const Signature: FC<{ class?: string }> = ({ class: className = "" }) => (
  <span class={`signature ${className}`} aria-hidden="true">
    r-aizawa
  </span>
);

export {
  DogEar,
  HandBox,
  HandHighlight,
  HandRule,
  HandStamp,
  HandUnderline,
  PaperFilters,
  PaperTexture,
  Signature,
};
