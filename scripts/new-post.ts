import { createPost, getTemplateName, getTemplates, printResult } from "./post-utils";
import type { Interface } from "node:readline/promises";
import { createInterface } from "node:readline/promises";
import { execSync } from "node:child_process";

const RADIX = 10;
const PAD_WIDTH = 2;
// 先頭2つは実行系(process.argvの実行ファイルとスクリプト)で、利用者の入力ではない
const USER_ARGV_START = 2;

interface PostRequest {
  templateName: string;
  title: string;
  slug: string;
}

const pad = (value: number): string => value.toString().padStart(PAD_WIDTH, "0");

const displayTemplates = (templates: string[]): void => {
  console.log("\nAvailable templates:");
  for (const [index, template] of templates.entries()) {
    console.log(`  ${index + 1}. ${getTemplateName(template)}`);
  }
};

const selectTemplate = async (rl: Interface, templates: string[]): Promise<string> => {
  const selection = await rl.question("\nSelect template (number): ");
  const index = Number.parseInt(selection.trim(), RADIX) - 1;
  // 範囲外・数値でない入力はどちらもundefinedになる。添字の結果だけを見れば足りる
  const selected = templates[index];
  if (selected === undefined) {
    throw new Error("Invalid selection");
  }
  return selected;
};

const askTitle = async (rl: Interface, templateFile: string): Promise<string> => {
  const defaultTitle = `${getTemplateName(templateFile)}の記事`;
  const answer = await rl.question(`Title [${defaultTitle}]: `);
  const input = answer.trim();
  if (input.length === 0) {
    return defaultTitle;
  }
  return input;
};

const generateDefaultSlug = (): string => {
  const now = new Date();
  return `draft-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const askSlug = async (rl: Interface): Promise<string> => {
  const defaultSlug = generateDefaultSlug();
  const answer = await rl.question(`Slug [${defaultSlug}]: `);
  const input = answer.trim();
  if (input.length === 0) {
    return defaultSlug;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input)) {
    throw new Error("Slug must contain only lowercase alphanumeric characters and hyphens");
  }
  return input;
};

const askPostRequest = async (templates: string[]): Promise<PostRequest> => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    displayTemplates(templates);
    const templateFile = await selectTemplate(rl, templates);
    const title = await askTitle(rl, templateFile);
    const slug = await askSlug(rl);
    return { slug, templateName: getTemplateName(templateFile), title };
  } finally {
    // エディタを起動する前に標準入力を手放す。開いたままだと端末を取り合う
    rl.close();
  }
};

const exitWithUsage = (): never => {
  console.error("Usage: bun run new-post -- <template> <slug> <title>");
  console.error('Example: bun run new-post -- rust rust-study-unsafe-3 "Rustの勉強[unsafe その3]"');
  process.exit(1);
};

const parseArgs = (argv: string[], templates: string[]): PostRequest => {
  const [templateName, slug, ...titleParts] = argv;
  if (templateName === undefined || slug === undefined || titleParts.length === 0) {
    return exitWithUsage();
  }

  if (!templates.includes(`${templateName}.md`)) {
    const validNames = templates.map((template) => getTemplateName(template)).join(", ");
    console.error(`Error: Unknown template "${templateName}"`);
    console.error(`Valid templates: ${validNames}`);
    process.exit(1);
  }

  return { slug, templateName, title: titleParts.join(" ") };
};

const openInEditor = (filePath: string): void => {
  const editor = process.env["EDITOR"] ?? "vi";
  console.log(`\nOpening with ${editor}...`);
  execSync(`${editor} "${filePath}"`, { stdio: "inherit" });
};

// 引数が無ければ対話で聞き、あれば引数から読む。どちらも同じPostRequestになる
const resolveRequest = async (argv: string[], templates: string[]): Promise<PostRequest> => {
  if (argv.length === 0) {
    return await askPostRequest(templates);
  }
  return parseArgs(argv, templates);
};

const main = async (): Promise<void> => {
  const templates = getTemplates();
  if (templates.length === 0) {
    throw new Error("No templates found. Create a *.md file in scripts/templates/");
  }

  const argv = process.argv.slice(USER_ARGV_START);
  const interactive = argv.length === 0;
  const request = await resolveRequest(argv, templates);

  const outputPath = createPost(`${request.templateName}.md`, request.title, request.slug);
  printResult(outputPath, request.title);

  // 対話で作ったときだけそのまま書き始められるようにする。
  // 引数指定はスクリプトから呼ばれる想定で、エディタが開くと止まってしまう
  if (interactive) {
    openInEditor(outputPath);
  }
};

await main();
