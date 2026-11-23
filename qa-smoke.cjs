const { chromium } = require("playwright");
const { resolve } = require("path");
const { pathToFileURL } = require("url");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("dialog", (dialog) => dialog.accept());
  const appUrl = pathToFileURL(resolve("index.html")).href;

  await page.goto(appUrl, { waitUntil: "load" });
  await page.getByTestId("start-diagnosis").click();
  await page.locator("#photoInput").setInputFiles([
    "assets/stage-2.jpg",
    "assets/stage-3.jpg"
  ]);

  const count = await page.locator("#uploadCount").textContent();
  if (count !== "2") throw new Error(`Expected 2 photos, got ${count}`);

  await page.getByTestId("analyze").click();
  await page.locator("#resultView.is-visible").waitFor({ timeout: 5000 });
  const automaticStatus = await page.locator("#reviewStatus").textContent();
  if (automaticStatus !== "자동 판정 결과") throw new Error(`Unexpected automatic status: ${automaticStatus}`);

  await page.locator("#editReviewButton").click();
  await page.locator("#reviewView.is-visible").waitFor();
  await page.locator("#stageSelect").selectOption("3");
  await page.locator("#rednessInput").selectOption("3");
  await page.locator("#scaleInput").selectOption("3");
  await page.locator("#reviewNote").fill("합성 QA 메모");
  await page.getByTestId("confirm-review").click();

  await page.locator("#resultView.is-visible").waitFor();
  const stage = await page.locator("#resultMetaStage").textContent();
  if (stage !== "3단계 · 적극 치료") throw new Error(`Unexpected stage: ${stage}`);

  await page.locator('[data-result-tab="evidence"]').click();
  if (!(await page.locator('[data-result-panel="evidence"]').isVisible())) {
    throw new Error("Evidence tab did not open");
  }

  await page.locator('[data-result-tab="progression"]').click();
  const pathNodes = await page.locator("#progressionPath .path-node").count();
  if (pathNodes !== 2) throw new Error(`Stage 3 should show two path nodes, got ${pathNodes}`);

  await page.locator('[data-result-tab="guide"]').click();
  const auditCount = await page.locator("#auditLogList li").count();
  if (auditCount < 4) throw new Error(`Expected audit entries, got ${auditCount}`);

  await page.getByTestId("handoff").click();
  const handoff = await page.getByTestId("handoff").textContent();
  if (handoff !== "상담 인계 완료") throw new Error(`Unexpected handoff state: ${handoff}`);
  await page.screenshot({ path: "qa-result.png", fullPage: true });

  const persisted = await page.evaluate(() => ({
    localStorageCount: localStorage.length,
    sessionStorageCount: sessionStorage.length
  }));
  if (persisted.localStorageCount || persisted.sessionStorageCount) {
    throw new Error("Prototype must not persist patient data in browser storage");
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(appUrl, { waitUntil: "load" });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`Mobile horizontal overflow: ${overflow}px`);
  await mobile.screenshot({ path: "qa-mobile.png", fullPage: true });

  await browser.close();
  process.stdout.write("QA_SMOKE_OK\n");
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
