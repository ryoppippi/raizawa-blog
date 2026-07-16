import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import type { Plugin } from "vite";

const VIRTUAL_MODULE_ID = "virtual:git-timestamps";
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;
const FRONTMATTER_CLOSE = "\n---\n";
// Field separator that cannot appear in commit hashes or ISO dates
const COMMIT_SEPARATOR = "\u0001";
// Byte value of "\n"
const NEWLINE_BYTE = 10;
// 256 MiB: enough for the full blob history of the posts directory
const MAX_GIT_BUFFER = 268_435_456;

interface CommitEntry {
  date: string;
  hash: string;
}

const getRepoRoot = (): string => {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error(
      "Failed to find git repository root. Ensure git is installed and the project is a git repository.",
    );
  }
};

const stripFrontmatter = (content: string): string => {
  const endIndex = content.indexOf(FRONTMATTER_CLOSE, 1);
  if (endIndex === -1) {
    return content;
  }
  return content.slice(endIndex + FRONTMATTER_CLOSE.length);
};

interface CommitBlock {
  entry: CommitEntry;
  paths: string[];
}

// Parse one `git log --format=%x01%H %aI --name-only` block: "<hash> <date>\n\n<path>\n..."
const parseCommitBlock = (block: string): CommitBlock | undefined => {
  const lines = block.split("\n").filter((line) => line !== "");
  const head = lines.at(0);
  if (head === undefined) {
    return undefined;
  }
  const spaceIdx = head.indexOf(" ");
  return {
    entry: { date: head.slice(spaceIdx + 1), hash: head.slice(0, spaceIdx) },
    paths: lines.slice(1),
  };
};

const indexCommitBlocks = (output: string): Map<string, CommitEntry[]> => {
  const logByFile = new Map<string, CommitEntry[]>();
  for (const block of output.split(COMMIT_SEPARATOR)) {
    const parsed = parseCommitBlock(block);
    if (parsed !== undefined) {
      for (const path of parsed.paths) {
        const commits = logByFile.get(path) ?? [];
        commits.push(parsed.entry);
        logByFile.set(path, commits);
      }
    }
  }
  return logByFile;
};

// One `git log` call for the whole posts directory.
// Returns commit entries (newest first) keyed by repo-relative path.
const getCommitLogByFile = (postsDir: string, repoRoot: string): Map<string, CommitEntry[]> => {
  try {
    const output = execFileSync(
      "git",
      ["log", "--format=%x01%H %aI", "--name-only", "--", postsDir],
      { cwd: repoRoot, encoding: "utf8", maxBuffer: MAX_GIT_BUFFER },
    );
    return indexCommitBlocks(output);
  } catch {
    return new Map<string, CommitEntry[]>();
  }
};

// Parse one `git cat-file --batch` record starting at offset.
// Records are "<oid> <type> <size>\n<content>\n" or "<request> missing\n".
const parseBatchRecord = (
  stdout: Buffer,
  offset: number,
): { body: string | undefined; nextOffset: number } => {
  const headerEnd = stdout.indexOf(NEWLINE_BYTE, offset);
  const header = stdout.subarray(offset, headerEnd).toString("utf8");
  const contentStart = headerEnd + 1;

  if (header.endsWith(" missing")) {
    return { body: undefined, nextOffset: contentStart };
  }

  const size = Number.parseInt(header.slice(header.lastIndexOf(" ") + 1), 10);
  const content = stdout.subarray(contentStart, contentStart + size).toString("utf8");
  return { body: stripFrontmatter(content), nextOffset: contentStart + size + 1 };
};

const collectBatchBodies = (stdout: Buffer, requests: string[]): Map<string, string> => {
  const bodies = new Map<string, string>();
  let offset = 0;
  for (const request of requests) {
    const { body, nextOffset } = parseBatchRecord(stdout, offset);
    offset = nextOffset;
    if (body !== undefined) {
      bodies.set(request, body);
    }
  }
  return bodies;
};

