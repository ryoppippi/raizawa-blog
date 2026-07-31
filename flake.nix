{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs =
    {
      nixpkgs,
      systems,
      treefmt-nix,
      ...
    }:
    let
      forAllSystems = f: nixpkgs.lib.genAttrs (import systems) (system: f system);

      pkgsFor = forAllSystems (
        system:
        import nixpkgs {
          inherit system;
          overlays = [ (import ./nix/textlint-jtf-style.nix) ];
        }
      );

      # 記事のtextlint設定。devShellが.textlintrcへ貼る。
      # 文章の言い回しは書くときの目安で、CIの検査には入れていない
      textlintrcFor = forAllSystems (
        system:
        let
          pkgs = pkgsFor.${system};
        in
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
        }
      );

      # 検査に使う道具立て。devShellとCIの両方がこれ一つを読む。
      # 一覧をワークフロー側にも書くと、片方だけ足して片方で落ちる
      toolchainFor = forAllSystems (
        system:
        let
          pkgs = pkgsFor.${system};
        in
        pkgs.buildEnv {
          name = "raizawa-blog-toolchain";
          paths = with pkgs; [
            bun
            oxlint
            oxfmt
            typescript-go
            nodejs-slim_24
            typos
            mdsf
            rustfmt
            shfmt
            (textlint.withPackages [
              textlint-rule-preset-ja-technical-writing
              textlint-rule-prh
              textlint-rule-write-good
              textlint-rule-preset-jtf-style
              "@textlint/markdown"
            ])
          ];
        }
      );

      treefmtEval = forAllSystems (
        system:
        treefmt-nix.lib.evalModule nixpkgs.legacyPackages.${system} (
          { pkgs, lib, ... }:
          {
            projectRootFile = "flake.nix";
            settings.global.excludes = [
              "node_modules/**"
              "dist/**"
              ".honox/**"
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
        )
      );
    in
    {
      formatter = forAllSystems (system: treefmtEval.${system}.config.build.wrapper);

      packages = forAllSystems (system: {
        toolchain = toolchainFor.${system};
      });

      devShells = forAllSystems (system: {
        default = pkgsFor.${system}.mkShell {
          packages = [ toolchainFor.${system} ];

          shellHook = ''
            [ -f .textlintrc ] && unlink .textlintrc
            ln -s ${textlintrcFor.${system}} .textlintrc
          '';
        };
      });
    };
}
