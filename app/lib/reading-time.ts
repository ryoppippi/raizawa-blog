// 記事は和文が主体なので単語数ではなく文字数で数える。
// 和文の黙読は 400〜600 字/分とされるので、その中間を採る。
const CHARS_PER_MINUTE = 500;
const MIN_MINUTES = 1;

/**
 * ヘッダーに出す `6 min read` の分数。
 *
 * @param {string} content - 記事の本文（markdown のまま）
 * @returns {number} 1以上の分数
 */
const readingMinutes = (content: string): number => {
  const chars = content.replaceAll(/\s/gu, "").length;
  return Math.max(MIN_MINUTES, Math.ceil(chars / CHARS_PER_MINUTE));
};

export { readingMinutes };