// One `git cat-file --batch` call for all (commit, path) pairs.
// Returns post bodies (frontmatter stripped) keyed by "<hash>:<path>".
const fetchBodiesAtCommits = (requests: string[], repoRoot: string): Map<string, string> => {
  if (requests.length === 0) {
    return new Map<string, string>();
  }

  const stdout = execFileSync("git", ["cat-file", "--batch"], {
    cwd: repoRoot,
    input: requests.join("\n"),
    maxBuffer: MAX_GIT_BUFFER,
  });

  return collectBatchBodies(stdout, requests);
};

const hasBodyChanged = (
  bodies: Map<string, string>,
  relativePath: string,
  pair: { current: CommitEntry; older: CommitEntry },
): boolean => {
  const currentBody = bodies.get(`${pair.current.hash}:${relativePath}`);
  const olderBody = bodies.get(`${pair.older.hash}:${relativePath}`);
  return currentBody === undefined || olderBody === undefined || currentBody !== olderBody;
};

const findLastBodyChange = (
  commits: CommitEntry[],
  relativePath: string,
  bodies: Map<string, string>,
): string | undefined => {
  for (let idx = 0; idx < commits.length - 1; idx += 1) {
    const current = commits[idx];
    const older = commits[idx + 1];
    if (current === undefined || older === undefined) {
      break;
    }
    if (hasBodyChanged(bodies, relativePath, { current, older })) {
      return current.date;
    }
  }

  return commits.at(-1)?.date;
};

interface CollectContext {
  isDev: boolean;
  postsDir: string;
  repoRoot: string;
}

interface FileHistory {
  commits: CommitEntry[];
  file: string;
  relativePath: string;
}

const resolveUpdatedAt = (
  history: FileHistory,
  bodies: Map<string, string>,
  ctx: CollectContext,
): string => {
  const updatedAt = findLastBodyChange(history.commits, history.relativePath, bodies);

  if (updatedAt !== undefined) {
    return updatedAt;
  }
  if (ctx.isDev) {
    return new Date().toISOString();
  }
  throw new Error(`No git history found for ${history.file}. Ensure the file is committed.`);
};

const collectTimestamps = (postsDir: string, ctx: CollectContext): Record<string, string> => {
  const files = readdirSync(postsDir, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".md"));
  const logByFile = getCommitLogByFile(postsDir, ctx.repoRoot);

  const histories: FileHistory[] = files.map((file) => {
    const relativePath = relative(ctx.repoRoot, join(postsDir, file));
    return { commits: logByFile.get(relativePath) ?? [], file, relativePath };
  });

  // Bodies are only compared between adjacent commits, so single-commit files need none
  const requests = histories
    .filter((history) => history.commits.length > 1)
    .flatMap((history) =>
      history.commits.map((commit) => `${commit.hash}:${history.relativePath}`),
    );
  const bodies = fetchBodiesAtCommits(requests, ctx.repoRoot);

  const entries = histories.map(
    (history) =>
      [history.file.replace(/\.md$/, ""), resolveUpdatedAt(history, bodies, ctx)] as const,
  );
  return Object.fromEntries(entries);
};

const gitTimestampsPlugin = (postsDir: string): Plugin => {
  const resolvedPostsDir = resolve(postsDir);
  let timestamps: Record<string, string> = {};
  let ctx: CollectContext = { isDev: false, postsDir: resolvedPostsDir, repoRoot: "" };

  return {
    configResolved(config) {
      ctx = {
        isDev: config.command === "serve",
        postsDir: resolvedPostsDir,
        repoRoot: getRepoRoot(),
      };
      timestamps = collectTimestamps(resolvedPostsDir, ctx);
    },

    handleHotUpdate({ file }) {
      if (file.startsWith(resolvedPostsDir) && file.endsWith(".md")) {
        timestamps = collectTimestamps(resolvedPostsDir, ctx);
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `export default ${JSON.stringify(timestamps)};`;
      }
    },

    name: "vite-plugin-git-timestamps",

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },
  };
};

export { gitTimestampsPlugin };
