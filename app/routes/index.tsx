import type { FC } from "hono/jsx";
import { createRoute } from "honox/factory";
import { Layout } from "../components/layout";
import { ExternalArrow } from "../components/hand-arrows";
import { Signature } from "../components/paper";
import { ELSEWHERE_LINKS, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../lib/config";

/*
 * トップは自己紹介。見出し欄の「自己紹介」とヘッダーのロゴがどちらも "/" を指すので、
 * /about は別に作らずこの1枚に寄せる。
 *
 * 本文はまだ書けていない。デザイン案の文言をそのまま置くと、
 * 書いていないことが書いてあるように読めるので置かない
 */

/*
 * 補足の枠。このページ唯一の囲み。
 * 共通の HandBox は viewBox 100x32 なので、横長に引き伸ばすと角の形が崩れる。
 * 「横長の手書き枠は横長の viewBox で」に従って専用の path を使う
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
              r-aizawa
            </h1>

            <p class="text-ink-soft" style="rotate: -0.4deg">
              考え中...
            </p>

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
