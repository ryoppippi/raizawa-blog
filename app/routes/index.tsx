import { createRoute } from "honox/factory";
import { Layout } from "../components/layout";
import { HandBox, HandHighlight, Signature } from "../components/paper";
import { GITHUB_URL, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, ZENN_URL } from "../lib/config";

/*
 * トップはプロフィール。ヘッダーのロゴとドッグイヤーの about が "/" を指しているので、
 * /about は別に作らず、この1枚に寄せる。
 */

/** 左カラム。デザインの自分の写真はまだ無いので elsewhere だけを置く */
const LINKS: { href: string; label: string }[] = [
  { href: GITHUB_URL, label: "github" },
  { href: ZENN_URL, label: "zenn" },
];

const FAVORITES: string[] = [
  "ストリートファイター、鉄拳、EVO",
  "尾崎紀世彦、クリスタルキング、遠藤正明",
  "古着、ラルフローレン、コロンビア",
  "ショーシャンクの空に、グレイテストショーマン",
  "クウガ、アギト、龍騎、ファイズ",
  "カウボーイビバップ、遊戯王、WWE",
];

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
      title={SITE_TITLE}
      description={SITE_DESCRIPTION}
      jsonLd={jsonLd}
      nav="about"
      ogUrl={SITE_URL}
    >
      <main class="sheet grid gap-11 pt-8 pb-[46px] lg:grid-cols-[296px_1fr] lg:pt-[34px]">
        {/* 狭い画面では自己紹介を先に読ませたいので、左カラムを後ろへ回す */}
        <div class="order-2 flex flex-col gap-[11px] lg:order-1">
          <h2 class="label">elsewhere</h2>
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              class="flex justify-between text-[14px] text-ink-strong"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
              <span class="font-label text-crimson">↗</span>
            </a>
          ))}
        </div>

        <div class="order-1 min-w-0 lg:order-2">
          <p class="label mb-[10px] tracking-[0.1em]">about</p>
          <h1
            class="mb-[22px] text-h1-sm leading-[1.5] font-semibold text-ink-strong lg:text-[33px]"
            style="filter: url(#ink)"
          >
            相沢と申します
          </h1>

          <p class="mb-5">
            エンジニアです。いまは <HandHighlight>Rust</HandHighlight>{" "}
            を細かく勉強しながら、このブログを書いています。エンジニアになる前は声優をやったり格闘ゲームに10年費やしたりしていました。
          </p>
          <p class="mb-[26px]">
            向き不向きの話が好きです。無駄な努力は報われないと格ゲーで痛感し、それでも長く続けると伸びると体感しました。だいたいその話をここに書いています。
          </p>

          <h2 class="mb-4 flex items-center gap-3 text-h2 font-semibold tracking-[0.03em] text-ink-strong">
            <span class="inline-block h-[3px] w-5 shrink-0 bg-crimson" aria-hidden="true" />
            好きなもの
          </h2>
          <div class="mb-7 grid gap-y-2 text-body-sm leading-[2.05] sm:grid-cols-2 sm:gap-x-[26px]">
            {FAVORITES.map((favorite) => (
              <div key={favorite}>{favorite}</div>
            ))}
          </div>

          {/* 四角枠を許した4か所のひとつが note。枠は深緑で、黄土やエンジには塗らない */}
          <HandBox class="mb-[26px] block w-full px-[22px] py-[18px]">
            <span class="block font-jp text-body-sm leading-[2.05] tracking-normal text-ink-body">
              <span class="mb-[7px] block font-label text-meta-lg tracking-[0.14em] text-green">
                note
              </span>
              このブログは HonoX と Cloudflare Workers で動いています。検索は Pagefind。作った話は{" "}
              <a href="/posts/2024/12/rough-blog-creation" class="text-crimson">
                くっそ雑にブログを作った
              </a>{" "}
              に書きました。
            </span>
          </HandBox>

          <div class="flex justify-end">
            <Signature class="text-[32px]" />
          </div>
        </div>
      </main>
    </Layout>,
  );
});
