const LOCALE = "ja-JP";
const EN_LOCALE = "en-US";
const TIMEZONE = "Asia/Tokyo";

const toLocalDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString(LOCALE, { timeZone: TIMEZONE });

/**
 * `July 28, 2026` — EB Garamond で組む記事メタの日付。
 *
 * @param {string} dateStr - ISO 8601 の日時
 * @returns {string} 月名を綴った英語表記の日付
 */
const toLongEnglishDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString(EN_LOCALE, {
    day: "numeric",
    month: "long",
    timeZone: TIMEZONE,
    year: "numeric",
  });

/**
 * `Feb 21, 2026` — 一覧の行に添える短い日付。
 *
 * @param {string} dateStr - ISO 8601 の日時
 * @returns {string} 月名を略した英語表記の日付
 */
const toShortEnglishDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString(EN_LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: TIMEZONE,
    year: "numeric",
  });

/**
 * `07/30` — `updated 07/30` の添え字。
 *
 * @param {string} dateStr - ISO 8601 の日時
 * @returns {string} ゼロ詰めの月日
 */
const toSlashDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString(EN_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    timeZone: TIMEZONE,
  });

const isSameDay = (dateA: string, dateB: string): boolean =>
  toLocalDate(dateA) === toLocalDate(dateB);

export { isSameDay, toLocalDate, toLongEnglishDate, toShortEnglishDate, toSlashDate };
