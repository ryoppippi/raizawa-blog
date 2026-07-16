import { createRoute } from "honox/factory";
import { Layout } from "../components/layout";
import { SITE_TITLE, SITE_URL } from "../lib/config";

// Pagefind Component UI assets are generated into /pagefind/ by the post-build
// `pagefind --site dist` step, so they exist in production but not in `vite dev`.
const searchBox = `
<link href="/pagefind/pagefind-component-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-component-ui.js" type="module"></script>
<pagefind-searchbox></pagefind-searchbox>
<pagefind-summary></pagefind-summary>
<pagefind-results></pagefind-results>
`;

export default createRoute((c) =>
  c.render(
    <Layout
      title={`検索 - ${SITE_TITLE}`}
      description={`${SITE_TITLE}の記事を全文検索`}
      ogUrl={`${SITE_URL}/search`}
    >
      <header class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body p-6">
          <h1 class="text-2xl sm:text-3xl font-bold">検索</h1>
        </div>
      </header>
      <main class="card bg-base-100 shadow-sm">
        <div class="card-body p-6" dangerouslySetInnerHTML={{ __html: searchBox }}></div>
      </main>
    </Layout>,
  ),
);
