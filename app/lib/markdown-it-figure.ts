import { escapeHtml } from "markdown-it/lib/common/utils.mjs";
import type MarkdownIt from "markdown-it";
import type { RuleCore } from "markdown-it/lib/parser_core.mjs";
import type { RenderRule } from "markdown-it/lib/renderer.mjs";
import type Token from "markdown-it/lib/token.mjs";

/*
 * 本文の画像を、紙にテープで直貼りした figure にする。
 * 白フチの台紙には貼らない（ルーズリーフに写真を台紙ごと貼る人はいない）。
 *
 * 粒は markdown-it のレンダラが文字列しか返せず JSX の部品を呼べないので、
 * ここで文字列として持つ。CSS 側の .photo-grain と対になっている。
 */
const PHOTO_GRAIN =
  '<svg class="photo-grain" aria-hidden="true"><rect width="100%" height="100%" filter="url(#grain)"></rect></svg>';

/*
 * マスキングテープ。上辺2箇所に、少し違う角度で貼る。
 * 位置と角度を1枚ずつ変えたいところだが、markdown からは枚数しか分からないので
 * 貼り方は2種類を交互に使う（全部同じだと機械が貼ったように見える）
 */
const TAPES = [
  '<span class="tape" style="top:-9px;left:30px;width:62px;rotate:-4deg"></span>' +
    '<span class="tape" style="top:-9px;right:40px;width:58px;rotate:4deg"></span>',
  '<span class="tape" style="top:-9px;left:26px;width:56px;rotate:-5deg"></span>' +
    '<span class="tape" style="bottom:-8px;right:20px;width:52px;rotate:5deg"></span>',
];

/* 傾きも交互に。几帳面に揃えるとメモの延長に見えない */
const TILTS = ["-1.8deg", "2.2deg", "-1.6deg", "1.4deg"];

let photoCount = 0;

const nextTape = (): string => TAPES[photoCount % TAPES.length] ?? "";
const nextTilt = (): string => TILTS[photoCount % TILTS.length] ?? "-1.8deg";

/*
 * 図解・スクリーンショットの印は タイトル記法 `![alt](src "plain")` にした。
 * README の `![](foo.png){.plain}` は markdown-it 標準では属性を拾えず、
 * markdown-it-attrs を足すことになるので採らなかった。`.png` を図解とみなす案も、
 * 写真の PNG とスクショの JPEG があるので拡張子は中身を表さない。
 */
const PLAIN_TITLE = "plain";

/* 段落まるごと1枚の画像だったもの。figure に組み替える対象 */
const standaloneImages = new WeakSet<Token>();

const isBlankText = (token: Token): boolean =>
  token.type === "softbreak" || (token.type === "text" && token.content.trim() === "");

const imagesOf = (inline: Token): Token[] =>
  (inline.children ?? []).filter((child) => child.type === "image");

/* 段落の中身が画像だけか（間の改行・空白は無視する） */
const isImageOnlyParagraph = (inline: Token): boolean =>
  imagesOf(inline).length > 0 &&
  (inline.children ?? []).every((child) => child.type === "image" || isBlankText(child));

const isStandaloneImageParagraph = (tokens: Token[], idx: number): boolean => {
  const token = tokens[idx];
  return (
    token?.type === "inline" &&
    tokens[idx - 1]?.type === "paragraph_open" &&
    tokens[idx + 1]?.type === "paragraph_close" &&
    isImageOnlyParagraph(token)
  );
};

const hide = (token: Token | undefined): void => {
  if (token !== undefined) {
    token.hidden = true;
  }
};

const markAsFigure = (inline: Token): void => {
  // 画像の間の改行は <br> になってしまうので落とす
  inline.children = imagesOf(inline);
  for (const image of inline.children) {
    standaloneImages.add(image);
  }
};

/*
 * Figure は段落の中に置けない（ブラウザが <p> を勝手に閉じて空段落が残る）ので、
 * 画像だけの段落は <p> を出さずに figure を直に置く。
 * 文中に混じった画像は行の中に留めたいので、素の <img> のまま出す。
 */
const liftStandaloneImages: RuleCore = (state) => {
  const { tokens } = state;
  for (const [idx, token] of tokens.entries()) {
    if (isStandaloneImageParagraph(tokens, idx)) {
      hide(tokens[idx - 1]);
      hide(tokens[idx + 1]);
      markAsFigure(token);
    }
  }
};

// 三項演算子はこのリポジトリでは禁止（oxlint の no-ternary）なので、出し分けは関数に出す
const lightboxAttr = (lightbox: boolean): string => {
  if (lightbox) {
    return " data-lightbox";
  }
  return "";
};

const figureClassOf = (token: Token): string => {
  if (token.attrGet("title") === PLAIN_TITLE) {
    return ' class="plain"';
  }
  return "";
};

const attr = (name: string, value: string): string => ` ${name}="${escapeHtml(value)}"`;

const titleAttr = (title: string): string => {
  if (title === "" || title === PLAIN_TITLE) {
    return "";
  }
  return attr("title", title);
};

/*
 * Width / height は付けない。README は必須としているが、寸法の出どころになる
 * frontmatter と R2 の仕組みがまだ無く、markdown からは分からないため。
 * 同じ理由で `img/foo.jpg` → R2 のURL解決もしない（バケットも写真もまだ無い）。
 */
const imgTag = (token: Token, lightbox: boolean): string =>
  [
    "<img",
    attr("src", token.attrGet("src") ?? ""),
    attr("alt", token.content),
    ' loading="lazy" decoding="async"',
    lightboxAttr(lightbox),
    titleAttr(token.attrGet("title") ?? ""),
    ">",
  ].join("");

const figcaptionOf = (caption: string): string => {
  if (caption === "") {
    return "";
  }
  return `<figcaption>${escapeHtml(caption)}</figcaption>`;
};

const figureHtml = (token: Token): string => {
  const html =
    `<figure${figureClassOf(token)}><span class="photo" style="--tilt:${nextTilt()}">` +
    `<span class="photo-body">${imgTag(token, true)}${PHOTO_GRAIN}${nextTape()}</span>` +
    `${figcaptionOf(token.content)}</span></figure>\n`;
  photoCount += 1;
  return html;
};

const renderImage: RenderRule = (tokens, idx) => {
  const token = tokens[idx];
  if (token === undefined) {
    return "";
  }
  if (!standaloneImages.has(token)) {
    return imgTag(token, false);
  }
  return figureHtml(token);
};

/**
 * 本文の画像を白フチの figure にする markdown-it プラグイン。
 *
 * @param {MarkdownIt} md - 対象の markdown-it インスタンス
 * @returns {void}
 */
const figurePlugin = (md: MarkdownIt): void => {
  md.core.ruler.push("standalone_image", liftStandaloneImages);
  md.renderer.rules.image = renderImage;
};

export { figurePlugin };
