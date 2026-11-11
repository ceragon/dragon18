import { expect, test } from "@playwright/test";

// 解说词草稿(规格 §2,#49):每拍数据里嵌一段给孩子口播的草稿,标「草稿 · 待确认」,
// 默认隐藏不进画面;?notes=1 起手唤出,或按 N 唤出 / 隐藏当前拍解说词。
const narr = (page) => page.locator("#narr");
const narrT = (page) => page.locator("#narr-t");

test("默认隐藏:解说词不进画面(无参数与各拍直达均不可见)", async ({ page }) => {
  await page.goto("/");
  await expect(narr(page)).toBeHidden();
  await page.goto("/?beat=5");
  await expect(narr(page)).toBeHidden();
});

test("每拍有解说词槽位:?notes=1 逐拍可见、带草稿标、文案非空", async ({
  page,
}) => {
  for (let b = 0; b < 14; b++) {
    await page.goto(`/?beat=${b}&notes=1`);
    await expect(narr(page)).toBeVisible();
    await expect(narr(page)).toContainText("草稿 · 待确认");
    await expect(narrT(page)).not.toBeEmpty();
  }
});

test("N 键唤出 / 隐藏当前拍解说词,唤出带草稿标与该拍文案", async ({ page }) => {
  await page.goto("/?beat=4");
  await expect(narr(page)).toBeHidden();

  await page.keyboard.press("n");
  await expect(narr(page)).toBeVisible();
  await expect(narr(page)).toContainText("草稿 · 待确认");
  await expect(narr(page)).toContainText("演示题");
  expect(new URL(page.url()).searchParams.get("notes")).toBe("1");

  await page.keyboard.press("N");
  await expect(narr(page)).toBeHidden();
  expect(new URL(page.url()).searchParams.get("notes")).toBeNull();
});

test("唤出状态下换拍,解说词跟随当前拍", async ({ page }) => {
  await page.goto("/?notes=1");
  await expect(narrT(page)).toContainText("李赫愃");

  await page.keyboard.press("ArrowRight");
  await expect(narr(page)).toBeVisible();
  await expect(narrT(page)).toContainText("掌位");
});
