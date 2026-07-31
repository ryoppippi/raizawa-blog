import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { createHighlighterCore } from "shiki/core";
import type { HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { ShikiTransformer, ThemeRegistration } from "shiki";

const SHIKI_THEME = "paper";

// 「印刷して貼った紙」の配色。
// 既製の明るいテーマ（github-light）に差分を当てる案は不採用：青や紫が残って紙から浮くうえ、
// どのスコープが漏れているかを追い切れない。必要なスコープだけを持つテーマを自前で定義し、
// 指定の無いトークンはすべて地のインク（fg）に落とす。
// 黄土とエンジは手書きの書き込み専用なので、コードでは文字列のエンジ以外に使わない。
const PAPER_THEME: ThemeRegistration = {
  // 紙は CSS 側（.code-block-wrapper の #fdfcf7 ＋ 紙目フィルター）が敷く。
  // ここで塗ると pre が不透明な矩形になり、紙目が途切れる。
  bg: "transparent",
  fg: "#2b2721",
  name: SHIKI_THEME,
  settings: [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { fontStyle: "italic", foreground: "#8a8272" },
    },
    {
      scope: [
        "keyword",
        "storage",
        "variable.language",
        "entity.name.tag",
        "support.type.primitive",
      ],
      settings: { foreground: "#1f3d2b" },
    },
    {
      scope: [
        "string",
        "constant.character",
        "punctuation.definition.string",
        // JSON のキーを囲む引用符。これが無いと引用符だけ区切り記号の色になり、
        // 中身のエンジと分かれて見える
        "punctuation.support.type.property-name",
      ],
      settings: { foreground: "#8c1c2b" },
    },
    {
      scope: ["constant.numeric", "constant.language", "support.constant", "constant.other"],
      settings: { foreground: "#4d5a49" },
    },
    {
      scope: ["punctuation", "meta.brace"],
      settings: { foreground: "#6f6656" },
    },
  ],
  type: "light",
};

// Global highlighter cache
// eslint-disable-next-line init-declarations -- lazy initialization pattern
let highlighter: HighlighterCore | undefined;

// Helper to extract title from meta string
// Usage: ```ts title="filename.ts"
const REGEX_CAPTURE_GROUP_INDEX = 1;

const extractTitle = (meta: string | undefined): string | undefined => {
  if (meta === undefined || meta === "") {
    return undefined;
  }
  const match = meta.match(/title=["']([^"']+)["']/);
  return match?.[REGEX_CAPTURE_GROUP_INDEX];
};

// 言語が text に落ちたときはラベルを空にする。`text` と出しても読み手に情報が増えず、
// ファイル名の行としては雑音になるだけなので名乗らせない。
const PLAIN_LANGS = new Set(["ansi", "plaintext", "text", "txt"]);

const resolveHeadLabel = (title: string | undefined, lang: string | undefined): string => {
  if (title !== undefined && title !== "") {
    return title;
  }
  if (lang === undefined || PLAIN_LANGS.has(lang)) {
    return "";
  }
  return lang;
};

// 紙の見出し行（ファイル名 ＋ copy）で pre を包む。
// コピーボタンを pre の外に絶対配置する旧実装は不採用：
// 紙が -0.5deg 傾くとボタンだけ浮いて見え、破線の区切り行とも揃わない。
const transformerPaperSheet = (): ShikiTransformer => ({
  name: "paper-sheet",
  root(node): void {
    const [pre] = node.children;
    if (pre?.type !== "element") {
      return;
    }

    const label = resolveHeadLabel(extractTitle(this.options.meta?.__raw), this.options.lang);

    node.children = [
      {
        children: [
          {
            children: [
              {
                children: [{ type: "text", value: label }],
                properties: {},
                tagName: "span",
                type: "element",
              },
              {
                children: [{ type: "text", value: "copy" }],
                properties: { class: "copy-button" },
                tagName: "button",
                type: "element",
              },
            ],
            properties: { class: "code-head" },
            tagName: "div",
            type: "element",
          },
          pre,
        ],
        properties: { class: "code-block-wrapper" },
        tagName: "div",
        type: "element",
      },
    ];
  },
});

// All transformers used for syntax highlighting
const shikiTransformers = [
  transformerNotationDiff(),
  transformerNotationHighlight(),
  transformerNotationErrorLevel(),
  transformerPaperSheet(),
];

// Initialize Shiki highlighter (Cloudflare Workers compatible)
const getHighlighter = async (): Promise<HighlighterCore> => {
  if (highlighter !== undefined) {
    return highlighter;
  }

  highlighter = await createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [
      import("shiki/langs/rust.mjs"),
      import("shiki/langs/nix.mjs"),
      import("shiki/langs/bash.mjs"),
      import("shiki/langs/json.mjs"),
    ],
    themes: [PAPER_THEME],
  });

  return highlighter;
};

export { getHighlighter, SHIKI_THEME, shikiTransformers };
