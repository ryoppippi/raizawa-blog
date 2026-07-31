import type { FC } from "hono/jsx";

/*
 * 写真のクリック拡大。
 * README は写真の view-transition-name で一覧→記事→拡大を繋ぐ案と Motion での
 * 動きを挙げているが、どちらも採らなかった：
 *   - view-transition-name は同じ名前が同一ページに2つあると発火しないので、
 *     本文の写真と拡大側の img で名前の付け替えが要り、この素朴なスクリプトの
 *     倍以上の状態管理になる。開閉は CSS の display 切り替えで足りている。
 *   - Motion は 5KB でも依存が1つ増える。ここで足す価値のある動きが無い。
 * 同じ理由で外部ライブラリは使わず、既存の toc.tsx と同じ埋め込みスクリプトにした。
 */
const lightboxScript = `(() => {
  const root = document.querySelector('.lightbox');
  if (!root) return;
  const items = Array.from(document.querySelectorAll('[data-lightbox]'));
  /* 写真の無い記事では箱ごと捨てる */
  if (items.length === 0) { root.remove(); return; }

  const img = root.querySelector('[data-lb-img]');
  const captionEl = root.querySelector('[data-lb-caption]');
  const indexEl = root.querySelector('[data-lb-index]');
  const closeBtn = root.querySelector('[data-lb-close]');
  let index = 0;
  let opener = null;

  const captionOf = (el) => {
    const span = el.closest('figure')?.querySelector('figcaption span');
    const text = span?.textContent?.trim();
    return (text && text !== '') ? text : (el.getAttribute('alt') || '');
  };

  const show = (next) => {
    index = (next + items.length) % items.length;
    const target = items[index];
    const caption = captionOf(target);
    img.src = target.currentSrc || target.src;
    img.alt = caption;
    captionEl.textContent = caption;
    indexEl.textContent = (index + 1) + ' / ' + items.length;
  };

  const isOpen = () => root.classList.contains('is-open');

  const open = (at, trigger) => {
    opener = trigger;
    show(at);
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    /* 背面の紙が動くと拡大の意味が薄れるので、開いている間はスクロールを止める */
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  const close = () => {
    if (!isOpen()) return;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    opener?.focus();
    opener = null;
  };

  items.forEach((el, at) => {
    el.style.cursor = 'zoom-in';
    /* img はフォーカスを受けないので、キーボードでも開けるようにする */
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.addEventListener('click', () => open(at, el));
    el.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(at, el); }
    });
  });

  root.querySelector('[data-lb-prev]').addEventListener('click', () => show(index - 1));
  root.querySelector('[data-lb-next]').addEventListener('click', () => show(index + 1));
  closeBtn.addEventListener('click', close);
  /* 背景（写真とピルの外）を押したら閉じる */
  root.addEventListener('click', (ev) => { if (ev.target === root) close(); });

  document.addEventListener('keydown', (ev) => {
    if (!isOpen()) return;
    if (ev.key === 'Escape') { close(); return; }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); show(index - 1); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); show(index + 1); }
  });
})();`;

/* 本文の [data-lightbox] を拡大表示する。記事ページに1つだけ置く */
const Lightbox: FC = () => (
  <>
    <div
      class="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="写真の拡大表示"
      aria-hidden="true"
    >
      <button type="button" class="lightbox-close" data-lb-close="" aria-label="閉じる">
        ✕
      </button>
      {/* Src は開く時に入れる。空の src はページ自身を取りに行くので置かない */}
      <img data-lb-img="" alt="" />
      <div class="lightbox-bar">
        <button type="button" data-lb-prev="" aria-label="前の写真">
          ◀
        </button>
        <span data-lb-caption="" />
        <span data-lb-index="" class="text-ochre tracking-[0.14em]" />
        <button type="button" data-lb-next="" aria-label="次の写真">
          ▶
        </button>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: lightboxScript }} />
  </>
);

export { Lightbox };
