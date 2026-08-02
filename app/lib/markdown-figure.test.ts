import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

const countFigures = (html: string): number => (html.match(/<figure/gu) ?? []).length;

describe("markdown rendering", () => {
  describe("images taped straight onto the paper", () => {
    it("should render a figure without figcaption when alt is empty (0)", async () => {
      const { html } = await renderMarkdown("![](lobby.jpg)");
      expect(html).toContain('<span class="photo-body">');
      expect(html).not.toContain("<figcaption>");
      expect(countFigures(html)).toBe(1);
    });

    it("should render a figure with figcaption from alt text (1)", async () => {
      const { html } = await renderMarkdown("![受付前のロビー](lobby.jpg)");
      expect(html).toContain("<figcaption>受付前のロビー</figcaption>");
      expect(countFigures(html)).toBe(1);
      // Figure は段落の中に置けないので <p> で包まない
      expect(html).not.toContain("<p>");
    });

    it("should render one figure per image (N)", async () => {
      const { html } = await renderMarkdown(
        "![一枚目](a.jpg)\n\n![二枚目](b.jpg)\n\n![三枚目](c.jpg)",
      );
      expect(countFigures(html)).toBe(3);
      expect(html).toContain("<figcaption>三枚目</figcaption>");
    });

    it("should tape each photo down and tilt it", async () => {
      const { html } = await renderMarkdown("![一枚目](a.jpg)\n\n![二枚目](b.jpg)");
      // 白フチの台紙には貼らない
      expect(html).not.toContain("photo-frame");
      expect(html).toContain('<span class="tape"');
      // 貼り方と傾きは1枚ずつ変える。全部同じだと機械が貼ったように見える
      const tilts = [...html.matchAll(/--tilt:(-?[\d.]+deg)/gu)].map((match) => match[1]);
      expect(tilts).toHaveLength(2);
      expect(tilts[0]).not.toBe(tilts[1]);
    });

    it("should keep the src as written and add the lazy loading hooks", async () => {
      const { html } = await renderMarkdown("![ロビー](img/lobby.jpg)");
      expect(html).toContain(
        '<img src="img/lobby.jpg" alt="ロビー" loading="lazy" decoding="async" data-lightbox>',
      );
    });

    it("should overlay grain on photos", async () => {
      const { html } = await renderMarkdown("![ロビー](lobby.jpg)");
      expect(html).toContain('<svg class="photo-grain" aria-hidden="true">');
      expect(html).toContain('filter="url(#grain)"');
      // 繊維とインク溜まりは白フチの台紙あってのものなので、直貼りでは出さない
      expect(html).not.toContain("photo-fiber");
      expect(html).not.toContain("photo-well");
    });

    it("should mark images titled plain as diagrams", async () => {
      const { html } = await renderMarkdown('![構成図](diagram.png "plain")');
      expect(html).toContain('<figure class="plain">');
      expect(html).toContain("<figcaption>構成図</figcaption>");
      expect(html).not.toContain('title="plain"');

      const bare = await renderMarkdown('![](diagram.png "plain")');
      expect(bare.html).toContain('<figure class="plain">');
      expect(bare.html).not.toContain("<figcaption>");

      // Plain 以外のタイトルはそのまま title 属性に残す
      const titled = await renderMarkdown('![ロビー](lobby.jpg "会場入口")');
      expect(titled.html).toContain('title="会場入口"');
      expect(titled.html).toContain("<figure><span");
    });

    it("should escape the alt text", async () => {
      const { html } = await renderMarkdown('![a "b" <c>](lobby.jpg)');
      expect(html).toContain("<figcaption>a &quot;b&quot; &lt;c&gt;</figcaption>");
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
