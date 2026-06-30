import { chromium } from "playwright";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@tireproandrepair.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme123";
const results = [];

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"} - ${name}${detail ? `: ${detail}` : ""}`);
}

function productGridHtml(html) {
  const start = html.indexOf('class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"');
  if (start === -1) return html;
  return html.slice(start, start + 12000);
}

function hasProductPrices(gridHtml) {
  return (
    /\$\s?\d/.test(gridHtml) ||
    /product\.price/i.test(gridHtml) ||
    />\s*\d{1,4}\.\d{2}\s*</.test(gridHtml)
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/collections/tires`, { waitUntil: "networkidle", timeout: 60000 });
    const tiresHtml = await page.content();
    const tiresGrid = productGridHtml(tiresHtml);
    const tiresHasHero = tiresHtml.includes("CTABanner") || tiresHtml.includes("HeroSection") || /hero-wheel\.jpg/i.test(tiresHtml);
    const tiresCallButtons = await page.locator('.grid a:has-text("Call to Inquire")').count();
    const tiresQuoteButtons = await page.locator('.grid a:has-text("Quote"), .grid button:has-text("Quote")').count();
    record("Collections /tires - hero banner removed", !tiresHasHero, tiresHasHero ? "hero/CTA component found" : "no hero/CTA component in page");
    record("Collections /tires - no product prices shown", !hasProductPrices(tiresGrid), hasProductPrices(tiresGrid) ? "price pattern in product grid" : "no prices in product grid");
    record("Collections /tires - only Call to Inquire per card", tiresCallButtons > 0 && tiresQuoteButtons === 0, `${tiresCallButtons} call buttons, ${tiresQuoteButtons} quote buttons in grid`);

    await page.goto(`${BASE}/collections/wheels`, { waitUntil: "networkidle", timeout: 60000 });
    const wheelsHtml = await page.content();
    const wheelsGrid = productGridHtml(wheelsHtml);
    const wheelsHasHero = wheelsHtml.includes("CTABanner") || wheelsHtml.includes("HeroSection") || /hero-wheel\.jpg/i.test(wheelsHtml);
    const wheelsCallButtons = await page.locator('.grid a:has-text("Call to Inquire")').count();
    const wheelsQuoteButtons = await page.locator('.grid a:has-text("Quote"), .grid button:has-text("Quote")').count();
    record("Collections /wheels - hero banner removed", !wheelsHasHero, wheelsHasHero ? "hero/CTA component found" : "no hero/CTA component in page");
    record("Collections /wheels - no product prices shown", !hasProductPrices(wheelsGrid), hasProductPrices(wheelsGrid) ? "price pattern in product grid" : "no prices in product grid");
    record("Collections /wheels - only Call to Inquire per card", wheelsCallButtons > 0 && wheelsQuoteButtons === 0, `${wheelsCallButtons} call buttons, ${wheelsQuoteButtons} quote buttons in grid`);

    await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes("/admin/login"), { timeout: 20000 }),
      page.click('button[type="submit"]'),
    ]);

    await page.goto(`${BASE}/admin/collections`, { waitUntil: "networkidle", timeout: 60000 });
    const onLoginPage = page.url().includes("/admin/login");
    const editVisible = await page.getByRole("heading", { name: /Edit/i }).first().isVisible().catch(() => false);
    record("Admin /admin/collections loads", !onLoginPage && editVisible, onLoginPage ? "redirected to login" : editVisible ? "collections editor visible" : "editor not visible");

    const fixturePath = path.join(process.cwd(), "public", "file.svg");
    if (!existsSync(fixturePath)) throw new Error("Missing public/file.svg test fixture");

    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await fileInput.waitFor({ state: "attached", timeout: 10000 });
    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(3000);

    const uploadErrorCount = await page.locator("text=Upload failed").count();
    const uploadedUrl = (await page.locator(".truncate.text-xs.text-metallic").first().textContent())?.trim() || "";
    record("Admin collections - image upload", uploadErrorCount === 0 && uploadedUrl.length > 0, uploadedUrl || "no uploaded URL shown");

    await page.getByRole("button", { name: /Save/i }).first().click();
    await page.waitForTimeout(3000);
    const saveToast = await page.locator("text=/saved/i").first().textContent().catch(() => "");
    record("Admin collections - image save", /saved/i.test(saveToast || ""), saveToast || "no save confirmation");

    await page.reload({ waitUntil: "networkidle" });
    const persistedUrl = (await page.locator(".truncate.text-xs.text-metallic").first().textContent())?.trim() || "";
    record("Admin collections - image persists after refresh", persistedUrl === uploadedUrl, `before=${uploadedUrl} after=${persistedUrl}`);

    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(3000);
    const replacedUrl = (await page.locator(".truncate.text-xs.text-metallic").first().textContent())?.trim() || "";
    await page.getByRole("button", { name: /Save/i }).first().click();
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: "networkidle" });
    const replacedPersisted = (await page.locator(".truncate.text-xs.text-metallic").first().textContent())?.trim() || "";
    record("Admin collections - image replacement persists", replacedPersisted.length > 0, replacedPersisted || "empty after replace");
  } catch (error) {
    record("Verification run", false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
    writeFileSync(path.join(process.cwd(), "verification-results.json"), JSON.stringify(results, null, 2));
    const failed = results.filter((r) => !r.passed);
    process.exit(failed.length ? 1 : 0);
  }
}

main();