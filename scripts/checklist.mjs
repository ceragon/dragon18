// 双路径检查单(#51,规格 §7):对同一份 demo 按拍序在真实现场走一遍人工核对。
// 本脚本有意重复断言 npm test 已覆盖的缝——检查单的意义正是「不凭测试绿,
// 在服务该文件的协议上真人(此处为真实 Chromium 按键走查)再验一遍」。
// 答案取自规格定稿文本(见龙在田 / 审题 / 52 / 40),不读页内 JUDGES 等内部全局。
// 走查需 Playwright(仓库既有浏览器设施),故为 .mjs 而非 scripts/ 惯用的 .py。
//   node scripts/checklist.mjs                     # file:// 本地副本(默认)
//   node scripts/checklist.mjs --url=https://ceragon.github.io/dragon18/demo/
//   node scripts/checklist.mjs --auto              # 加跑 ?auto=1 自动演示(约 3.5 分钟)
//   node scripts/checklist.mjs --proxy=http://127.0.0.1:7890   # 浏览器走代理(默认取 HTTPS_PROXY)
// 输出逐项 PASS/FAIL,退出码 = 失败数;检出旧版/未部署时退出码 2。
import { chromium } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const arg = (k, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split("=").slice(1).join("=") : d;
};
const BASE = arg(
  "url",
  pathToFileURL(path.resolve(import.meta.dirname, "../demo/index.html")).href,
);
const WITH_AUTO = process.argv.includes("--auto");
const PROXY = arg("proxy", process.env.HTTPS_PROXY || null);

const NB = 14; // 全拍序 0–13
const GATED = [5, 6, 9, 10]; // 作答拍
const MARK_STD = "招式体系暂定 · 孩子未确认 · 演示数据";
const MARK_QA = "问辩备查 · 不在正式演示流程内";

