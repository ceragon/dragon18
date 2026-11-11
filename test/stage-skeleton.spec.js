import { expect, test } from "@playwright/test";

const TENT = "招式体系暂定 · 孩子未确认 · 演示数据";
const TENT_QA = "问辩备查 · 不在正式演示流程内";

const stage = (page) => page.locator("#stage");
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const beat = async (page) => +(await stage(page).getAttribute("data-beat"));

test("片头卡：五要素在场、六段不点亮、常驻小标可见、舞台内无控件", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("见题拆题之降题十八掌")).toBeVisible();
  await expect(page.getByText("李赫愃·海淀实验")).toBeVisible();
  await expect(page.getByText("演示数据 · 预置回复 · 硬件示意")).toBeVisible();
  await expect(
    page.getByText("演示 Demo 由家长协助制作，参赛程序由李赫愃本人编写"),
  ).toBeVisible();

  await expect(page.getByText(TENT)).toBeVisible();
  await expect(page.locator(".rail li.on")).toHaveCount(0);
  await expect(page.locator(".rail li.past")).toHaveCount(0);

  // 舞台内仍无控件;视口层翻拍钮(#53)在 #stage 外、非 record 常驻。
  await expect(stage(page).getByRole("button")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /上一拍/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /下一拍/ })).toBeVisible();
  await expect(page.getByRole("link")).toHaveCount(0);
});

test("键盘契约：→ / 空格 / PageDown 前进、← 回退、点空白不推进", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(1);
  await page.keyboard.press(" ");
  expect(await beat(page)).toBe(2);
  await page.keyboard.press("PageDown");
  expect(await beat(page)).toBe(3);
  await page.keyboard.press("ArrowLeft");
  expect(await beat(page)).toBe(2);

  await page.mouse.click(900, 360);
  expect(await beat(page)).toBe(2);
  // (640,600) 是舞台主区空白——注意 (80,600) 已落在导轨热区上会跳段(#53),不能当空白点。
  await page.mouse.click(640, 600);
  expect(await beat(page)).toBe(2);

  await page.keyboard.press("ArrowRight");
  expect(new URL(page.url()).searchParams.get("beat")).toBe("3");
});

test("?beat=N 直达：导轨当前段点亮、已过段记 past", async ({ page }) => {
  await page.goto("/?beat=7");

  expect(await beat(page)).toBe(7);
  await expect(segLi(page, 3)).toHaveClass(/on/);
  for (const s of [0, 1, 2]) await expect(segLi(page, s)).toHaveClass(/past/);
  for (const s of [4, 5]) {
    await expect(segLi(page, s)).not.toHaveClass(/on/);
    await expect(segLi(page, s)).not.toHaveClass(/past/);
  }
  await expect(page.getByText(TENT)).toBeVisible();
});

test("常驻小标：普通拍每拍可见，问辩附页换专属小标且无段点亮", async ({ page }) => {
  for (const b of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    await page.goto(`/?beat=${b}`);
    await expect(page.getByText(TENT)).toBeVisible();
    await expect(page.getByText(TENT_QA)).toHaveCount(0);
  }

  for (const b of [12, 13]) {
    await page.goto(`/?beat=${b}`);
    await expect(page.getByText(TENT_QA)).toBeVisible();
    await expect(page.locator(".rail li.on")).toHaveCount(0);
  }
});

test("舞台等比缩放：非 1920×1080 视口居中不裁切", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 700 });
  await page.goto("/");

  const s = 700 / 1080;
  const box = await page.locator("#scaler").boundingBox();
  expect(box.width).toBeCloseTo(1920 * s, 0);
  expect(box.height).toBeCloseTo(1080 * s, 0);
  expect(box.x).toBeCloseTo((1600 - 1920 * s) / 2, 0);
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(1601);
  expect(box.y + box.height).toBeLessThanOrEqual(701);

  const rail = await page.locator(".rail").boundingBox();
  expect(rail.x).toBeGreaterThanOrEqual(-1);
});

test("record=1 参数保留：指针不进画面，翻拍钮不渲染、导轨点击关闭", async ({ page }) => {
  await page.goto("/?record=1");

  await expect(stage(page)).toHaveAttribute("data-record", "1");
  const cursor = await stage(page).evaluate((el) => getComputedStyle(el).cursor);
  expect(cursor).toBe("none");

  // #53:record 下视口导航全关——钮不渲染,点导轨不跳段。
  await expect(page.getByRole("button")).toHaveCount(0);
  const seg3 = await segLi(page, 3).boundingBox();
  await page.mouse.click(seg3.x + seg3.width / 2, seg3.y + seg3.height / 2);
  expect(await beat(page)).toBe(0);
});
