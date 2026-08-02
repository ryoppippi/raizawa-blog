const SINGULAR = 1;

/**
 * `98 posts` / `1 post`。
 * 紙に手で書く体裁でも、英語のラベルは英語として正しく綴る。
 *
 * @param {number} count - 記事の本数
 * @returns {string} 単複を合わせたラベル
 */
const postsLabel = (count: number): string => {
  if (count === SINGULAR) {
    return "1 post";
  }
  return `${count} posts`;
};

export { postsLabel };
