import type { Child, FC } from "hono/jsx";

/*
 * 紙とインクの部品。
 * 手書きの線は Rough.js を使わず、手で引いた path を preserveAspectRatio="none" で
 * 伸ばしている。path を固定にしてあるのは、生成し直すとリロードのたびに形が変わるため。
 * 線幅まで一緒に伸びると、検索欄のような横長の枠で 5px 級になって破綻するので、
 * vector-effect="non-scaling-stroke" で太さだけ実寸に留める。
 */

/*
 * 写真の粒と、見出し・署名のインク沈みの定義。全ページで共有するので Layout が1回だけ描く。
 * CSS 側は filter: url(#ink) のように id で参照する。
 * 紙の地の質感はここではなく style.css の --paper-grain（タイル）が持つ。
 * 要素へ直接掛けるとフィルター領域の上限に当たって途中で切れるため
 */
const PaperFilters: FC = () => (
  <svg width="0" height="0" class="absolute" aria-hidden="true">
    <title>paper texture filters</title>
    {/* 写真に乗せる粒 */}
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
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

/* エンジの手書き下線。現在地と本文の書き込みに使う */
const HandUnderline: FC<{ class?: string }> = ({ class: className = "" }) => (
  <svg class={className} viewBox="0 0 84 6" preserveAspectRatio="none" aria-hidden="true">
    <path
      d="M2 3.4 C 24 1.8, 56 4.6, 82 2.8"
      fill="none"
      stroke={CRIMSON}
      stroke-width="1.4"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
);

/*
 * 黄土のハイライト。蛍光ペンではなく色鉛筆のつもりなので、
 * SVG の塗りをやめて端の薄れる gradient にした（CSS の .mark-highlight）。
 * 行をまたいでも破綻しないという利点もある
 */
const HandHighlight: FC<{ children: Child }> = ({ children }) => (
  <span class="mark-highlight">{children}</span>
);

/*
 * 写真に重ねる粒・繊維・インク溜まりの JSX 版はここには置かない。
 * 今のところ写真を出すのは本文の figure だけで、markdown-it のレンダラは
 * 文字列しか返せず JSX の部品を呼べない。二重に持つと形がずれるので、
 * markdown-it-figure.ts の PHOTO_TEXTURE 一本にしてある。
 * カバー写真（#72）を JSX から出すときにこちらへ戻す。
 */

/*
 * 右下の折り目（ドッグイヤー）は置かない。
 * ルーズリーフでは rss も自己紹介も赤線の左の見出し欄に書くので、
 * 紙の隅をめくる仕掛けは役目が重複する
 */

/* 記事末と メニューの署名。1ページ1回だけ */
const Signature: FC<{ class?: string }> = ({ class: className = "" }) => (
  <span class={`signature ${className}`} aria-hidden="true">
    r-aizawa
  </span>
);

export { HandHighlight, HandRule, HandUnderline, PaperFilters, PaperTexture, Signature };
