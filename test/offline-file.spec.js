import { expect, test } from "@playwright/test";
import path from "node:path";
import { pathToFileURL } from "node:url";

// file:// 兜底路径(issue #50,规格 §1):同一份 demo/index.html 双击打开离线可用——
// 思源宋体(标题)/ 思源黑体(正文)子集内嵌,加载完成后零网络请求。
const DEMO = pathToFileURL(path.resolve("demo/index.html")).href;
const SERIF = "Source Han Serif SC";
const SANS = "Source Han Sans SC";

const stage = (page) => page.locator("#stage");

// 挂上请求统计再打开页面:除主页导航与 data: 内嵌外的任何取资源(网络或
// file:// 子资源)都记账,断言为零;失败请求另记一份,断言亦为空。
const watchNet = (page) => {
  const net = [];
  const failed = [];
  page.on("request", (r) => {
    if (!r.isNavigationRequest() && !r.url().startsWith("data:"))
      net.push(r.url());
  });
  page.on("requestfailed", (r) => failed.push(r.url()));
  return { net, failed };
};

test("file:// 打开:片头正常渲染,加载完成后零网络请求、零失败请求", async ({ page }) => {
  const { net, failed } = watchNet(page);
  await page.goto(DEMO);
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);

  await expect(page.getByText("见题拆题之降题十八掌")).toBeVisible();
  await expect(page.getByText("李赫愃·海淀实验")).toBeVisible();

  expect(net).toEqual([]);
  expect(failed).toEqual([]);
});

test("file:// 各拍正常:十四拍直达均可渲染、作答拍可作答、全程零网络请求", async ({ page }) => {
  const { net, failed } = watchNet(page);

  for (let b = 0; b <= 13; b++) {
    await page.goto(`${DEMO}?beat=${b}`);
    await expect(stage(page)).toHaveAttribute("data-beat", String(b));
    await expect(page.locator(".sc.in").first()).toBeVisible();
  }

  // 作答拍在 file:// 下照常作答:选项拍选定正解落定、数字拍交对答案落定。
  await page.goto(`${DEMO}?beat=5`);
  await page.locator(".opt").nth(1).click();
  await expect(page.locator(".sc.in")).toHaveClass(/done/);

  await page.goto(`${DEMO}?beat=10`);
  await page.locator(".numin-in").fill("40");
  await page.locator(".numin-go").click();
  await expect(page.locator(".sc.in")).toHaveClass(/done/);

  // 键盘推进与解说词草稿在 file:// 下照常工作。
  await page.goto(DEMO);
  await page.keyboard.press("ArrowRight");
  await expect(stage(page)).toHaveAttribute("data-beat", "1");
  await page.keyboard.press("n");
  await expect(page.locator("#narr")).toBeVisible();

  expect(net).toEqual([]);
  expect(failed).toEqual([]);
});

test("file:// 子集字体:两套内嵌面各按声明字重载入,字符集签名与页内全文本一致", async ({ page }) => {
  await page.goto(DEMO);

  const { faces, recorded, computed } = await page.evaluate(
    async ([serif, sans]) => {
      // load() 触发各声明字重的真实取字;data: 内嵌面不触网。
      await Promise.all([
        document.fonts.load(`900 96px "${serif}"`, "见题拆题"),
        document.fonts.load(`700 26px "${serif}"`, "见龙在田"),
        document.fonts.load(`400 16px "${sans}"`, "演示数据"),
        document.fonts.load(`600 16px "${sans}"`, "演示数据"),
        document.fonts.load(`700 16px "${sans}"`, "演示数据"),
        document.fonts.load(`900 16px "${sans}"`, "ABCD"),
      ]);
      await document.fonts.ready;

      // 与 scripts/embed-fonts.py 同式复算页内全字符集:剔除子集块的 DOM
      // 序列化 → 经 textarea(RCDATA:只解码实体、标签与注释照常)解码 →
      // 集字 ∪ ASCII 可印 → 排序串接 → UTF-8 FNV-1a。
      const m = document
        .querySelector("#font-subsets")
        .textContent.match(/charsig:([0-9a-f]+:\d+)/);
      const clone = document.documentElement.cloneNode(true);
      clone.querySelector("#font-subsets").remove();
      const ta = document.createElement("textarea");
      ta.innerHTML = clone.outerHTML;
      const chars = new Set(ta.value);
      for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));
      const sorted = [...chars].sort();
      let h = 2166136261;
      for (const b of new TextEncoder().encode(sorted.join("")))
        h = Math.imul(h ^ b, 16777619) >>> 0;
      return {
        faces: [...document.fonts].map((f) => ({
          family: f.family,
          weight: f.weight,
          status: f.status,
        })),
        recorded: m?.[1] ?? null,
        computed: `${h.toString(16).padStart(8, "0")}:${sorted.length}`,
      };
    },
    [SERIF, SANS],
  );

  const serif = faces.filter((f) => f.family === SERIF);
  const sans = faces.filter((f) => f.family === SANS);
  expect(serif.map((f) => f.weight).sort()).toEqual(["700", "900"]);
  expect(sans.map((f) => f.weight).sort()).toEqual(["400", "600", "700", "900"]);
  expect([...serif, ...sans].every((f) => f.status === "loaded")).toBe(true);

  // 签名不一致 = 文案改过但没重跑 scripts/embed-fonts.py —— 子集陈旧。
  // 隐藏解说词、占位文案与注脚用字都走同一字符集,签名一致即全部在子集内。
  expect(
    recorded,
    "charsig 与页内全文本不符:重跑 python3 scripts/embed-fonts.py",
  ).toBe(computed);
});
