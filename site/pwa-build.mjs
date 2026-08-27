import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const defaultOutput = resolve(here, "../dist/site");
const excludedFiles = new Set(["sw.js", "staticwebapp.config.json"]);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return nested.flat();
}

function requestPath(output, file) {
  const path = relative(output, file).split(sep).join("/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

export async function collectShell(output = defaultOutput) {
  const files = (await filesIn(output)).filter((file) => !excludedFiles.has(relative(output, file)));
  const entries = await Promise.all(files.map(async (file) => ({
    path: requestPath(output, file),
    content: await readFile(file)
  })));
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildId(shell) {
  const hash = createHash("sha256");
  for (const entry of shell) {
    hash.update(entry.path);
    hash.update("\0");
    hash.update(entry.content);
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 16);
}

export async function writeServiceWorker(output = defaultOutput) {
  const shell = await collectShell(output);
  const version = buildId(shell);
  const template = await readFile(join(here, "sw.template.js"), "utf8");
  const source = template
    .replace("__BUILD_ID__", version)
    .replace("__SHELL__", JSON.stringify(shell.map((entry) => entry.path)));
  await writeFile(join(output, "sw.js"), source);
  return { version, shell: shell.map((entry) => entry.path) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await writeServiceWorker(process.argv[2] ? resolve(process.argv[2]) : defaultOutput);
  console.log(`generated service worker cache sqlite-sync-guard-${result.version} (${result.shell.length} release files)`);
}
