import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve("dist/site");
for (const file of ["index.html", "privacy/index.html", "terms/index.html", "sw.js"]) {
  if (!existsSync(resolve(root, file))) throw new Error(`missing dist/site/${file}`);
}
const assets = readdirSync(resolve(root, "assets"));
const jsBytes = assets.filter((name) => name.endsWith(".js")).reduce((sum, name) => sum + statSync(resolve(root, "assets", name)).size, 0);
const cssBytes = assets.filter((name) => name.endsWith(".css")).reduce((sum, name) => sum + statSync(resolve(root, "assets", name)).size, 0);
const html = readFileSync(resolve(root, "index.html"), "utf8");
if (!html.includes("guarded-handoff.webp")) throw new Error("hero missing from built page");
if (jsBytes > 200 * 1024) throw new Error(`JS budget exceeded: ${jsBytes}`);
if (cssBytes > 50 * 1024) throw new Error(`CSS budget exceeded: ${cssBytes}`);
console.log(`dist checks passed; JS ${(jsBytes / 1024).toFixed(1)} KB, CSS ${(cssBytes / 1024).toFixed(1)} KB`);
