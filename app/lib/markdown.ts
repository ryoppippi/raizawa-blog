import anchor from "markdown-it-anchor";
import { figurePlugin } from "./markdown-it-figure";
import { notePlugin } from "./markdown-it-note";
import { preprocessOgpCards } from "./markdown-it-ogp-card";
import { SHIKI_THEME, getHighlighter, shikiTransformers } from "./shiki";
import type { RenderResult, TocItem } from "./toc";
import MarkdownIt from "markdown-it";

// Initialize markdown-it
const md = MarkdownIt({ breaks: true, html: true });

md.use(figurePlugin);
md.use(notePlugin);

let currentTocItems: TocItem[] = [];

md.use(anchor, {
  callback: (token: { tag: string }, info: { slug: string; title: string }) => {
    currentTocItems.push({
      id: info.slug,
      level: Number(token.tag.slice(1)),
      text: info.title,
    });
  },
  permalink: anchor.permalink.linkAfterHeader({
    assistiveText: (title: string) => `「${title}」へのリンク`,
    class: "header-anchor",
    placement: "after",
    style: "aria-label",
    // 生の # は検索の抜粋に見出しの数だけ紛れ込むので索引から外す
    symbol: "<span data-pagefind-ignore>#</span>",
    wrapper: ['<div class="heading-wrapper">', "</div>"],
  }),
});

// Shiki plugin (initialized lazily)
let shikiInitialized = false;

const getLangFromTokenInfo = (info: string): string => {
  const [langPart] = info.split(/\s+/);
  if (langPart !== undefined && langPart !== "") {
    return langPart;
  }
  return "text";
};

const resolveLang = (lang: string, loadedLangs: string[]): string => {
  if (loadedLangs.includes(lang)) {
    return lang;
  }
  return "text";
};

const initShiki = async (): Promise<void> => {
  if (shikiInitialized) {
    return;
  }

  const highlighter = await getHighlighter();

  // Custom fence renderer using Shiki
  md.renderer.rules.fence = (tokens, idx): string => {
    const token = tokens[idx];
    if (token === undefined) {
      return "";
    }
    // コードフェンスの中身は必ず改行で終わる。そのまま渡すと貼った紙の末尾に空の行が1本余る
    const code = token.content.replace(/\n$/u, "");
    const lang = getLangFromTokenInfo(token.info);
    const meta = token.info.slice(lang.length).trim();
    const langToUse = resolveLang(lang, highlighter.getLoadedLanguages());

    return highlighter.codeToHtml(code, {
      lang: langToUse,
      meta: { __raw: meta },
      theme: SHIKI_THEME,
      transformers: shikiTransformers,
    });
  };

  shikiInitialized = true;
};

const renderMarkdown = async (markdown: string): Promise<RenderResult> => {
  await initShiki();
  const processedMarkdown = await preprocessOgpCards(markdown);
  currentTocItems = [];
  const html = md.render(processedMarkdown);
  return { html, toc: [...currentTocItems] };
};

export { renderMarkdown };
