import type { FC } from "hono/jsx";
import { createRoute } from "honox/factory";
import { Layout } from "../components/layout";
import { ExternalArrow } from "../components/hand-arrows";
import { HandHighlight, HandUnderline, Signature } from "../components/paper";
import { ELSEWHERE_LINKS, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../lib/config";

/*
 * トップは自己紹介。見出し欄の「自己紹介」とヘッダーのロゴがどちらも "/" を指すので、
 * /about は別に作らずこの1枚に寄せる。
 */

const FAVORITES: string[] = [
  "ストリートファイター、鉄拳、EVO",
  "尾崎紀世彦、クリスタルキング、遠藤正明",
  "古着、ラルフローレン、コロンビア",
  "ショーシャンクの空に、グレイテストショーマン",
  "クウガ、アギト、龍騎、ファイズ",
  "カウボーイビバップ、遊戯王、WWE",
];

/*
 * 補足の枠。このページ唯一の囲み。
 * 共通の HandBox は viewBox 100x32 なので、横長に引き伸ばすと角の形が崩れる。
 * README「7. 横長の手書き枠は横長の viewBox で」に従って専用の path を使う
 */
const NoteFrame: FC = () => (
  <svg
    class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    viewBox="0 0 640 72"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      d="M16 10 C 190 6.4, 460 9, 626 7.8 C 630.6 26, 629.6 50, 628 64.6 C 450 68, 190 66.6, 17.6 64.8 C 12.6 48, 13.4 26, 16 10 Z"
      fill="none"
      stroke="#1f3d2b"
      stroke-width="1.5"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
    <path
      d="M26 13.4 C 210 10, 440 11.6, 610 10.6"
      fill="none"
      stroke="#1f3d2b"
      stroke-width=".9"
      opacity=".45"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
  </svg>
);

/* 節見出しのチェック風ストローク。prose の外なのでここで描く */
const CheckStroke: FC = () => (
  <svg width="26" height="20" viewBox="0 0 26 20" class="shrink-0" aria-hidden="true">
    <path
      d="M3 14 C 8 6, 18 4, 24 8"
      fill="none"
      stroke="#8c1c2b"
      stroke-width="1.6"
      stroke-linecap="round"
    />
  </svg>
);

export default createRoute((c) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    description: SITE_DESCRIPTION,
    name: SITE_TITLE,
    url: SITE_URL,
  };

  return c.render(
    <Layout
      description={SITE_DESCRIPTION}
      jsonLd={jsonLd}
      nav="about"
      ogUrl={SITE_URL}
      title={SITE_TITLE}
    >
      <main class="body-col">
        <div class="lg:flex lg:items-start lg:gap-12">
          <div class="min-w-0 lg:max-w-[700px] lg:flex-1">
            <h1
              class="text-[26px] leading-[calc(var(--line)*2)] font-semibold text-ink-strong lg:text-[30px]"
              style="filter: url(#ink); rotate: -0.3deg"
            >
              相沢と申します
            </h1>

            <p>
              Rustを書いて暮らしている。<HandHighlight>格ゲーと写真</HandHighlight>
              のためにブログを分けるのはやめて、全部この紙に書くことにした。
            </p>
            <p>
              ここは
              <span class="hand-underline">
                メモの延長
                <HandUnderline />
              </span>
              なので、きれいにまとまっていないことのほうが多い。書き直すときは取消線で残す。
            </p>

            <h2
              class="flex items-baseline gap-[10px] pt-[calc(var(--line)*2)] text-[20px] font-semibold text-ink-strong"
              style="rotate: -0.4deg"
            >
              <CheckStroke />
              好きなもの
            </h2>
            <div class="grid sm:grid-cols-2 sm:gap-x-10">
              {FAVORITES.map((favorite) => (
                <span key={favorite}>{favorite}</span>
              ))}
            </div>

            {/* このページ唯一の囲み */}
            <div class="relative mt-9 max-w-[640px] px-[26px] py-[18px]">
              <NoteFrame />
              <p class="relative text-[13px] leading-[2] text-ink">
                <span class="font-label text-[12.5px] tracking-[0.14em] text-ink-soft">note</span>
                　この紙は HonoX と Cloudflare Workers でできている。検索は Pagefind。作った話は{" "}
                <a href="/posts/2024/12/rough-blog-creation" class="text-crimson">
                  くっそ雑にブログを作った
                </a>{" "}
                に書いた。
              </p>
            </div>
          </div>

          {/* 右余白。本人写真は未提供なので elsewhere と署名だけ置く */}
          <div class="pt-10 lg:w-[280px] lg:shrink-0 lg:pt-6" style="rotate: 0.8deg">
            <span class="block pb-2 font-label text-[13px] tracking-[0.16em] text-ink-soft">
              elsewhere
            </span>
            {ELSEWHERE_LINKS.map((link) => (
              <a
                class="flex items-baseline gap-[10px] transition-transform hover:translate-x-1"
                href={link.href}
                key={link.label}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span class="font-label text-[15.5px] text-green">{link.label}</span>
                <ExternalArrow />
              </a>
            ))}
            <div class="flex justify-end pt-10">
              <Signature class="text-[32px]" />
            </div>
          </div>
        </div>
      </main>
    </Layout>,
  );
});
