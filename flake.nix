{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    # agent-browser は手元の道具だが、これが入った時期の nixpkgs は oxlint 1.75 を持つ。
    # その oxlint は同梱の tsgolint と噛み合わず、`--type-aware` で
    # `panic: unknown rule: ...` を出して検査ごと落ちる(1.42 では 0 errors で通る)。
    # 検査の道具立てを巻き添えにしたくないので、agent-browser だけ別の pin から採る
    nixpkgs-agent-browser.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs =
    {
      nixpkgs,
      nixpkgs-agent-browser,
      systems,
      treefmt-nix,
      ...
    }:
    let
      # 各出力をシステムごとに展開する。pkgsの構築はここ1か所だけ。
      # 出力ごとにimportし直すと、overlayの付け忘れが1つずつ生まれる
      eachSystem =
        f:
        nixpkgs.lib.genAttrs (import systems) (
          system:
          f (
            import nixpkgs {
              inherit system;
              overlays = [
                (import ./nix/textlint-jtf-style.nix)
                (_final: _prev: {
                  inherit (nixpkgs-agent-browser.legacyPackages.${system}) agent-browser;
                })
              ];
            }
          )
        );

      # 検査に使う道具立て。devShellとCIの両方がこれ一つを読む。
      # 一覧をワークフロー側にも書くと、片方だけ足して片方で落ちる
      toolchain =
        pkgs:
        pkgs.buildEnv {
          name = "raizawa-blog-toolchain";
          paths = with pkgs; [
            bun
            oxlint
            oxfmt
            typescript-go
            nodejs-slim_24
            mdsf
            rustfmt
            shfmt
          ];
        };

      # 手元でだけ使う道具。記事を書くtextlint/typosはエディタ(nvimのLSP、
      # textlintのMCPサーバ)から、agent-browserはエージェントから呼ぶ。
      # CIは`.#toolchain`しか入れないので、ここへ分けた分は閉包から落ちる
      devTools =
        pkgs: with pkgs; [
          agent-browser
          typos
          (textlint.withPackages [
            textlint-rule-preset-ja-technical-writing
            textlint-rule-prh
            textlint-rule-write-good
            textlint-rule-preset-jtf-style
            "@textlint/markdown"
          ])
        ];

      # 記事のtextlint設定。devShellが.textlintrcへ貼る。
      # 文章の言い回しは書くときの目安で、CIの検査には入れていない
      textlintrc =
        pkgs:
        (pkgs.formats.json { }).generate "textlintrc" {
          plugins = {
            "@textlint/markdown" = true;
          };
          rules = {
            preset-jtf-style = true;
            preset-ja-technical-writing = {
              ja-no-mixed-period = false;
              no-exclamation-question-mark = false;
            };
            write-good = true;
            prh.rulePaths = [
              "${pkgs.textlint-rule-prh}/lib/node_modules/textlint-rule-prh/node_modules/prh/prh-rules/media/techbooster.yml"
              "${pkgs.textlint-rule-prh}/lib/node_modules/textlint-rule-prh/node_modules/prh/prh-rules/media/WEB+DB_PRESS.yml"
            ];
          };
        };

      # mdsfはコードブロックを各言語のフォーマッタへ渡すので、
      # rustfmtとshfmtがPATHに居ないと黙って素通りする
      treefmt =
        pkgs:
        treefmt-nix.lib.evalModule pkgs (
          { lib, ... }:
          {
            projectRootFile = "flake.nix";
            settings.global.excludes = [
              "node_modules/**"
              "dist/**"
              ".honox/**"
              # デザインの受け渡し資料。中身は x-dc の独自要素で標準HTMLとして閉じておらず、
              # 整形器にかけると構文エラーで落ちる。製品コードではないので触らせない
              "design_handoff_paper_blog/**"
              "design_handoff_looseleaf/**"
            ];
            programs.nixfmt.enable = true;
            programs.oxfmt.enable = true;
            settings.formatter.mdsf = {
              command = "${pkgs.bash}/bin/bash";
              options = [
                "-euc"
                ''
                  export PATH=${pkgs.rustfmt}/bin:${pkgs.shfmt}/bin:$PATH
                  ${lib.getExe pkgs.mdsf} format "$@"
                ''
                "--"
              ];
              includes = [ "*.md" ];
            };
          }
        );
    in
    {
      formatter = eachSystem (pkgs: (treefmt pkgs).config.build.wrapper);

      packages = eachSystem (pkgs: {
        toolchain = toolchain pkgs;
      });

      devShells = eachSystem (pkgs: {
        default = pkgs.mkShell {
          packages = [ (toolchain pkgs) ] ++ devTools pkgs;

          shellHook = ''
            [ -f .textlintrc ] && unlink .textlintrc
            ln -s ${textlintrc pkgs} .textlintrc
          '';
        };
      });
    };
}
