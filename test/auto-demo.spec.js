import { expect, test } from "@playwright/test";

// 自动演示备选(规格 §2):?auto=1 同拍序一遍自动走完,预算 3–4 分钟(非硬限);
// 作答拍由预设演示作答并标「预设演示」,引导练习拍含一次选错再纠正;
// 键盘任意输入可接管停止自动。测试用 page.clock 快转排程,断言落在 DOM 契约上;
// 各 runFor 秒数对应 index.html 的 AUTO_PLAN 时刻表,改节奏需同步。
const beat = async (page) =>
  +(await page.locator("#stage").getAttribute("data-beat"));
const scene = (page, b) => page.locator(`.sc[data-beat="${b}"]`);
const opt = (page, b, name) =>
  scene(page, b).getByRole("button", { name, exact: true });

test("?auto=1 全程无按键走完 14 拍,作答拍全部落定", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?auto=1");

  // 预算 3–4 分钟:快转超过预算上限,末拍前不再推进。
  await page.clock.runFor(260_000);
  expect(await beat(page)).toBe(13);

  for (const b of [5, 6, 9, 10]) {
    await expect(scene(page, b)).toHaveClass(/done/);
  }
});

test("?auto=1 作答拍自动作答并标「预设演示」", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?auto=1&beat=5");

  await page.clock.runFor(8_000);
  const sc = scene(page, 5);
  await expect(opt(page, 5, "见龙在田")).toHaveClass(/ok/);
  const fb = sc.locator(".fb");
  await expect(fb).toHaveClass(/ok/);
  await expect(fb).toContainText("预设演示");
});

test("「预设演示」标只在自动作答出现,手动点击不显示仍保留解释", async ({
  page,
}) => {
  await page.goto("/?beat=5");
  const sc = scene(page, 5);

  await opt(page, 5, "潜龙勿用").click();
  const fb = sc.locator(".fb");
  await expect(fb).toHaveClass(/bad/);
  await expect(fb).not.toContainText("预设演示");
  await expect(fb).toContainText("潜龙勿用");

  await opt(page, 5, "见龙在田").click();
  await expect(fb).toHaveClass(/ok/);
  await expect(fb).not.toContainText("预设演示");
  await expect(fb).toContainText("按写明的顺序展开");
});

test("?auto=1 引导练习拍含一次选错再纠正", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?auto=1&beat=9");
  const sc = scene(page, 9);

  // 先选错(66 = 同型错):错标与解释出现、未落定。
  await page.clock.runFor(9_000);
  await expect(opt(page, 9, "66")).toHaveClass(/bad/);
  await expect(sc.locator(".fb")).toContainText("再想想");
  await expect(sc).not.toHaveClass(/done/);

  // 再纠正为 52:落定揭晓,反馈仍标「预设演示」。
  await page.clock.runFor(10_000);
  await expect(opt(page, 9, "52")).toHaveClass(/ok/);
  await expect(sc).toHaveClass(/done/);
  await expect(sc.locator(".fb")).toContainText("预设演示");
});

test("键盘任意输入可接管停止自动,手动键盘契约照旧", async ({ page }) => {
  await page.clock.install();
  await page.goto("/?auto=1");

  // 片头卡过后自动进入拍 1。
  await page.clock.runFor(6_000);
  expect(await beat(page)).toBe(1);

  // 非导航键也接管:之后即使快转超过整段预算,拍号不再自动前进。
  await page.keyboard.press("a");
  await page.clock.runFor(300_000);
  expect(await beat(page)).toBe(1);

  // 接管后键盘契约照旧。
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(2);
});

test("?auto=1 独立解题拍自动填数提交,反馈展示算式并标「预设演示」", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?auto=1&beat=10");
  const sc = scene(page, 10);

  await page.clock.runFor(8_000);
  await expect(sc.locator(".numin-in")).toHaveValue("40");
  await expect(sc.locator(".numin-in")).toBeDisabled();
  await expect(sc.locator(".fb")).toHaveClass(/ok/);
  await expect(sc.locator(".fb")).toContainText("预设演示");
  await expect(sc.locator(".rv")).toContainText("x = 40");
});
