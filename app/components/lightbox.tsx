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
    const caption = el.closest('figure')?.querySelector('figcaption');
    const text = caption?.textContent?.trim();
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

/*
 * 拡大中の操作はすべて手書きの白線で描く（設計 6b）。
 * 紙から剥がして手に取っている場面なので、活字の ✕ や ◀ を混ぜない
 */
const LightboxClose: FC = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <path
      d="M6 6.5 C 10.5 11, 15.5 16, 20 20.5 M20 6.5 C 15.5 11.5, 10.5 16, 6 20.5"
      fill="none"
      stroke="#f6f1e4"
      stroke-width="1.6"
      stroke-linecap="round"
    />
    {/* 手書きの円囲い。閉じ口を少し開けておく */}
    <path
      d="M13 1.6 C 20.4 1.8, 24.6 6.4, 24.4 13.2 C 24.2 20.4, 19.6 24.6, 12.8 24.4 C 5.6 24.2, 1.6 19.6, 1.8 12.8 C 2 6 6.4 1.8, 13 1.6"
      fill="none"
      stroke="#f6f1e4"
      stroke-width="1.3"
      opacity=".7"
      stroke-linecap="round"
    />
  </svg>
);

// 同じ path を左右反転して逆向きにする。逆向きの path を増やさない
const flipOf = (direction: "prev" | "next"): string => {
  if (direction === "prev") {
    return "";
  }
  return "-scale-x-100";
};

const LightboxArrow: FC<{ direction: "prev" | "next" }> = ({ direction }) => (
  <svg width="18" height="16" viewBox="0 0 18 16" class={flipOf(direction)} aria-hidden="true">
    <path
      d="M16 8 C 11 7.2, 6 8.8, 2.4 8"
      fill="none"
      stroke="#f6f1e4"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M7 3 C 5 4.8, 3.4 6.8, 2.2 8 C 3.6 9.4, 5.4 11.4, 7.2 13"
      fill="none"
      stroke="#f6f1e4"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
);

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
        <LightboxClose />
      </button>
      {/* Src は開く時に入れる。空の src はページ自身を取りに行くので置かない */}
      <img data-lb-img="" alt="" />
      <div class="lightbox-bar">
        <button type="button" data-lb-prev="" aria-label="前の写真">
          <LightboxArrow direction="prev" />
        </button>
        <span data-lb-caption="" />
        <span data-lb-index="" class="text-ochre tracking-[0.14em]" />
        <button type="button" data-lb-next="" aria-label="次の写真">
          <LightboxArrow direction="next" />
        </button>
      </div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: lightboxScript }} />
  </>
);

export { Lightbox };
