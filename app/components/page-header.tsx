import type { FC } from "hono/jsx";

const PageHeader: FC<{ title: string }> = ({ title }) => (
  <header class="card bg-base-100 shadow-sm mb-6">
    <div class="card-body p-6">
      <h1 class="text-2xl sm:text-3xl font-bold">{title}</h1>
    </div>
  </header>
);

export { PageHeader };
