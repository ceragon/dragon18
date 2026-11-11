import { expect, test } from "@playwright/test";

const TENT = "招式体系暂定 · 孩子未确认 · 演示数据";
const scene = (page, b) => page.locator(`.sc[data-beat="${b}"]`);
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const beat = async (page) =>
  +(await page.locator("#stage").getAttribute("data-beat"));
const flipTransform = (flip) =>
  flip.evaluate((e) => getComputedStyle(e).transform);

// 拍 11 招式速查卡(#46):一次演示的收尾拍——翻面动效(3D rotateY)后定格,
// 只出本次所教那一掌的完整卡:掌名见龙在田、判断依据「题面写明的条件,按写明的
// 顺序展开」、破解思路、本次易错点(把「共加收 3 元」用到了全部超 3 千米的
// 12 千米);知识点小标签「分段计费」,卡标「草稿 · 待确认」。
// 潜龙勿用只作简短提示,待立掌位不出卡;定格收尾,无片尾卡。

test("拍 11 直达:卡面四要素在场 + 知识点标签 + 草稿标,招式速查卡段点亮", async ({
  page,
}) => {
  await page.goto("/?beat=11");
  const sc = scene(page, 11);
  await expect(sc).toHaveClass(/in/);

  const front = sc.locator(".qc-front");
  await expect(front.locator(".qc-name")).toHaveText("见龙在田");

  const items = front.locator(".qc-cols dl");
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText("判断依据");
  await expect(items.nth(0)).toContainText(
    "题面写明的条件，按写明的顺序展开",
  );
  await expect(items.nth(1)).toContainText("破解思路");
  await expect(items.nth(1)).toContainText("写成一步");
  await expect(items.nth(2)).toContainText("本次易错点");
  await expect(items.nth(2)).toContainText("共加收 3 元");
  await expect(items.nth(2)).toContainText("12 千米");

  await expect(front.getByText("分段计费", { exact: true })).toBeVisible();
  await expect(
    front.getByText("草稿 · 待确认", { exact: true }),
  ).toBeVisible();

  await expect(page.getByText(TENT)).toBeVisible();
  await expect(segLi(page, 5)).toHaveClass(/on/);
  for (const s of [0, 1, 2, 3, 4]) await expect(segLi(page, s)).toHaveClass(/past/);
});

test("拍 11:翻面动效为 3D rotateY——背面「掌」翻向正面后定格", async ({
  page,
}) => {
  // 从拍 12 回看:景未入场,卡停在背面朝上(rotateY(180deg) → matrix3d 非恒等)。
  await page.goto("/?beat=12");
  const flip = scene(page, 11).locator(".qc-flip");
  await expect(flip).toHaveCSS("transform-style", "preserve-3d");
  const faces = scene(page, 11).locator(".qc-face");
  await expect(faces).toHaveCount(2);
  for (const f of await faces.all()) {
    await expect(f).toHaveCSS("backface-visibility", "hidden");
  }
  await expect(scene(page, 11).locator(".qc-back")).toHaveText("掌");
  expect(await flipTransform(flip)).toMatch(/^matrix3d/);

  // 回退进拍 11:翻面落定后正面朝上(rotateY(0) → 恒等变换)。
  await page.keyboard.press("ArrowLeft");
  expect(await beat(page)).toBe(11);
  await expect
    .poll(() => flipTransform(flip))
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

  // 再离开:卡翻回背面朝上。
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(12);
  await expect.poll(() => flipTransform(flip)).toMatch(/^matrix3d/);
});

test("拍 11:只出见龙在田一卡——潜龙勿用只作简短提示,待立掌位不出卡", async ({
  page,
}) => {
  await page.goto("/?beat=11");
  const sc = scene(page, 11);

  await expect(sc.locator(".qc-flip")).toHaveCount(1);
  await expect(sc.locator(".qc-front")).toHaveCount(1);

  // 潜龙勿用:卡面不进内容,只在卡下一行简短提示。
  await expect(sc.locator(".qc-front")).not.toContainText("潜龙勿用");
  const hint = sc.locator(".qc-line");
  await expect(hint).toContainText("潜龙勿用");
  await expect(hint).toContainText("待立");
});

test("拍 11 定格收尾:无片尾卡,前进只走进导轨外的问辩附页", async ({ page }) => {
  await page.goto("/?beat=11");

  // 无片尾内容:整台无「片尾」字样;速查卡的下一景直接是导轨外的问辩附页,
  // 拍序未在两者之间加收尾拍。
  await expect(page.locator("#stage").getByText("片尾")).toHaveCount(0);
  await expect(scene(page, 12)).toContainText("问辩附页");

  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(12);
  // 问辩附页在导轨外:无段点亮,六段全过(拍 11 是最后一个点亮段)。
  for (const s of [0, 1, 2, 3, 4, 5]) {
    await expect(segLi(page, s)).not.toHaveClass(/on/);
    await expect(segLi(page, s)).toHaveClass(/past/);
  }
});

test("拍 10 答对后 → 进拍 11,招式速查卡段点亮", async ({ page }) => {
  await page.goto("/?beat=10");
  const sc = scene(page, 10);
  await sc.locator(".numin-in").fill("40");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowRight");

  expect(await beat(page)).toBe(11);
  await expect(scene(page, 11)).toHaveClass(/in/);
  await expect(segLi(page, 5)).toHaveClass(/on/);
});
