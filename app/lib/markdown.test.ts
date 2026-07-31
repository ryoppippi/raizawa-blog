import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

const EXPECTED_LINE_COUNT = 3;

const countFigures = (html: string): number => (html.match(/<figure/gu) ?? []).length;

describe("markdown rendering", () => {
  describe("code blocks", () => {
    it("should render supported language with syntax highlighting", async () => {
      const markdown = "```rust\nfn main() {}\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain('class="shiki');
      expect(html).toContain("copy-button");
    });

    it("should fallback to text for unsupported language", async () => {
      const markdown = "```unknownlang\nsome code\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain('class="shiki');
      expect(html).toContain("some code");
    });

    it("should handle code block without language", async () => {
      const markdown = "```\nplain code\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain('class="shiki');
      expect(html).toContain("plain code");
    });

    it("should parse title from meta string", async () => {
      const markdown = '```rust title="main.rs"\nfn main() {}\n```';
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain('class="code-head"');
      expect(html).toContain("main.rs");
    });
  });

  describe("code block boundary cases (0-1-N)", () => {
    it("should handle empty code block (0)", async () => {
      const markdown = "```rust\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain('class="shiki');
    });

    it("should handle single line code (1)", async () => {
      const markdown = "```rust\nlet x = 1;\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain('class="shiki');
      // Shiki tokenizes code, so check for key parts
      expect(html).toContain("let");
      expect(html).toContain("x");
    });

    it("should handle multiple lines code (N)", async () => {
      const markdown = "```rust\nlet x = 1;\nlet y = 2;\nlet z = 3;\n```";
      const { html } = await renderMarkdown(markdown);
      // Each line creates a span.line element
      const lineCount = (html.match(/class="line"/g) ?? []).length;
      expect(lineCount).toBeGreaterThanOrEqual(EXPECTED_LINE_COUNT);
    });
  });

  describe("shiki transformers", () => {
    it("should render diff add notation", async () => {
      const markdown = "```rust\nlet x = 1; // [!code ++]\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain("diff add");
    });

    it("should render diff remove notation", async () => {
      const markdown = "```rust\nlet x = 1; // [!code --]\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain("diff remove");
    });

    it("should render highlight notation", async () => {
      const markdown = "```rust\nlet x = 1; // [!code highlight]\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain("highlighted");
    });

    it("should render error level notation", async () => {
      const markdown = "```rust\nlet x = 1; // [!code error]\n```";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain("error");
    });
  });

  describe("basic markdown", () => {
    it("should render headings", async () => {
      const markdown = "# Heading 1\n## Heading 2";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain("<h1 ");
      expect(html).toContain("<h2 ");
    });

    it("should render lists", async () => {
      const markdown = "- item 1\n- item 2";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>");
    });

    it("should render inline code without shiki", async () => {
      const markdown = "Use `const` for constants.";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain("<code>");
      expect(html).not.toContain('class="shiki');
    });

    it("should handle markdown without any code blocks", async () => {
      const markdown = "# Title\n\nJust some text.";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain("<h1 ");
      expect(html).toContain("Just some text.");
      expect(html).not.toContain('class="shiki');
    });
  });

  describe("heading id attributes", () => {
    it("should add id attribute to headings", async () => {
      const markdown = "## Hello World";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain('id="hello-world"');
    });
  });

  describe("TOC generation (0-1-N)", () => {
    it("should return empty toc for no headings (0)", async () => {
      const markdown = "Just some text.";
      const { toc } = await renderMarkdown(markdown);
      expect(toc).toEqual([]);
    });

    it("should return single item toc for one heading (1)", async () => {
      const markdown = "## Section One";
      const { toc } = await renderMarkdown(markdown);
      expect(toc).toEqual([{ id: "section-one", level: 2, text: "Section One" }]);
    });

    it("should return multiple items for multiple headings (N)", async () => {
      const markdown = "## First\n### Second\n## Third";
      const { toc } = await renderMarkdown(markdown);
      expect(toc).toEqual([
        { id: "first", level: 2, text: "First" },
        { id: "second", level: 3, text: "Second" },
        { id: "third", level: 2, text: "Third" },
      ]);
    });

    it("should handle h4 headings", async () => {
      const markdown = "## Top\n### Mid\n#### Deep";
      const { toc } = await renderMarkdown(markdown);
      expect(toc).toHaveLength(3);
      expect(toc[2]).toEqual({ id: "deep", level: 4, text: "Deep" });
    });

    it("should generate unique slugs for duplicate headings", async () => {
      const markdown = "## Setup\n## Setup\n## Setup";
      const { toc } = await renderMarkdown(markdown);
      const ids = toc.map((item) => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(toc.length);
    });

    it("should generate slugs for Japanese headings", async () => {
      const markdown = "## はじめに\n## まとめ";
      const { toc } = await renderMarkdown(markdown);
      expect(toc).toHaveLength(2);
      expect(toc[0]?.id).not.toBe("");
      expect(toc[1]?.id).not.toBe("");
      expect(toc[0]?.text).toBe("はじめに");
      expect(toc[1]?.text).toBe("まとめ");
    });

    it("should not include headings inside code blocks", async () => {
      const markdown = "## Real Heading\n```\n## Not A Heading\n```";
      const { toc } = await renderMarkdown(markdown);
      expect(toc).toHaveLength(1);
      expect(toc[0]?.text).toBe("Real Heading");
    });

    it("should include h1 headings in toc data", async () => {
      const markdown = "# Title\n## Section";
      const { toc } = await renderMarkdown(markdown);
      expect(toc).toHaveLength(2);
      expect(toc[0]).toEqual({ id: "title", level: 1, text: "Title" });
    });

    it("should not leak toc items between consecutive renders", async () => {
      const first = await renderMarkdown("## Alpha\n## Beta");
      expect(first.toc).toHaveLength(2);

      const second = await renderMarkdown("## Gamma");
      expect(second.toc).toHaveLength(1);
      expect(second.toc[0]?.text).toBe("Gamma");
    });
  });

  describe("images as white-framed figures", () => {
    it("should render a figure without figcaption when alt is empty (0)", async () => {
      const { html } = await renderMarkdown("![](lobby.jpg)");
      expect(html).toContain('<figure><div class="photo-frame pb-[10px]">');
      expect(html).not.toContain("<figcaption>");
      expect(countFigures(html)).toBe(1);
    });

    it("should render a figure with figcaption from alt text (1)", async () => {
      const { html } = await renderMarkdown("![受付前のロビー](lobby.jpg)");
      expect(html).toContain('<figure><div class="photo-frame">');
      expect(html).toContain("<figcaption><span>受付前のロビー</span></figcaption>");
      expect(countFigures(html)).toBe(1);
      // Figure は段落の中に置けないので <p> で包まない
      expect(html).not.toContain("<p>");
    });

    it("should render one figure per image (N)", async () => {
      const { html } = await renderMarkdown(
        "![一枚目](a.jpg)\n\n![二枚目](b.jpg)\n\n![三枚目](c.jpg)",
      );
      expect(countFigures(html)).toBe(3);
      expect(html).toContain("<span>三枚目</span>");
    });

    it("should keep the src as written and add the lazy loading hooks", async () => {
      const { html } = await renderMarkdown("![ロビー](img/lobby.jpg)");
      expect(html).toContain(
        '<img src="img/lobby.jpg" alt="ロビー" loading="lazy" decoding="async" data-lightbox>',
      );
    });

    it("should overlay grain, fiber and ink well on photos", async () => {
      const { html } = await renderMarkdown("![ロビー](lobby.jpg)");
      expect(html).toContain('<svg class="photo-grain" aria-hidden="true">');
      expect(html).toContain('<svg class="photo-fiber" aria-hidden="true">');
      expect(html).toContain('<div class="photo-well" aria-hidden="true"></div>');
      expect(html).toContain('filter="url(#grain)"');
    });

    it("should mark images titled plain as diagrams", async () => {
      const { html } = await renderMarkdown('![構成図](diagram.png "plain")');
      expect(html).toContain('<figure class="plain"><div class="photo-frame">');
      expect(html).toContain("<figcaption><span>構成図</span></figcaption>");
      expect(html).not.toContain('title="plain"');

      const bare = await renderMarkdown('![](diagram.png "plain")');
      expect(bare.html).toContain('<figure class="plain"><div class="photo-frame pb-[10px]">');

      // Plain 以外のタイトルはそのまま title 属性に残す
      const titled = await renderMarkdown('![ロビー](lobby.jpg "会場入口")');
      expect(titled.html).toContain('title="会場入口"');
      expect(titled.html).toContain('<figure><div class="photo-frame">');
    });

    it("should escape the alt text", async () => {
      const { html } = await renderMarkdown('![a "b" <c>](lobby.jpg)');
      expect(html).toContain("<span>a &quot;b&quot; &lt;c&gt;</span>");
      expect(html).toContain('alt="a &quot;b&quot; &lt;c&gt;"');
    });

    it("should keep an image inside a sentence inline", async () => {
      const { html } = await renderMarkdown("文中の ![アイコン](icon.png) は行の中に置く。");
      expect(html).toContain("<p>");
      expect(countFigures(html)).toBe(0);
      expect(html).toContain('<img src="icon.png" alt="アイコン" loading="lazy" decoding="async">');
    });
  });

  describe("::: note", () => {
    it("should render a note as an aside with a hand-drawn frame", async () => {
      const { html } = await renderMarkdown("::: note\n補足の一行。\n:::");
      expect(html).toContain('<aside class="note"><svg viewBox="0 0 640 90"');
      expect(html).toContain("</aside>");
      expect(html).toContain("<p>補足の一行。</p>");
    });

    it("should render markdown inside a note", async () => {
      const markdown = "::: note\n[リンク](https://example.com) と `code`。\n\n2つめの段落。\n:::";
      const { html } = await renderMarkdown(markdown);
      expect(html).toContain('<a href="https://example.com">リンク</a>');
      expect(html).toContain("<code>code</code>");
      expect(html).toContain("<p>2つめの段落。</p>");
    });

    it("should close an unterminated note at the end of the document", async () => {
      const { html } = await renderMarkdown("::: note\n閉じ忘れた補足。");
      expect(html).toContain('<aside class="note">');
      expect(html).toContain("</aside>");
    });

    it("should only convert ::: note", async () => {
      const other = await renderMarkdown("::: warning\nこれは note ではない。\n:::");
      expect(other.html).not.toContain("<aside");

      const fenced = await renderMarkdown("```text\n::: note\n:::\n```");
      expect(fenced.html).not.toContain("<aside");
    });
  });
});
