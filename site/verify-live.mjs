import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import axe from "axe-core";
import { chromium } from "playwright";

const baseURL = (process.argv[2] ?? "https://sqlite-sync-guard.sociobot.in").replace(/\/$/, "");
const evidence = resolve(process.argv[3] ?? ".factory/evidence/live/polish-4");
await mkdir(evidence, { recursive: true });

const routes = [
  ["/", 200, "SQLite Sync Guard — check SQLite files before sync", `${baseURL}/`],
  ["/demo/", 200, "Demo — SQLite Sync Guard", `${baseURL}/demo/`],
  ["/privacy/", 200, "Privacy — SQLite Sync Guard", `${baseURL}/privacy/`],
  ["/terms/", 200, "Terms — SQLite Sync Guard", `${baseURL}/terms/`],
  ["/missing-polish-4", 404, "Page not found — SQLite Sync Guard", null]
];
const report = { baseURL, checkedAt: new Date().toISOString(), routes: [], links: [], consoleErrors: [], expected404Console: [], externalRequests: [] };
const browser = await chromium.launch({ headless: true });

try {
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobileContext.addInitScript({ content: axe.source });
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", (error) => report.consoleErrors.push(error.message));
  mobile.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push(message.text()); });
  mobile.on("request", (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL).origin) report.externalRequests.push(request.url());
  });

  const cold = await mobile.goto(`${baseURL}/?cold=polish-4-${Date.now()}`, { waitUntil: "networkidle" });
  assert.equal(cold?.status(), 200);
  assert.equal(await mobile.title(), routes[0][2]);
  assert.equal(await mobile.getByRole("heading", { level: 1 }).innerText(), "Check SQLite files before folder sync");
  assert.equal(await mobile.locator("[data-update-toast]").isHidden(), true, "cold visit must not show an update prompt");
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  for (const selector of ["h1", ".lede", ".hero-actions", ".plain-facts"]) {
    const box = await mobile.locator(selector).boundingBox();
    assert.ok(box && box.y + box.height <= 844, `${selector} must fit the first mobile screen`);
  }
  await mobile.screenshot({ path: resolve(evidence, "home-mobile-cold.png"), fullPage: true });

  await mobile.evaluate(() => {
    localStorage.setItem("sqlite-sync-guard:real", "live-private-sentinel");
    localStorage.setItem("demo:sqlite-sync-guard:reset-me", "demo-only");
  });
  const requests = [];
  mobile.on("request", (request) => requests.push(request.url()));
  const sample = mobile.getByRole("link", { name: "Try it with sample data" });
  assert.equal(await sample.getAttribute("href"), "/?demo=1");
  await sample.click();
  await mobile.waitForURL(`${baseURL}/demo/`);
  await mobile.waitForLoadState("networkidle");
  assert.ok(requests.includes(`${baseURL}/?demo=1`), "live click must request /?demo=1 before route replacement");
  assert.equal(await mobile.getByText("Demo — sample data, nothing is saved").count(), 1);
  await mobile.waitForFunction(() => document.querySelector("[data-demo-transcript]")?.textContent?.includes("active-session.db"));
  assert.match(await mobile.locator("[data-demo-transcript]").textContent(), /closed-project\.backup\.manifest\.json/);
  assert.doesNotMatch(await mobile.locator("body").innerText(), /live-private-sentinel/);
  assert.equal(await mobile.evaluate(() => localStorage.getItem("sqlite-sync-guard:real")), "live-private-sentinel");
  const recording = await mobile.locator(".terminal-recording").boundingBox();
  assert.ok(recording && recording.y < 844, "demo recording must begin on the first mobile screen");
  await mobile.screenshot({ path: resolve(evidence, "demo-mobile-cold.png"), fullPage: true });
  await mobile.getByRole("button", { name: "Reset demo" }).click();
  assert.equal(await mobile.evaluate(() => localStorage.getItem("demo:sqlite-sync-guard:reset-me")), null);
  assert.equal(await mobile.evaluate(() => localStorage.getItem("sqlite-sync-guard:real")), "live-private-sentinel");
  assert.match(await mobile.locator("[data-demo-reset-status]").innerText(), /Demo reset/);

  await mobile.evaluate(() => localStorage.setItem("demo:sqlite-sync-guard:start-real", "discard"));
  await mobile.getByRole("link", { name: "Start for real" }).click();
  await mobile.waitForLoadState("networkidle");
  assert.equal(mobile.url(), `${baseURL}/`);
  assert.equal(await mobile.evaluate(() => document.activeElement?.id), "hero-title");
  assert.equal(await mobile.evaluate(() => localStorage.getItem("demo:sqlite-sync-guard:start-real")), null);
  assert.equal(await mobile.evaluate(() => localStorage.getItem("sqlite-sync-guard:real")), "live-private-sentinel");

  await mobile.goto(`${baseURL}/privacy/`, { waitUntil: "networkidle" });
  await mobile.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, document.documentElement.scrollHeight); });
  await mobile.waitForFunction(() => scrollY > 40);
  const privacyScroll = await mobile.evaluate(() => scrollY);
  await mobile.evaluate(() => location.assign("/"));
  await mobile.waitForURL(`${baseURL}/`);
  await mobile.goBack({ waitUntil: "networkidle" });
  assert.equal(await mobile.evaluate(() => document.activeElement?.tagName), "H1");
  assert.ok(await mobile.evaluate(() => scrollY) >= privacyScroll - 4, "Back must preserve the restored live scroll position");
  await mobile.goForward({ waitUntil: "networkidle" });
  assert.equal(await mobile.evaluate(() => document.activeElement?.id), "hero-title");

  for (const path of ["/", "/demo/", "/privacy/", "/terms/"]) {
    await mobile.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `live mobile overflow at ${path}`);
    const undersized = await mobile.locator("a, button, summary").evaluateAll((elements) => elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
      })
      .map((element) => element.textContent?.trim()));
    assert.deepEqual(undersized, [], `live touch targets below 44px at ${path}: ${undersized.join(", ")}`);
  }
  await mobile.emulateMedia({ reducedMotion: "reduce" });
  await mobile.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  assert.match(await mobile.locator(".hero-art").evaluate((element) => getComputedStyle(element).transform), /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await mobile.emulateMedia({ reducedMotion: "no-preference" });
  await mobile.goto(`${baseURL}/demo/`, { waitUntil: "networkidle" });
  await mobile.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 30_000 });
  await mobileContext.setOffline(true);
  await mobile.reload({ waitUntil: "domcontentloaded" });
  assert.equal(await mobile.title(), "Demo — SQLite Sync Guard");
  assert.equal(await mobile.getByText("Demo — sample data, nothing is saved").count(), 1);
  await mobileContext.setOffline(false);
  await mobileContext.close();

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript({ content: axe.source });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.consoleErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (page.url().includes("/missing-polish-4") && /status of 404/.test(message.text())) report.expected404Console.push(message.text());
    else report.consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== new URL(baseURL).origin) report.externalRequests.push(request.url());
  });
  const links = new Set();

  for (const [path, status, title, canonical] of routes) {
    const response = await page.goto(`${baseURL}${path}`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), status, `live status at ${path}`);
    assert.equal(await page.title(), title, `live title at ${path}`);
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.locator("main").count(), 1);
    assert.equal(await page.locator("header").count(), 1);
    assert.equal(await page.locator("footer").count(), 1);
    assert.equal(await page.locator('meta[property="og:title"]').count(), 1);
    assert.equal(await page.locator('meta[name="twitter:title"]').count(), 1);
    assert.equal(await page.locator('link[rel="icon"]').count(), 1);
    assert.equal(await page.locator('link[rel="apple-touch-icon"]').count(), 1);
    assert.equal(await page.locator('link[rel="manifest"]').count(), 1);
    if (canonical) assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), canonical);
    else {
      assert.equal(await page.locator('link[rel="canonical"]').count(), 0);
      assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "noindex");
    }
    assert.ok(await page.getByRole("link", { name: "Privacy", exact: true }).count() >= 1);
    assert.ok(await page.getByRole("link", { name: "Terms", exact: true }).count() >= 1);
    await page.locator(".skip-link").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.activeElement?.id === "main");
    const axeResult = await page.evaluate(async () => axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] }
    }));
    assert.deepEqual(axeResult.violations, [], `live axe violations at ${path}: ${JSON.stringify(axeResult.violations)}`);
    for (const href of await page.locator("a[href]").evaluateAll((anchors) => anchors
      .filter((anchor) => !anchor.getAttribute("href")?.startsWith("#"))
      .map((anchor) => anchor.href))) links.add(href);
    report.routes.push({ path, status, title, axeViolations: axeResult.violations.length });
  }

  await page.goto(`${baseURL}/demo/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "SQLite Sync Guard home" }).click();
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "hero-title");
  assert.match(await page.locator("[data-route-status]").innerText(), /Check SQLite files before folder sync/);
  await page.goto(`${baseURL}/privacy/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Commands", exact: true }).click();
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "commands-title");
  assert.match(await page.locator("[data-route-status]").innerText(), /Scan, export, or add ignore rules/);

  for (const href of links) {
    const target = new URL(href);
    target.hash = "";
    const response = await fetch(target, { redirect: "follow" });
    assert.ok(response.status >= 200 && response.status < 400, `linked URL failed: ${target} (${response.status})`);
    report.links.push({ url: target.toString(), status: response.status });
  }
  for (const path of ["/robots.txt", "/sitemap.xml", "/social-card.png", "/guarded-handoff.webp", "/sw.js"]) {
    const response = await fetch(`${baseURL}${path}`);
    assert.equal(response.status, 200, `live asset ${path}`);
  }
  assert.deepEqual(await context.cookies(), []);
  await context.close();

  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.externalRequests, []);
  await writeFile(resolve(evidence, "live-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`live verification passed: ${report.routes.length} routes, ${report.links.length} links, axe/privacy/offline/demo clean`);
} finally {
  await browser.close();
}
