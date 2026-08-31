# raizawa-blog

https://r-aizawa.com

外部 JS を配らない静的ブログ。何をどう決めてきたかは
[docs/direction.md](docs/direction.md) に書いてある。

## Tech Stack

- [HonoX](https://github.com/honojs/honox) - Full-stack framework
- [Hono](https://hono.dev/) - Web framework
- [Cloudflare Workers](https://workers.cloudflare.com/) - Runtime
- [Vite](https://vite.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [DaisyUI](https://daisyui.com/) - Component library
- [Bun](https://bun.sh/) - Package manager & runtime
- [Vitest](https://vitest.dev/) - Test framework
- [OxLint](https://oxc.rs/docs/guide/usage/linter) - Linter
- [Shiki](https://shiki.style/) - Syntax highlighting
- [Nix](https://nixos.org/) - Development environment

## Setup

```bash
bun install
```

## Development

```bash
bun run dev
```

## Build

```bash
bun run build
```

## Verify

CI と同じ検査をまとめて走らせる。

```bash
bun run verify
```

内訳:

| コマンド               | 見るもの                               |
| ---------------------- | -------------------------------------- |
| `bun run format:check` | treefmt (nixfmt / oxfmt / mdsf)        |
| `bun run lint`         | oxlint (全カテゴリ error + 型情報付き) |
| `bun run typecheck`    | tsgo --noEmit                          |
| `bun run knip`         | 使われていない export・ファイル・依存  |
| `bun run test`         | vitest                                 |

記事の文章は CI では見ない。textlint と typos は devShell に入れてあるので、
エディタ（nvim の LSP、textlint の MCP サーバ）から書きながら見る。

## Format

```bash
nix fmt
```
