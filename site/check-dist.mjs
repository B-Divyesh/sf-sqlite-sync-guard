import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { buildId, collectShell } from "./pwa-build.mjs";

const root = resolve("dist/site");
for (const file of ["index.html", "demo/index.html", "privacy/index.html", "terms/index.html", "404.html", "robots.txt", "sitemap.xml", "sw.js"]) {
  if (!existsSync(resolve(root, file))) throw new Error(`missing dist/site/${file}`);
}
const assets = readdirSync(resolve(root, "assets"));
const jsBytes = assets.filter((name) => name.endsWith(".js")).reduce((sum, name) => sum + statSync(resolve(root, "assets", name)).size, 0);
const cssBytes = assets.filter((name) => name.endsWith(".css")).reduce((sum, name) => sum + statSync(resolve(root, "assets", name)).size, 0);
const html = readFileSync(resolve(root, "index.html"), "utf8");
const serviceWorker = readFileSync(resolve(root, "sw.js"), "utf8");
if (!html.includes("guarded-handoff.webp")) throw new Error("hero missing from built page");
if (jsBytes > 200 * 1024) throw new Error(`JS budget exceeded: ${jsBytes}`);
if (cssBytes > 50 * 1024) throw new Error(`CSS budget exceeded: ${cssBytes}`);
if (/sqlite-sync-guard-v1/.test(serviceWorker)) throw new Error("service worker uses a fixed cache revision");
const expectedVersion = buildId(await collectShell(root));
if (!serviceWorker.includes(`const CACHE = "sqlite-sync-guard-${expectedVersion}"`)) {
  throw new Error("service worker cache revision does not match release content");
}
if (!serviceWorker.includes("self.clients.claim()") || !serviceWorker.includes("SKIP_WAITING")) {
  throw new Error("service worker update lifecycle is incomplete");
}
if (/\/releases(?:["'])?/.test(html) || /Download latest release/.test(html)) {
  throw new Error("built page claims unavailable release binaries");
}
console.log(`dist checks passed; JS ${(jsBytes / 1024).toFixed(1)} KB, CSS ${(cssBytes / 1024).toFixed(1)} KB, PWA ${expectedVersion}`);
