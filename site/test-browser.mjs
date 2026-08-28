import assert from "node:assert/strict";
import { createServer } from "node:http";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
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
  .replace("SQLite Sync Guard — check SQLite files before sync", "SQLite Sync Guard update B"));
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
    const body = await readFile(join(activeRelease, "404.html"));
    response.writeHead(404, { ...securityHeaders, "content-type": "text/html; charset=utf-8" });
    response.end(body);
  }
});
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const address = server.address();
assert(address && typeof address !== "string");
const baseURL = `http://127.0.0.1:${address.port}`;
const evidence = resolve(here, "../.factory/evidence");
await mkdir(evidence, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  const externalRequests = [];
  const sameOriginRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL)) externalRequests.push(request.url());
    else sameOriginRequests.push(request.url());
  });

  const firstResponse = await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  assert.equal(firstResponse?.status(), 200);
  assert.equal(await page.title(), "SQLite Sync Guard — check SQLite files before sync");
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator("main").count(), 1);
  assert.match(firstResponse?.headers()["content-security-policy"] ?? "", /default-src 'self'/);
  assert.equal(firstResponse?.headers()["x-content-type-options"], "nosniff");
  assert.equal(externalRequests.length, 0, `unexpected outbound request: ${externalRequests.join(", ")}`);
  assert.equal(await page.locator('a[href*="/releases"]').count(), 0, "site must not offer unavailable releases");
  assert.equal(await page.getByRole("link", { name: "Try it with sample data" }).count(), 1);
  assert.equal(await page.getByRole("link", { name: "Try it with sample data" }).getAttribute("href"), "/?demo=1");
  assert.equal(await page.locator("[data-update-toast]").isHidden(), true);
  await page.screenshot({ path: join(evidence, "polish-4-home-desktop.png"), fullPage: true });

  await page.keyboard.press("Tab");
  await expectActive(page, ".skip-link");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.activeElement?.id === "main");

  await page.evaluate(() => {
    localStorage.setItem("sqlite-sync-guard:real", "private-real-storage-sentinel");
    localStorage.setItem("demo:sqlite-sync-guard:pending", "demo-only-value");
  });
  await page.getByRole("link", { name: "Try it with sample data" }).click();
  await page.waitForURL(`${baseURL}/demo/`);
  await page.waitForLoadState("networkidle");
  assert.ok(sameOriginRequests.includes(`${baseURL}/?demo=1`), "the first-screen action must enter through the exact ?demo=1 URL");
  assert.equal(await page.getByText("Demo — sample data, nothing is saved").count(), 1);
  await page.waitForFunction(() => document.querySelector("[data-demo-transcript]")?.textContent?.includes("active-session.db"));
  assert.match(await page.locator("[data-demo-transcript]").textContent(), /active-session\.db/);
  assert.doesNotMatch(await page.locator("body").innerText(), /private-real-storage-sentinel/, "demo must not render normal-storage data");
  assert.equal(await page.evaluate(() => localStorage.getItem("sqlite-sync-guard:real")), "private-real-storage-sentinel");

  assert.equal(await page.locator('img[src="/demo-recording.svg"]').count(), 1);

  const routes = [
    ["/", 200, "SQLite Sync Guard — check SQLite files before sync", "https://sqlite-sync-guard.sociobot.in/"],
    ["/demo/", 200, "Demo — SQLite Sync Guard", "https://sqlite-sync-guard.sociobot.in/demo/"],
    ["/privacy/", 200, "Privacy — SQLite Sync Guard", "https://sqlite-sync-guard.sociobot.in/privacy/"],
    ["/terms/", 200, "Terms — SQLite Sync Guard", "https://sqlite-sync-guard.sociobot.in/terms/"],
    ["/missing-page", 404, "Page not found — SQLite Sync Guard", null]
  ];
  for (const [route, status, title, canonical] of routes) {
    const response = await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), status, `HTTP status at ${route}`);
    assert.equal(await page.title(), title, `title at ${route}`);
    assert.equal(await page.locator("html").getAttribute("lang"), "en", `language at ${route}`);
    assert.equal(await page.locator("h1").count(), 1, `one h1 at ${route}`);
    assert.equal(await page.locator("main").count(), 1, `main landmark at ${route}`);
    assert.equal(await page.locator("header").count(), 1, `header at ${route}`);
    assert.equal(await page.locator("footer").count(), 1, `footer at ${route}`);
    assert.equal(await page.locator('meta[name="theme-color"]').count(), 1, `theme color missing at ${route}`);
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    assert.ok(description && description.length <= 155, `plain metadata description at ${route}`);
    assert.equal(await page.locator('meta[property="og:title"]').count(), 1, `Open Graph title missing at ${route}`);
    assert.equal(await page.locator('meta[property="og:description"]').count(), 1, `Open Graph description missing at ${route}`);
    assert.equal(await page.locator('meta[property="og:image"]').count(), 1, `Open Graph image missing at ${route}`);
    assert.equal(await page.locator('meta[name="twitter:title"]').count(), 1, `Twitter title missing at ${route}`);
    assert.equal(await page.locator('link[rel="icon"]').count(), 1, `favicon missing at ${route}`);
    assert.equal(await page.locator('link[rel="apple-touch-icon"]').count(), 1, `Apple icon missing at ${route}`);
    assert.equal(await page.locator('link[rel="manifest"]').count(), 1, `manifest missing at ${route}`);
    if (canonical) assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), canonical, `canonical at ${route}`);
    else assert.equal(await page.locator('link[rel="canonical"]').count(), 0, "404 must not declare a canonical page");
    assert.equal(await page.getByRole("link", { name: "Commands" }).count(), 1, `shared Commands link missing at ${route}`);
    assert.ok(await page.getByRole("link", { name: "Privacy", exact: true }).count() >= 1, `Privacy link missing at ${route}`);
    assert.ok(await page.getByRole("link", { name: "Terms", exact: true }).count() >= 1, `Terms link missing at ${route}`);
    await page.locator(".skip-link").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.activeElement?.id === "main");
    await page.addScriptTag({ url: `${baseURL}/axe-test.js` });
    const results = await page.evaluate(async () => axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] }
    }));
    assert.deepEqual(results.violations, [], `axe violations at ${route}: ${JSON.stringify(results.violations)}`);
  }
  assert.deepEqual(await context.cookies(), [], "the static site must not set cookies");
  assert.equal(externalRequests.length, 0, `unexpected outbound request: ${externalRequests.join(", ")}`);

  await page.goto(`${baseURL}/demo/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(evidence, "polish-4-demo-desktop.png"), fullPage: true });
  await page.evaluate(() => localStorage.setItem("sqlite-sync-guard:real", "keep"));
  await page.evaluate(() => localStorage.setItem("demo:sqlite-sync-guard:temporary-note", "changed"));
  await page.getByRole("button", { name: "Reset demo" }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem("demo:sqlite-sync-guard:fixture")), null);
  assert.equal(await page.evaluate(() => localStorage.getItem("demo:sqlite-sync-guard:temporary-note")), null);
  assert.equal(await page.evaluate(() => localStorage.getItem("sqlite-sync-guard:real")), "keep");
  await assertText(page, "[data-demo-reset-status]", /Demo reset/);

  for (const name of ["Privacy", "Terms", "Demo"]) {
    await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
    await page.locator("header nav").getByRole("link", { name, exact: true }).click();
    await page.waitForLoadState("networkidle");
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H1", `${name} navigation must focus h1`);
    assert.notEqual(await page.locator("[data-route-status]").innerText(), "", `${name} navigation must announce h1`);
  }

  await page.goto(`${baseURL}/demo/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("sqlite-sync-guard:real", "keep-after-demo");
    localStorage.setItem("demo:sqlite-sync-guard:discard", "discard-me");
  });
  await page.getByRole("link", { name: "Start for real" }).click();
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "hero-title", "Start for real must focus the home heading");
  assert.match(await page.locator("[data-route-status]").innerText(), /Check SQLite files before folder sync/);
  assert.equal(await page.evaluate(() => localStorage.getItem("demo:sqlite-sync-guard:discard")), null);
  assert.equal(await page.evaluate(() => localStorage.getItem("sqlite-sync-guard:real")), "keep-after-demo");

  await page.goto(`${baseURL}/demo/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "SQLite Sync Guard home" }).click();
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "hero-title", "wordmark home must focus the home heading");

  await page.goto(`${baseURL}/privacy/`, { waitUntil: "networkidle" });
  await page.locator("header nav").getByRole("link", { name: "Commands", exact: true }).click();
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "commands-title", "Commands must focus its heading");
  assert.match(await page.locator("[data-route-status]").innerText(), /Scan, export, or add ignore rules/);

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  await mobile.screenshot({ path: join(evidence, "polish-4-home-mobile-390.png"), fullPage: true });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "390px viewport must not overflow horizontally");
  assert.ok(Number.parseFloat(await mobile.locator(".lede").evaluate((element) => getComputedStyle(element).fontSize)) >= 16,
    "mobile body text must be at least 16px");
  for (const selector of ["h1", ".hero-actions", ".plain-facts"]) {
    const box = await mobile.locator(selector).boundingBox();
    assert.ok(box && box.y + box.height <= 844, `${selector} must be visible on the first 390px screen`);
  }
  await mobile.goto(`${baseURL}/demo/`, { waitUntil: "networkidle" });
  await mobile.screenshot({ path: join(evidence, "polish-4-demo-mobile-390.png"), fullPage: true });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "mobile demo must not overflow horizontally");
  const recording = await mobile.locator(".terminal-recording").boundingBox();
  assert.ok(recording && recording.y < 844, "the real demo recording must begin on the first mobile screen");
  for (const route of ["/", "/demo/", "/privacy/", "/terms/", "/missing-page"]) {
    await mobile.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `mobile route must not overflow: ${route}`);
    const undersized = await mobile.locator("a, button, summary").evaluateAll((elements) => elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
      })
      .map((element) => ({ text: element.textContent?.trim(), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
    assert.deepEqual(undersized, [], `touch targets below 44px at ${route}: ${JSON.stringify(undersized)}`);
  }
  await mobile.goto(`${baseURL}/privacy/`, { waitUntil: "networkidle" });
  await mobile.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, document.documentElement.scrollHeight); });
  await mobile.waitForFunction(() => scrollY > 40);
  const privacyScroll = await mobile.evaluate(() => scrollY);
  assert.ok(privacyScroll > 40, "privacy route must be scrollable for history restoration coverage");
  await mobile.evaluate(() => location.assign("/"));
  await mobile.waitForURL(`${baseURL}/`);
  await mobile.waitForLoadState("networkidle");
  await mobile.goBack({ waitUntil: "networkidle" });
  assert.equal(await mobile.evaluate(() => document.activeElement?.tagName), "H1", "Back must focus the destination heading");
  const restoredScroll = await mobile.evaluate(() => scrollY);
  assert.ok(restoredScroll >= privacyScroll - 4, `Back must preserve restored scroll (${restoredScroll} vs ${privacyScroll})`);
  await mobile.goForward({ waitUntil: "networkidle" });
  assert.equal(await mobile.evaluate(() => document.activeElement?.id), "hero-title", "Forward must focus the home heading");
  await mobile.emulateMedia({ reducedMotion: "reduce" });
  await mobile.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  assert.match(await mobile.locator(".hero-art").evaluate((element) => getComputedStyle(element).transform), /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/, "reduced motion must remove the print transform");
  await mobileContext.close();

  await page.goto(`${baseURL}/demo/`, { waitUntil: "networkidle" });
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
  assert.equal(await page.title(), "Demo — SQLite Sync Guard", "activated worker must serve demo shell offline");
  assert.equal(await page.locator('img[src="/demo-recording.svg"]').count(), 1);
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
