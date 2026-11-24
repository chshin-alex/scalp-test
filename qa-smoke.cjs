const { chromium } = require("playwright");
const path = require("path");

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:4173";
const ALLOWED_STAGES = new Set(["2단계", "2+단계", "3단계", "3+단계", "4단계"]);

async function completeDemo(page, filename = "stage-2-plus.jpg") {
  await page.getByTestId("start-diagnosis").click();
  await page.locator("#photoInput").setInputFiles(path.join(__dirname, "assets", filename));
  const count = await page.locator("#uploadCount").textContent();
  if (count !== "1") throw new Error(`Expected 1 uploaded photo, got ${count}`);
  await page.getByTestId("analyze").click();
  await page.locator("#resultView.is-visible").waitFor({ timeout: 10000 });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.screenshot({ path: "qa-home.png", fullPage: true });
  await completeDemo(page);

  if (await page.locator("#scoreInput").count()) throw new Error("Legacy global score input is still rendered");
  const bodyText = await page.locator("body").innerText();
  if (bodyText.includes("두피 건강 점수")) throw new Error("Legacy global health score copy is still rendered");
  if (bodyText.includes("품질 확인 필요")) throw new Error("Removed photo-quality state is still rendered");

  const stage = (await page.locator("#displayStage").textContent()).trim();
  if (!ALLOWED_STAGES.has(stage)) throw new Error(`Unexpected patient stage: ${stage}`);
  if (stage !== "2+단계") throw new Error(`Expected the 2+ director reference to classify as 2+, got ${stage}`);

  const modelInfo = await page.evaluate(() => ({
    version: window.ScalpClassifier?.modelVersion,
    count: window.ScalpClassifier?.referenceCount,
    directorCount: window.ScalpClassifier?.directorReferenceCount
  }));
  if (modelInfo.directorCount !== 39) {
    throw new Error(`Expected 39 director reference vectors, got ${modelInfo.directorCount}`);
  }
  if (modelInfo.count !== 40) throw new Error(`Expected 40 total reference vectors, got ${modelInfo.count}`);

  const representativeStages = [
    ["2", "stage-0.jpg"],
    ["2", "stage-1.jpg"],
    ["2", "stage-1-plus.jpg"],
    ["2", "stage-2.jpg"],
    ["2+", "stage-2-plus.jpg"],
    ["3", "stage-3.jpg"],
    ["3+", "stage-3-plus.jpg"],
    ["4", "stage-4.jpg"],
    ["4", "stage-4-plus.jpg"]
  ];
  const representativeResults = await page.evaluate(async (pairs) => {
    const results = [];
    for (const [expected, filename] of pairs) {
      const analysis = await window.ScalpClassifier.analyzePhotos([{
        id: filename,
        url: `assets/${filename}`
      }]);
      results.push({ expected, actual: analysis.stage });
    }
    return results;
  }, representativeStages);
  const representativeMismatch = representativeResults.filter((result) => result.expected !== result.actual);
  if (representativeMismatch.length) {
    throw new Error(`Representative stage mismatch: ${JSON.stringify(representativeMismatch)}`);
  }

  const options = await page.locator("#stageSelect option").evaluateAll((nodes) => nodes.map((node) => node.value));
  if (JSON.stringify(options) !== JSON.stringify(["2", "2+", "3", "3+", "4"])) {
    throw new Error(`Unexpected stage options: ${options.join(",")}`);
  }

  const referenceCount = await page.locator("#stageReferenceGrid .stage-tile").count();
  if (referenceCount !== 9) throw new Error(`Expected 9 reference stages, got ${referenceCount}`);
  const stageSources = await page.locator("#stageReferenceGrid img").evaluateAll((nodes) => nodes.map((node) => new URL(node.src).pathname));
  const severeSources = stageSources.slice(3);
  if (new Set(severeSources).size !== 6) throw new Error(`Expected unique 2–4+ stage images, got ${severeSources.join(",")}`);
  const unloadedStageImages = await page.locator("#stageReferenceGrid img").evaluateAll((nodes) => nodes.filter((node) => !node.complete || node.naturalWidth === 0).length);
  if (unloadedStageImages) throw new Error(`Stage reference images failed to load: ${unloadedStageImages}`);

  const metricCount = await page.locator("#metricGrid .metric-card").count();
  if (metricCount !== 3) throw new Error(`Expected 3 metric cards, got ${metricCount}`);
  const metricScores = await page.locator(".metric-score-row strong").evaluateAll((nodes) => nodes.map((node) => Number(node.textContent)));
  if (metricScores.some((score) => !Number.isInteger(score) || score < 1 || score > 30)) {
    throw new Error(`Metric score out of range: ${metricScores.join(",")}`);
  }

  const progressionCount = await page.locator("[data-progression-card]").count();
  if (progressionCount !== 3) throw new Error(`Expected 3 progression cards, got ${progressionCount}`);
  const progressionDurations = await page.locator(".progression-arrow small").allTextContents();
  if (JSON.stringify(progressionDurations) !== JSON.stringify(["2–4개월", "8–16개월"])) {
    throw new Error(`Unexpected 2+ stage progression durations: ${progressionDurations.join(",")}`);
  }

  await page.locator("#stageSelect").selectOption("4");
  await page.getByTestId("confirm-review").click();
  if (await page.locator("#reviewError").isHidden()) throw new Error("Changed stage should require a reason");
  await page.locator("#changeReason").fill("원장 육안 검토 결과");
  await page.getByTestId("confirm-review").click();

  const status = (await page.locator("#reviewStatus").textContent()).trim();
  if (status !== "의료진 확정") throw new Error(`Expected confirmed status, got ${status}`);
  const countText = (await page.locator("#requiredTreatmentCount").textContent()).trim();
  const enhanced = (await page.locator("#enhancedTreatmentTitle").textContent()).trim();
  if (countText !== "30–40회") throw new Error(`Unexpected treatment count: ${countText}`);
  if (enhanced !== "보톡스 + 엑소좀") throw new Error(`Unexpected enhanced treatment: ${enhanced}`);

  await page.locator("#handoffButton").click();
  const handoff = (await page.locator("#handoffButton").textContent()).trim();
  if (handoff !== "상담 인계 완료") throw new Error(`Expected handoff completion, got ${handoff}`);
  await page.screenshot({ path: "qa-result.png", fullPage: true });

  for (const [filename, expected] of [["stage-1-plus.jpg", "2"], ["stage-4-plus.jpg", "4"]]) {
    await page.goto(BASE_URL);
    await completeDemo(page, filename);
    const shown = (await page.locator("#displayStage").textContent()).trim();
    const selected = await page.locator("#stageSelect").inputValue();
    if (shown !== `${expected}단계` || selected !== expected) {
      throw new Error(`Patient stage constraint failed for ${filename}: ${shown} / ${selected}`);
    }
    await page.getByTestId("confirm-review").click();
    if ((await page.locator("#reviewStatus").textContent()).trim() !== "의료진 확정") {
      throw new Error(`Cannot confirm bounded stage for ${filename}`);
    }
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const mobileErrors = [];
  mobile.on("console", (message) => { if (message.type() === "error") mobileErrors.push(message.text()); });
  mobile.on("pageerror", (error) => mobileErrors.push(error.message));
  await mobile.goto(BASE_URL, { waitUntil: "networkidle" });
  await mobile.locator("#heroStartButton").click();
  await mobile.locator("#loadSampleButton").click();
  await mobile.getByTestId("analyze").click();
  await mobile.locator("#resultView.is-visible").waitFor({ timeout: 5000 });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`Mobile horizontal overflow: ${overflow}px`);
  await mobile.screenshot({ path: "qa-mobile.png", fullPage: true });

  if (errors.length || mobileErrors.length) throw new Error(`Browser errors: ${[...errors, ...mobileErrors].join(" | ")}`);
  await browser.close();
  process.stdout.write("QA_SMOKE_OK\n");
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exit(1);
});
