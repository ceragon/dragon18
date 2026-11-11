import { expect, test } from "@playwright/test";

const scene = (page, b) => page.locator(`.sc[data-beat="${b}"]`);
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const cells = (page) => scene(page, 1).locator(".p18 i");

test.beforeEach(async ({ page }) => {
  await page.goto("/?beat=1");
});

test("段态：使命开场段点亮、片头卡已在身后、无段记 past", async ({ page }) => {
  await expect(segLi(page, 0)).toHaveClass(/on/);
  for (const s of [1, 2, 3, 4, 5]) {
    await expect(segLi(page, s)).not.toHaveClass(/on/);
    await expect(segLi(page, s)).not.toHaveClass(/past/);
  }
  await expect(scene(page, 0)).not.toHaveClass(/in/);
  await expect(scene(page, 1)).toHaveClass(/in/);
});

test("使命句：草稿占位文案在场，标「草稿 · 待确认」", async ({ page }) => {
  await expect(scene(page, 1).locator(".ms-line")).toBeVisible();
  await expect(scene(page, 1).getByText("草稿 · 待确认")).toBeVisible();
});

test("十八掌位：18 格全展示，两掌深蓝亮起、十六格虚线灰显待立", async ({
  page,
}) => {
  await expect(cells(page)).toHaveCount(18);
  await expect(scene(page, 1).locator(".p18 i.lit")).toHaveCount(2);
  await expect(cells(page).filter({ hasText: "见龙在田" })).toHaveCount(1);
  await expect(cells(page).filter({ hasText: "潜龙勿用" })).toHaveCount(1);

  const idle = cells(page).filter({ hasText: "待立" });
  await expect(idle).toHaveCount(16);
  await expect(idle.first()).toHaveCSS("border-top-style", "dashed");

  await expect(
    scene(page, 1).getByText("十八个掌位 · 两掌已立 · 其余十六位待立"),
  ).toBeVisible();
});

test("逐格落定：掌位格落定后全部可见", async ({ page }) => {
  for (const i of [0, 8, 17]) {
    await expect(cells(page).nth(i)).toHaveCSS("opacity", "1");
  }
});
