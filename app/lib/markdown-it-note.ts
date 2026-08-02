import type MarkdownIt from "markdown-it";
import type { RuleBlock } from "markdown-it/lib/parser_block.mjs";
import type StateBlock from "markdown-it/lib/rules_block/state_block.mjs";

/*
 * `::: note` を手書き枠の補足にする。
 *
 * Markdown-it-container は足さず、この1ルールで済ませている。
 * 使うのは note の1種類だけで、依存を増やすほどの分岐が無いため。
 */
const NOTE_MARKUP = ":::";
const NOTE_OPEN_RE = /^:::[ \t]*note[ \t]*$/u;
const NOTE_CLOSE_RE = /^:::[ \t]*$/u;
/* 4スペース以上下げた行はコードブロック。ルールを当てない */
const CODE_INDENT = 4;

/*
 * 手書きのボールペン枠。CSS が absolute で敷くので aside の先頭に置く。
 * 枠の縦横比は中身次第で変わるので、線の太さだけ non-scaling-stroke で実寸に留める
 */
const NOTE_FRAME =
  '<svg viewBox="0 0 640 90" preserveAspectRatio="none" aria-hidden="true">' +
  '<path d="M4 5 C 180 2.6, 440 4.4, 636 3.4 C 637.6 30, 637 62, 636.4 86 C 440 88, 190 87, 4.6 86.4 C 2.6 62, 3 30, 4 5 Z" fill="none" stroke="#1f3d2b" stroke-width="1.5" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>' +
  '<path d="M12 6.6 C 190 4.4, 460 6, 620 5" fill="none" stroke="#1f3d2b" stroke-width=".9" opacity=".45" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>' +
  "</svg>";

const lineAt = (state: StateBlock, line: number): string =>
  state.src
    .slice((state.bMarks[line] ?? 0) + (state.tShift[line] ?? 0), state.eMarks[line] ?? 0)
    .trim();

/* 閉じの ::: の行。閉じ忘れは文書の終わりで閉じる */
const findNoteEnd = (state: StateBlock, startLine: number, endLine: number): number => {
  let line = startLine + 1;
  while (line < endLine) {
    if (NOTE_CLOSE_RE.test(lineAt(state, line))) {
      return line;
    }
    line += 1;
  }
  return endLine;
};

const openNoteToken = (state: StateBlock, startLine: number, closeLine: number): void => {
  const open = state.push("note_open", "aside", 1);
  open.markup = NOTE_MARKUP;
  open.block = true;
  open.map = [startLine, closeLine];
};

const closeNoteToken = (state: StateBlock): void => {
  const close = state.push("note_close", "aside", -1);
  close.markup = NOTE_MARKUP;
  close.block = true;
};

/* 中身は markdown として読む。段落・リンク・インラインコードをそのまま使えるように */
const tokenizeNoteBody = (state: StateBlock, startLine: number, closeLine: number): void => {
  const oldLineMax = state.lineMax;
  state.lineMax = closeLine;
  state.md.block.tokenize(state, startLine + 1, closeLine);
  state.lineMax = oldLineMax;
};

const pushNote = (state: StateBlock, startLine: number, closeLine: number): void => {
  openNoteToken(state, startLine, closeLine);
  tokenizeNoteBody(state, startLine, closeLine);
  closeNoteToken(state);
};

/* 閉じ忘れは文書の終わりで閉じるので、その時は行を進めすぎない */
const lineAfterNote = (closeLine: number, endLine: number): number => {
  if (closeLine < endLine) {
    return closeLine + 1;
  }
  return closeLine;
};

// eslint-disable-next-line max-params -- markdown-it の RuleBlock が決めている引数
const noteRule: RuleBlock = (state, startLine, endLine, silent) => {
  const isNoteStart =
    (state.sCount[startLine] ?? 0) - state.blkIndent < CODE_INDENT &&
    NOTE_OPEN_RE.test(lineAt(state, startLine));
  if (!isNoteStart) {
    return false;
  }
  if (silent) {
    return true;
  }

  const closeLine = findNoteEnd(state, startLine, endLine);
  pushNote(state, startLine, closeLine);
  state.line = lineAfterNote(closeLine, endLine);
  return true;
};

/**
 * `::: note` を `<aside class="note">` にする markdown-it プラグイン。
 *
 * @param {MarkdownIt} md - 対象の markdown-it インスタンス
 * @returns {void}
 */
const notePlugin = (md: MarkdownIt): void => {
  md.block.ruler.before("fence", "note", noteRule, { alt: ["paragraph", "blockquote", "list"] });
  md.renderer.rules.note_open = (): string => `<aside class="note">${NOTE_FRAME}`;
  md.renderer.rules.note_close = (): string => "</aside>\n";
};

export { notePlugin };
