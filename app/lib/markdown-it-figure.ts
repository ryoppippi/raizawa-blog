import { escapeHtml } from "markdown-it/lib/common/utils.mjs";
import type MarkdownIt from "markdown-it";
import type { RuleCore } from "markdown-it/lib/parser_core.mjs";
import type { RenderRule } from "markdown-it/lib/renderer.mjs";
import type Token from "markdown-it/lib/token.mjs";

/*
 * 本文の画像を白フチの figure にする。
 *
 * 粒・繊維・インク溜まりは、markdown-it のレンダラが文字列しか返せず JSX の部品を
 * 呼べないので、ここで文字列として持つ。CSS 側の .photo-grain / .photo-fiber /
 * .photo-well と対になっている。
 */
const PHOTO_TEXTURE =
  '<svg class="photo-grain" aria-hidden="true"><rect width="100%" height="100%" filter="url(#grain)"></rect></svg>' +
  '<svg class="photo-fiber" aria-hidden="true"><rect width="100%" height="100%" filter="url(#fiber)"></rect></svg>' +
  '<div class="photo-well" aria-hidden="true"></div>';

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

/* キャプションが無い時は figcaption が持っていた下の余白を白フチ側で補う */
const frameClassOf = (caption: string): string => {
  if (caption === "") {
    return "photo-frame pb-[10px]";
  }
  return "photo-frame";
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
  return `<figcaption><span>${escapeHtml(caption)}</span></figcaption>`;
};

const figureHtml = (token: Token): string =>
  `<figure${figureClassOf(token)}><div class="${frameClassOf(token.content)}">` +
  `<div class="relative">${imgTag(token, true)}${PHOTO_TEXTURE}</div>` +
  `${figcaptionOf(token.content)}</div></figure>\n`;

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