const results = [];
const rec = (item, pass, detail = "") => {
  results.push({ item, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${item}${detail ? `  — ${detail}` : ""}`);
};

const browser = await chromium.launch(PROXY ? { proxy: { server: PROXY } } : {});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
// §7.13 网络记账:除导航与 data: 内嵌外一律记录
const net = [], failed = [];
page.on("request", (r) => {
  if (!r.isNavigationRequest() && !r.url().startsWith("data:")) net.push(r.url());
});
page.on("requestfailed", (r) => failed.push(r.url()));

const beat = () => page.getAttribute("#stage", "data-beat");
const smallMark = () => page.locator("#tent").innerText();
const litSegs = () =>
  page.$$eval(".rail li[data-seg].on", (els) => els.map((e) => e.dataset.seg));
const pastSegs = () =>
  page.$$eval(".rail li[data-seg].past", (els) => els.map((e) => e.dataset.seg));
const gotoBeat = async (n) => {
  await page.goto(`${BASE}?beat=${n}`);
  await page.waitForLoadState("load");
};

// ---- §7.1 任意拍可直达 + §7.5 常驻小标逐拍在场 ----
await gotoBeat(0);
if (!(await page.locator("#stage").count())) {
  console.log(`FAIL  未检出 #stage:${BASE} 服务的不是新拍序实现(可能是旧四屏版或未部署)。`);
  process.exit(2);
}
let directOk = true, markOk = true;
for (let n = 0; n < NB; n++) {
  await gotoBeat(n);
  if ((await beat()) !== String(n) || !(await page.locator(".sc.in").first().isVisible()))
    directOk = false;
  const want = n <= 11 ? (n === 2 || n === 3 ? `硬件示意\n${MARK_STD}` : MARK_STD) : MARK_QA;
  if ((await smallMark()) !== want) markOk = false;
}
rec(`§7.1 ?beat=N 十四拍全部直达渲染`, directOk);
rec(`§7.5 常驻小标逐拍在场(附页换专属句)`, markOk);

// ---- §7.8 片头卡要素 ----
await gotoBeat(0);
const t0 = await page.locator(".sc.in").innerText();
rec("§7.8 片头卡要素", ["见题拆题之降题十八掌", "李赫愃·海淀实验", "演示数据", "预置回复", "硬件示意", "李赫愃本人编写"].every((s) => t0.includes(s)));

// ---- §7.4 键盘契约 ----
await page.keyboard.press("ArrowRight");
const fwd = (await beat()) === "1";
await page.keyboard.press("ArrowLeft");
const back = (await beat()) === "0";
await page.keyboard.press(" ");
const space = (await beat()) === "1";
await page.keyboard.press("PageUp");
await page.keyboard.press("PageDown");
const pgdn = (await beat()) === "1";
await page.mouse.click(1500, 950);
rec("§7.4 键盘契约(→/←/空格/PageDown 推进,空白点击不推进)", fwd && back && space && pgdn && (await beat()) === "1");
rec("§7.6 拍 1 点亮使命开场段", JSON.stringify(await litSegs()) === '["0"]');

// ---- §7.3 作答拍 gating:未作答三键无效;错答带解释仍锁;对答解锁 ----
for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight"); // →4
rec("§7.6 拍 4 已过段记 past", JSON.stringify(await pastSegs()) === '["0","1"]');
await page.keyboard.press("ArrowRight"); // →5
await page.keyboard.press("ArrowRight");
await page.keyboard.press(" ");
await page.keyboard.press("PageDown");
rec("§7.3 拍 5 未作答 →/空格/PageDown 均不推进", (await beat()) === "5");

const sc5 = page.locator('.sc[data-beat="5"]');
await sc5.getByRole("button", { name: "潜龙勿用", exact: true }).click();
const fb5 = await sc5.locator(".fb.bad").innerText();
await page.keyboard.press("ArrowRight");
rec("§7.3 拍 5 错答带解释仍锁定", fb5.length > 0 && (await beat()) === "5");
await sc5.getByRole("button", { name: "见龙在田", exact: true }).click();
await page.keyboard.press("ArrowRight");
rec("§7.3 拍 5 对答解锁 → 拍 6", (await beat()) === "6");

await page.keyboard.press("ArrowRight");
const blocked6 = (await beat()) === "6";
const sc6 = page.locator('.sc[data-beat="6"]');
await sc6.getByRole("button", { name: "概念", exact: true }).click();
const fb6bad = await sc6.locator(".fb.bad").innerText();
await sc6.getByRole("button", { name: "审题", exact: true }).click();
await page.keyboard.press("ArrowRight");
rec("§7.3 拍 6 gating、错答解释与解锁", blocked6 && fb6bad.length > 0 && (await beat()) === "7");

await page.keyboard.press("ArrowRight"); // →8
await page.keyboard.press("ArrowRight"); // →9
// §7.7 三错项各带具体错误文案(答案 52 取自规格 §5.2)
const sc9 = page.locator('.sc[data-beat="9"]');
const fbTexts = new Set();
for (const name of ["66", "42", "45"]) {
  await sc9.getByRole("button", { name, exact: true }).click();
  fbTexts.add(await sc9.locator(".fb").innerText());
}
rec("§7.7 拍 9 三错项各带具体错误文案", fbTexts.size === 3, [...fbTexts][0]?.slice(0, 30));
await sc9.getByRole("button", { name: "52", exact: true }).click();
await page.keyboard.press("ArrowRight");
rec("§7.3 拍 9 对答解锁 → 拍 10", (await beat()) === "10");

const in10 = page.locator('.sc[data-beat="10"] .numin-in');
await in10.fill("30");
await page.locator('.sc[data-beat="10"] .numin-go').click();
const badRetry = await in10.evaluate((e) => e.classList.contains("bad") && !e.disabled);
await in10.fill("40");
await page.locator('.sc[data-beat="10"] .numin-go').click();
await page.keyboard.press("ArrowRight");
rec("§7.3 拍 10 交错可重交、交对解锁", badRetry && (await beat()) === "11");

// ---- §7.10 问辩附页:→ 可达、?beat=N 直达、专属小标、提示词全文与真实输出说明在场 ----
await page.keyboard.press("ArrowRight");
const b12 = (await beat()) === "12";
await page.keyboard.press("ArrowRight");
const b13 = (await beat()) === "13";
await page.keyboard.press("ArrowRight");
rec("§7.10 附页 → 可达且末拍停住", b12 && b13 && (await beat()) === "13");
await gotoBeat(12);
const t12 = await page.locator(".sc.in").innerText();
await gotoBeat(13);
const t13 = await page.locator(".sc.in").innerText();
rec("§7.10 附页 ?beat=N 直达 + 专属小标 + 无段点亮",
  t12.includes("正式版流程") && (await smallMark()) === MARK_QA && JSON.stringify(await litSegs()) === "[]");
rec("§7.10 附页提示词全文与真实输出说明在场、无答词",
  t13.includes("提示词全文") && t13.includes("真实输出") && !/答词/.test(t13),
  /占位/.test(t13) ? "内容为占位(待 #43 真调)" : "");

// ---- §7.2 直达作答拍呈未作答态:选项在场,揭晓与反馈不在场 ----
await gotoBeat(5);
const fresh5 = !(await page.locator('.sc[data-beat="5"]').evaluate((e) => e.classList.contains("done")))
  && (await page.locator('.sc[data-beat="5"] .opt').first().isVisible())
  && (await page.locator('.sc[data-beat="5"] .opt.ok, .sc[data-beat="5"] .opt.bad').count()) === 0
  && (await page.locator('.sc[data-beat="5"] .fb.ok, .sc[data-beat="5"] .fb.bad').count()) === 0;
rec("§7.2 ?beat=5 直达呈未作答态(选项在场,揭晓与反馈不在场)", fresh5);

// ---- §7.9 硬件示意拍:如实句、两条归属清单、K10 小字 ----
await gotoBeat(2);
const t2 = await page.locator(".sc.in").innerText();
rec("§7.9 硬件示意拍(如实句+归属清单两项+K10 小字)",
  (await page.locator("#notebar").innerText()).includes("尚未实物制作")
  && t2.includes("将由李赫愃用 Mind+ 积木制作")
  && t2.includes("按键拍照并在板载屏显示题目")
  && t2.includes("A/B 键分别显示见龙在田、潜龙勿用")
  && t2.includes("行空板 K10"));

// ---- §7.12 解说词:默认隐藏、?notes=1 与 N 键唤出、逐拍换文案 ----
await gotoBeat(0);
const defaultHidden = !(await page.locator("#narr").isVisible());
await page.goto(`${BASE}?notes=1`);
await page.waitForLoadState("load");
const n1 = await page.locator("#narr-t").innerText();
const visN = await page.locator("#narr").isVisible();
await page.keyboard.press("ArrowRight");
const n2 = await page.locator("#narr-t").innerText();
await page.keyboard.press("n");
const hidN = !(await page.locator("#narr").isVisible());
await page.keyboard.press("n");
rec("§7.12 解说词默认隐藏,?notes=1 与 N 键唤出/隐藏、逐拍换文案",
  defaultHidden && visN && n1.length > 0 && n2 !== n1 && hidN && (await page.locator("#narr").isVisible()));

// ---- §7.14 舞台等比缩放 ----
let scaleOk = true;
for (const [w, h] of [[1600, 900], [2560, 1440], [1366, 768]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(200); // 等 resize → fit() 落定
  const v = parseFloat((await page.evaluate(() => document.getElementById("scaler").style.transform)).match(/[\d.]+/)[0]);
  const r = await page.locator("#stage").boundingBox();
  if (Math.abs(v - Math.min(w / 1920, h / 1080)) > 0.01 || r.width > w + 2 || r.height > h + 2) scaleOk = false;
}
await page.setViewportSize({ width: 1920, height: 1080 });
rec("§7.14 舞台等比缩放居中不裁切(1600×900 / 2560×1440 / 1366×768)", scaleOk);

// ---- §7.11 ?auto=1 自动演示(可选,约 3.5 分钟实走) ----
if (WITH_AUTO) {
  const t0 = Date.now();
  let b9Bad = false, b9Done = false, at13 = null;
  const preset = new Set();
  await page.goto(`${BASE}?auto=1`);
  await page.waitForLoadState("load");
  while (Date.now() - t0 < 300_000) {
    const b = +(await page.getAttribute("#stage", "data-beat"));
    if (b === 9) {
      // 拍 9 先错后纠正:错项 .bad 落定后常驻,不依赖轮询赶上瞬间
      if (await page.locator('.sc[data-beat="9"] .opt.bad').count()) b9Bad = true;
      if (await page.locator('.sc[data-beat="9"].done').count()) b9Done = true;
    }
    for (const gb of GATED)
      if (b === gb && (await page.locator(`.sc[data-beat="${gb}"].done .preset`).count())) preset.add(gb);
    if (b === NB - 1) {
      at13 ??= Date.now();
      if (Date.now() - at13 > 2000) break;
    }
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(10_000);
  const stayed = (await page.getAttribute("#stage", "data-beat")) === String(NB - 1);
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  rec("§7.11 自动演示全程走完(0→13 自停,预算 3–4 分钟)", stayed, `${secs}s`);
  rec("§7.11 作答拍带「预设演示」", preset.size === GATED.length, [...preset].sort().join(","));
  rec("§7.11 拍 9 含一次选错再纠正", b9Bad && b9Done);
}

// ---- §7.13 离线:file:// 下应零网络请求;托管路径只作记录不断言 ----
if (BASE.startsWith("file:")) {
  rec("§7.13 file:// 加载后零网络请求、零失败请求", net.length === 0 && failed.length === 0, net.slice(0, 3).join(","));
} else if (net.length) {
  console.log(`note  托管路径外部请求 ${net.length} 条(file:// 下应无):${net.slice(0, 3).map((u) => `\n      ${u}`)}`);
}

await browser.close();
const fails = results.filter((r) => !r.pass);
console.log(`\n== 检查单:${results.length - fails.length}/${results.length} 项通过  base=${BASE} ==`);
process.exit(fails.length ? 1 : 0);
