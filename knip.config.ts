import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // HonoXはapp/routes配下のファイル配置がそのままURLになる。
  // どこからもimportされないが、これらが入口
  // app/style.cssはLayoutが<Link>で読み込む。TailwindとdaisyUIの参照は
  // このCSSの@import/@pluginにしかないので、CSSも辿らせる
  entry: ["app/routes/**/*.{ts,tsx}", "app/server.ts", "app/**/*.d.ts", "app/style.css"],
  project: ["app/**/*.{ts,tsx,css}", "scripts/**/*.ts", "test/**/*.ts", "*.ts"],
  // これらはpackage.jsonではなくflake.nixのtoolchainが用意する
  ignoreBinaries: ["oxlint", "nix", "textlint", "typos", "tsgo"],
};

export default config;
