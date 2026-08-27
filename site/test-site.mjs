import { readFileSync, statSync } from "node:fs";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("./src/styles.css", import.meta.url), "utf8");
const image = statSync(new URL("./public/guarded-handoff.webp", import.meta.url));
const mobileImage = statSync(new URL("./public/guarded-handoff-600.webp", import.meta.url));
const checks = [
  [/<html lang="en">/, "document language"],
  [/<title>[^<]+<\/title>/, "page title"],
  [/<main id="main">/, "main landmark"],
  [/<h1[\s>]/g, "exactly one h1", 1],
  [/<img[^>]+alt="[^"]+"/, "meaningful hero alt"],
  [/class="skip-link"/, "skip link"],
  [/id="install"/, "usable source install target"],
  [/Install from source/, "truthful install CTA"],
  [/:focus-visible/, "visible focus rule", undefined, css],
  [/prefers-reduced-motion/, "reduced motion rule", undefined, css]
];

for (const [pattern, label, count, source = html] of checks) {
  const matches = source.match(pattern);
  if (!matches || (count !== undefined && matches.length !== count)) {
    throw new Error(`Site check failed: ${label}`);
  }
}
if (/\/releases(?:["'])?/.test(html) || /Download latest release/.test(html)) {
  throw new Error("Site must not claim unavailable release binaries");
}
if (image.size > 300 * 1024) throw new Error(`Hero exceeds 300 KB: ${image.size}`);
if (mobileImage.size >= image.size) throw new Error("Mobile hero variant is not smaller");
console.log(`site source checks passed; hero ${(image.size / 1024).toFixed(1)} KB, mobile ${(mobileImage.size / 1024).toFixed(1)} KB`);
