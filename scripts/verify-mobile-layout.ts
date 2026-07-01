const BASE = process.argv[2] || "http://localhost:3000";
const VIEWPORTS = [320, 375, 390, 414, 430, 768] as const;

const PATHS = [
  "/",
  "/collections/tires",
  "/collections/wheels",
  "/shop",
  "/services",
  "/services/tires",
  "/gallery",
  "/contact",
  "/about",
  "/reviews",
  "/privacy-policy",
  "/terms-and-conditions",
] as const;

type CheckResult = {
  path: string;
  viewport: number;
  status: number;
  horizontalOverflow: boolean;
  documentWidth: number;
  viewportWidth: number;
};

async function checkPage(path: string, viewport: number): Promise<CheckResult> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: viewport, height: 800 } });
  const url = `${BASE}${path}`;
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  await browser.close();
  return {
    path,
    viewport,
    status: response?.status() ?? 0,
    horizontalOverflow: metrics.horizontalOverflow,
    documentWidth: metrics.documentWidth,
    viewportWidth: metrics.viewportWidth,
  };
}

async function main() {
  const results: CheckResult[] = [];
  const issues: string[] = [];

  for (const viewport of VIEWPORTS) {
    for (const path of PATHS) {
      const result = await checkPage(path, viewport);
      results.push(result);
      if (result.status !== 200) {
        issues.push(`${path} @ ${viewport}px: HTTP ${result.status}`);
      }
      if (result.horizontalOverflow) {
        issues.push(
          `${path} @ ${viewport}px: horizontal overflow (doc ${result.documentWidth}px > viewport ${result.viewportWidth}px)`,
        );
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        base: BASE,
        viewports: VIEWPORTS,
        pagesChecked: PATHS.length,
        totalChecks: results.length,
        overflowCount: results.filter((r) => r.horizontalOverflow).length,
        success: issues.length === 0,
        issues,
      },
      null,
      2,
    ),
  );

  if (issues.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});