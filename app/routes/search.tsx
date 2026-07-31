import { createRoute } from "honox/factory";
import { Layout } from "../components/layout";
import { HandBox, HandRule } from "../components/paper";
import { SITE_TITLE, SITE_URL } from "../lib/config";
import { toShortEnglishDate } from "../lib/date";
import { getAllPosts } from "../lib/posts";

/*
 * Pagefind の Component UI はカスタム要素ごと自前の見た目を持っていて紙に馴染まないので、
 * JS API（pagefind.search）だけ使って結果は自前のマークアップに流し込む。
 */

/* カテゴリと日付は pagefind の meta に入っていない（返るのは title だけ）。
 * post-detail 側に data-pagefind-meta を足す手もあるが、そこは触らない約束なので
 * ビルド時の一覧をそのまま同梱して引く */
const buildPostIndex = (): string =>
  JSON.stringify(
    Object.fromEntries(
      getAllPosts().map((post) => [post.slug, [post.category, toShortEnglishDate(post.createdAt)]]),
    ),
  );

/* 一覧は data 属性から読む。<script> に直接埋めると </script> の混入を自前で
 * 潰す羽目になるが、属性なら JSX 側が HTML エスケープしてくれる */
const SEARCH_SCRIPT = `{
  const posts = JSON.parse(document.getElementById('search-index').dataset.posts);
  const input = document.getElementById('search-input');
  const list = document.getElementById('search-results');
  const countEl = document.getElementById('search-count');
  const statusEl = document.getElementById('search-status');
  const moreEl = document.getElementById('search-more');
  const moreCountEl = document.getElementById('search-more-count');
  const moreButton = document.getElementById('search-more-button');
  const perPage = 5;
  let engine = null;
  let hits = [];
  let shown = 0;
  let generation = 0;
  let timer = 0;

  const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => escapes[char]);

  const slugOf = (url) =>
    url.split('?')[0].split('#')[0]
      .replace(/\\.html$/, '').replace(/\\/index$/, '').replace(/\\/$/, '')
      .replace(/^\\/posts\\//, '');

  const setStatus = (text) => {
    statusEl.textContent = text;
    statusEl.hidden = text === '';
  };

  const toHtml = (data) => {
    const meta = posts[slugOf(data.url)];
    const head = meta === undefined
      ? ''
      : '<span class="flex items-center gap-[10px] font-label text-meta-lg text-ink-soft">'
        + '<span class="text-green">' + escapeHtml(meta[0]) + '</span>'
        + '<span>' + escapeHtml(meta[1]) + '</span>'
        + '</span>';
    return '<a class="post-row flex-col items-start gap-[6px] px-[14px] py-[13px]" href="'
      + escapeHtml(data.url) + '">'
      + head
      + '<span class="text-lead font-semibold text-ink-strong">'
      + escapeHtml(data.meta && data.meta.title ? data.meta.title : data.url) + '</span>'
      + '<span class="text-[13.5px] leading-[1.95] text-ink-body">' + data.excerpt + '</span>'
      + '</a>';
  };

  const renderMore = () => {
    const rest = hits.length - shown;
    moreEl.hidden = rest <= 0;
    moreCountEl.textContent = String(rest);
  };

  const appendPage = async () => {
    const slice = hits.slice(shown, shown + perPage);
    const data = await Promise.all(slice.map((hit) => hit.data()));
    shown += slice.length;
    list.insertAdjacentHTML('beforeend', data.map(toHtml).join(''));
    renderMore();
  };

  const clear = () => {
    hits = [];
    shown = 0;
    list.innerHTML = '';
    countEl.textContent = '';
    moreEl.hidden = true;
  };

  // vite dev には /pagefind/ が無い（pagefind --site dist はビルドの後に走る）。
  // ここで落ちるとページごと壊れるので、失敗は文言に落として握る
  const load = async () => {
    if (engine === null) {
      const loaded = await import('/pagefind/pagefind.js');
      if (typeof loaded.init === 'function') {
        await loaded.init();
      }
      engine = loaded;
    }
    return engine;
  };

  const run = async (query) => {
    const current = ++generation;
    if (query === '') {
      clear();
      setStatus('');
      return;
    }
    let pagefind;
    try {
      pagefind = await load();
    } catch {
      clear();
      setStatus('検索はビルド後に使えます');
      return;
    }
    const found = await pagefind.search(query);
    if (current !== generation) {
      return;
    }
    clear();
    hits = found.results;
    countEl.textContent = hits.length + ' results';
    setStatus(hits.length === 0 ? '見つかりませんでした' : '');
    await appendPage();
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);
    const query = input.value.trim();
    timer = setTimeout(() => { void run(query); }, 180);
  });
  moreButton.addEventListener('click', () => { void appendPage(); });

  const initial = (new URLSearchParams(location.search).get('q') || '').trim();
  if (initial !== '') {
    input.value = initial;
    void run(initial);
  }
}`;

/* ヒット語は pagefind が <mark> で返す。.prose-article の外なので、
 * style.css を触らずに済むようこのページだけの黄土の下敷きをここに置く */
const markStyle = `#search-results mark {
  background: rgb(200 149 47 / 0.34);
  color: inherit;
  padding: 0 3px;
}`;

export default createRoute((c) =>
  c.render(
    <Layout
      title={`search - ${SITE_TITLE}`}
      description={`${SITE_TITLE}の記事を全文検索`}
      nav="search"
      ogUrl={`${SITE_URL}/search`}
    >
      <style dangerouslySetInnerHTML={{ __html: markStyle }} />
      <span id="search-index" data-posts={buildPostIndex()} hidden />

      <main class="sheet-narrow pt-8 pb-14">
        <h1 class="label-heading mb-5">search</h1>

        <HandBox class="mb-[10px] block w-full px-4 py-[13px]">
          <span class="flex items-center gap-3">
            <input
              id="search-input"
              type="text"
              autocomplete="off"
              aria-label="記事を検索"
              placeholder="記事を検索"
              class="min-w-0 flex-1 bg-transparent font-jp text-[15px] tracking-normal text-ink-strong outline-none placeholder:text-ink-faint"
            />
            <span id="search-count" class="label-date shrink-0" />
          </span>
        </HandBox>

        <p class="label-date mb-6">powered by pagefind ・ 全文検索</p>
        {/* 文言は和文なので EB Garamond ではなく本文と同じ手（Klee One）で出す */}
        <p id="search-status" class="mb-6 text-body-sm text-ink-soft" hidden />

        <div id="search-results" class="flex flex-col gap-[2px]" />

        <div id="search-more" class="relative mt-5 pt-[14px]" hidden>
          <HandRule thin class="absolute inset-x-0 top-0" />
          <span class="label-date">
            さらに<span id="search-more-count">0</span>件 →{" "}
            <button type="button" id="search-more-button" class="cursor-pointer text-crimson">
              show more
            </button>
          </span>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{ __html: SEARCH_SCRIPT }} />
    </Layout>,
  ),
);
