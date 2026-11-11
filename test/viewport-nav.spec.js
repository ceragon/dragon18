import { expect, test } from "@playwright/test";

// 视口翻拍钮与可点导轨(#53,规格 §2):非 record 全设备常驻右下「‹ 上一拍」「下一拍 ›」,
// 导轨整列按触点 Y 吸附最近段跳该段第一拍;禁用态、作答拍 gating、自动演示接管
// 全与键盘 step 同一条路径。
const stage = (page) => page.locator("#stage");
const beat = async (page) => +(await stage(page).getAttribute("data-beat"));
const prev = (page) => page.getByRole("button", { name: /上一拍/ });
const next = (page) => page.getByRole("button", { name: /下一拍/ });
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
// 段首拍:使命开场 1、硬件示意 2、见题 4、拆题 6、练习 9、招式速查卡 11。
const clickSeg = async (page, s) => {
  const box = await segLi(page, s).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};

test("翻拍钮:逐拍推进与回退,片头卡「上一拍」禁用", async ({ page }) => {
  await page.goto("/");
  await expect(prev(page)).toBeVisible();
  await expect(next(page)).toBeVisible();
  await expect(prev(page)).toBeDisabled();
  await expect(next(page)).toBeEnabled();

  await next(page).click();
  expect(await beat(page)).toBe(1);
  await next(page).click();
  expect(await beat(page)).toBe(2);
  await expect(prev(page)).toBeEnabled();
  await prev(page).click();
  expect(await beat(page)).toBe(1);
});

test("翻拍钮:作答拍未答「下一拍」禁用,答对落定后恢复", async ({ page }) => {
  await page.goto("/?beat=5");
  await expect(next(page)).toBeDisabled();

  await page
    .locator('.sc[data-beat="5"]')
    .getByRole("button", { name: "见龙在田", exact: true })
    .click();
  await expect(next(page)).toBeEnabled();
  await next(page).click();
  expect(await beat(page)).toBe(6);
});

test("翻拍钮:末拍「下一拍」禁用,「上一拍」不受作答限制", async ({ page }) => {
  await page.goto("/?beat=13");
  await expect(next(page)).toBeDisabled();
  await expect(prev(page)).toBeEnabled();
  await prev(page).click();
  expect(await beat(page)).toBe(12);
});

test("导轨:点段跳该段第一拍,作答拍未答也能跳走", async ({ page }) => {
  await page.goto("/?beat=5"); // 见题作答拍,未答,gated
  await clickSeg(page, 3);
  expect(await beat(page)).toBe(6); // 拆题段首拍
  await clickSeg(page, 5);
  expect(await beat(page)).toBe(11); // 招式速查卡段首拍
});

test("导轨:整列热区——点段外的 logo 区按 Y 吸附最近段", async ({ page }) => {
  await page.goto("/");
  const rail = await page.locator(".rail").boundingBox();
  // 导轨最顶端 logo 区离第一段最近 → 跳使命开场首拍。
  await page.mouse.click(rail.x + rail.width / 2, rail.y + 24);
  expect(await beat(page)).toBe(1);
});
