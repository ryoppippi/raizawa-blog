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
