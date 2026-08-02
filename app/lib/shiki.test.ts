import { describe, expect, it } from "vitest";
import { SHIKI_THEME, getHighlighter, shikiTransformers } from "./shiki";

const highlight = async (
  code: string,
  options: { lang?: string; meta?: string } = {},
): Promise<string> => {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang: options.lang ?? "rust",
    meta: { __raw: options.meta ?? "" },
    theme: SHIKI_THEME,
    transformers: shikiTransformers,
  });
};

// 紙に載せてよいインクだけ。ここに無い色が出たらテーマから色が漏れている
const PAPER_INK_COLORS = ["#2b2721", "#1f3d2b", "#8c1c2b", "#8a8272", "#4d5a49", "#6f6656"];

describe("shiki", () => {
  describe("getHighlighter", () => {
    it("should return a highlighter instance", async () => {
      const highlighter = await getHighlighter();
      expect(highlighter).toBeDefined();
      expect(highlighter.codeToHtml).toBeDefined();
    });

    it("should cache the highlighter instance", async () => {
      const first = await getHighlighter();
      const second = await getHighlighter();
      expect(first).toBe(second);
    });

    it("should have loaded languages", async () => {
      const highlighter = await getHighlighter();
      const langs = highlighter.getLoadedLanguages();
      expect(langs).toContain("rust");
      expect(langs).toContain("nix");
      expect(langs).toContain("bash");
      expect(langs).toContain("json");
    });

    it("should load only the paper theme", async () => {
      const highlighter = await getHighlighter();
      expect(highlighter.getLoadedThemes()).toStrictEqual([SHIKI_THEME]);
    });
  });

  describe("paper theme", () => {
    // Shiki はトークンの色を大文字で書き出すので、色の比較は小文字に揃えてから行う
    it("should paint keywords in deep green", async () => {
      const html = await highlight("fn main() {}");
      expect(html.toLowerCase()).toContain("#1f3d2b");
    });

    it("should paint strings in crimson", async () => {
      const html = await highlight('let s = "hello";');
      expect(html.toLowerCase()).toContain("#8c1c2b");
    });

    it("should paint comments in faded ink with italic", async () => {
      const html = await highlight("// note");
      expect(html.toLowerCase()).toContain("#8a8272");
      expect(html).toContain("font-style:italic");
    });

    it("should not leak colors outside the paper palette", async () => {
      const html = await highlight(
        [
          "// 注釈",
          "use std::fmt;",
          "pub fn main() -> Result<(), String> {",
          '    let n = 42; let s = "hello";',
          '    println!("{n} {s}");',
          "    Ok(())",
          "}",
        ].join("\n"),
      );
      const colors = [...html.toLowerCase().matchAll(/#[0-9a-f]{3,8}/gu)].map(([hex]) => hex);
      expect(colors.length).toBeGreaterThan(PAPER_INK_COLORS.length);
      for (const color of colors) {
        expect(PAPER_INK_COLORS).toContain(color);
      }
    });

    it("should not paint a dark background on the pre element", async () => {
      const html = await highlight("fn main() {}");
      expect(html).not.toContain("background-color:#");
    });
  });

  describe("transformers", () => {
    it("should wrap the code in a head + pre paper sheet", async () => {
      const html = await highlight("fn main() {}");
      expect(html).toMatch(
        /^<div class="code-block-wrapper"><div class="code-head"><span>rust<\/span><button class="copy-button">copy<\/button><\/div><pre/u,
      );
      expect(html).toMatch(/<\/pre><\/div>$/u);
    });

    it("should show the title from meta as the head label", async () => {
      const html = await highlight("fn main() {}", {
        meta: 'title="example.rs"',
      });
      expect(html).toContain("<span>example.rs</span>");
      expect(html).not.toContain("<span>rust</span>");
    });

    it("should handle single quotes in title", async () => {
      const html = await highlight("{}", {
        lang: "json",
        meta: "title='config.json'",
      });
      expect(html).toContain("<span>config.json</span>");
    });

    it("should leave the head label empty for plain text", async () => {
      const html = await highlight("plain", { lang: "text" });
      expect(html).toContain('<div class="code-head"><span></span>');
    });

    it("should no longer emit the old code-title element", async () => {
      const html = await highlight("fn main() {}", {
        meta: 'title="example.rs"',
      });
      expect(html).not.toContain("code-title");
    });

    it("should keep diff notation", async () => {
      const html = await highlight("let a = 1; // [!code ++]");
      expect(html).toContain("diff add");
      expect(html).not.toContain("[!code ++]");
    });

    it("should keep highlight notation", async () => {
      const html = await highlight("let a = 1; // [!code highlight]");
      expect(html).toContain("highlighted");
    });

    it("should keep error level notation", async () => {
      const html = await highlight("let a = 1; // [!code error]");
      expect(html).toContain("error");
    });
  });
});
