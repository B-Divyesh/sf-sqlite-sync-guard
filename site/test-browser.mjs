import assert from "node:assert/strict";
import { createServer } from "node:http";
import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import axe from "axe-core";
import { chromium } from "playwright";
import { writeServiceWorker } from "./pwa-build.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const builtSite = resolve(here, "../dist/site");
const work = await mkdtemp(join(tmpdir(), "sqlite-sync-guard-browser-"));
const releaseA = join(work, "release-a");
const releaseB = join(work, "release-b");
await cp(builtSite, releaseA, { recursive: true });
await cp(builtSite, releaseB, { recursive: true });

const bIndex = join(releaseB, "index.html");
await writeFile(bIndex, (await readFile(bIndex, "utf8"))
  .replace("SQLite Sync Guard — preflight SQLite before folder sync", "SQLite Sync Guard update B"));
const releaseAWorker = await writeServiceWorker(releaseA);
const releaseBWorker = await writeServiceWorker(releaseB);
assert.notEqual(releaseAWorker.version, releaseBWorker.version, "test releases must receive distinct cache revisions");
// Load axe as a same-origin external script so the production CSP is exercised,
// rather than bypassed with an inline test injection.
await Promise.all([
  writeFile(join(releaseA, "axe-test.js"), axe.source),
  writeFile(join(releaseB, "axe-test.js"), axe.source)
]);

let activeRelease = releaseA;
const mime = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};
const securityHeaders = {
  "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff"
};

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url ?? "/", "http://guard.test").pathname;
    const target = pathname === "/" ? "index.html"
      : pathname.endsWith("/") ? `${pathname.slice(1)}index.html`
        : pathname.slice(1);
    const file = resolve(activeRelease, normalize(target));
    if (!file.startsWith(`${activeRelease}/`)) throw new Error("invalid path");
    const body = await readFile(file);
    response.writeHead(200, {
      ...securityHeaders,
      "cache-control": pathname === "/sw.js" ? "no-cache" : "no-store",
      "content-type": mime[extname(file)] ?? "application/octet-stream"
    });
    response.end(body);
  } catch {
    response.writeHead(404, securityHeaders);
    response.end("not found");
  }
});
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const address = server.address();
assert(address && typeof address !== "string");
const baseURL = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  const externalRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL)) externalRequests.push(request.url());
  });

  const firstResponse = await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  assert.equal(firstResponse?.status(), 200);
  assert.equal(await page.title(), "SQLite Sync Guard — preflight SQLite before folder sync");
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator("main").count(), 1);
  assert.match(firstResponse?.headers()["content-security-policy"] ?? "", /default-src 'self'/);
  assert.equal(firstResponse?.headers()["x-content-type-options"], "nosniff");
  assert.equal(externalRequests.length, 0, `unexpected outbound request: ${externalRequests.join(", ")}`);
  assert.equal(await page.locator('a[href*="/releases"]').count(), 0, "site must not offer unavailable releases");
  assert.equal(await page.getByRole("link", { name: "Install from source" }).count(), 2);

  await page.keyboard.press("Tab");
  await expectActive(page, ".skip-link");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.activeElement?.id === "main");
  const safeFixture = page.getByRole("button", { name: "Closed set" });
  await safeFixture.focus();
  await page.keyboard.press("Space");
  assert.equal(await safeFixture.getAttribute("aria-pressed"), "true");
  await assertText(page, "[data-terminal-status]", /Exit 0 · safe to copy/);

  for (const route of ["/", "/privacy/", "/terms/"]) {
    await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    await page.addScriptTag({ url: `${baseURL}/axe-test.js` });
    const results = await page.evaluate(async () => axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] }
    }));
    assert.deepEqual(results.violations, [], `axe violations at ${route}: ${JSON.stringify(results.violations)}`);
  }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "390px viewport must not overflow horizontally");
  assert.ok(Number.parseFloat(await mobile.locator(".lede").evaluate((element) => getComputedStyle(element).fontSize)) >= 16,
    "mobile body text must be at least 16px");
  await mobileContext.close();

  await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  assert.match(await page.evaluate(async () => (await caches.keys()).join(",")), new RegExp(releaseAWorker.version));

  activeRelease = releaseB;
  const updateState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update();
    await new Promise((resolveWaiting) => {
      if (registration?.waiting) return resolveWaiting();
      registration?.addEventListener("updatefound", () => {
        registration.installing?.addEventListener("statechange", () => {
          if (registration.waiting) resolveWaiting();
        });
      });
    });
    return Boolean(registration?.waiting);
  });
  assert.equal(updateState, true, "a changed deployment must install a waiting worker");
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.waiting?.postMessage({ type: "SKIP_WAITING" }));
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.includes("/sw.js"));
  await page.waitForTimeout(100);
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await page.title(), "SQLite Sync Guard update B", "activated worker must serve updated shell offline");
  const cacheNames = await page.evaluate(async () => caches.keys());
  assert.deepEqual(cacheNames, [`sqlite-sync-guard-${releaseBWorker.version}`], "activation must delete the old release cache");
  assert.deepEqual(pageErrors, [], `browser errors: ${pageErrors.join("; ")}`);
  await context.close();
  console.log(`browser regression passed: desktop, 390px, keyboard, axe, privacy, and PWA ${releaseAWorker.version} → ${releaseBWorker.version}`);
} finally {
  await browser.close();
  await new Promise((resolveClose, rejectClose) => server.close((error) => error ? rejectClose(error) : resolveClose()));
}

async function expectActive(page, selector) {
  await page.waitForFunction((activeSelector) => document.activeElement?.matches(activeSelector), selector);
}

async function assertText(page, selector, expression) {
  assert.match(await page.locator(selector).innerText(), expression);
}
