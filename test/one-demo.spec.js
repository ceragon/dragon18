import { expect, test } from "@playwright/test";

function visibleText(page, text, options) {
  return page.getByText(text, options).filter({ visible: true });
}

function visibleRole(page, role, options) {
  return page.getByRole(role, options).filter({ visible: true });
}

test("一次演示从硬件示意走到一错破一类后即止", async ({ page }) => {
  await page.goto("/");

  await expect(visibleRole(page, "heading", { level: 1, name: "硬件示意" })).toBeVisible();
  await expect(visibleRole(page, "figure", { name: "行空板" })).toBeVisible();
  await expect(visibleText(page, "行空板", { exact: true })).toBeVisible();
  await expect(
    visibleText(page, "行空板将来负责拍照，并在板载屏上显示这道题。"),
  ).toBeVisible();
  await expect(visibleRole(page, "button", { name: "下一屏" })).toBeEnabled();
  await expect(visibleText(page, "见龙在田")).toHaveCount(0);
  await expect(visibleText(page, "潜龙勿用")).toHaveCount(0);
  await expect(visibleText(page, "144")).toHaveCount(0);
  await expect(visibleText(page, "140")).toHaveCount(0);
  await expect(visibleText(page, "训练题")).toHaveCount(0);
  await expect(visibleText(page, "接线")).toHaveCount(0);
  await expect(visibleText(page, "上一屏")).toHaveCount(0);
  await expect(visibleText(page, "再看一次")).toHaveCount(0);
  await expect(visibleText(page, "错题列表")).toHaveCount(0);

  await visibleRole(page, "button", { name: "下一屏" }).click();

  await expect(visibleRole(page, "heading", { level: 1, name: "演示题" })).toBeVisible();
  await expect(visibleText(page, "演示数据", { exact: true })).toBeVisible();
  await expect(
    visibleText(
      page,
      "一件上衣标价 200 元。商店先按标价打八折，再降价 20 元出售。售价是多少元？",
    ),
  ).toBeVisible();
  await expect(
    visibleText(page, "学生的错法是先降价再打折，答成 (200−20)×0.8 = 144 元。"),
  ).toBeVisible();
  await expect(visibleText(page, "140")).toHaveCount(0);
  await expect(visibleText(page, "见龙在田")).toHaveCount(0);
  await expect(visibleText(page, "上一屏")).toHaveCount(0);
  await expect(visibleText(page, "再看一次")).toHaveCount(0);
  await expect(visibleRole(page, "button", { name: "下一屏" })).toBeEnabled();

  await visibleRole(page, "button", { name: "下一屏" }).click();

  await expect(visibleRole(page, "heading", { level: 1, name: "见题拆题" })).toBeVisible();
  await expect(visibleText(page, "演示数据", { exact: true })).toBeVisible();
  await expect(visibleText(page, "掌名是见龙在田")).toBeVisible();
  await expect(visibleText(page, "先打八折，再降价 20 元")).toBeVisible();
  await expect(visibleText(page, "144 元的每一步乘法都对，但顺序反了")).toBeVisible();
  await expect(
    visibleText(page, "先 200×0.8 = 160，再 160−20 = 140，售价是 140 元。"),
  ).toBeVisible();
  await expect(visibleText(page, "潜龙勿用")).toHaveCount(0);
  await expect(visibleText(page, "提示词")).toHaveCount(0);
  await expect(visibleText(page, "模型")).toHaveCount(0);
  await expect(visibleText(page, "上一屏")).toHaveCount(0);
  await expect(visibleText(page, "再看一次")).toHaveCount(0);
  await expect(visibleRole(page, "button", { name: "下一屏" })).toBeEnabled();

  await visibleRole(page, "button", { name: "下一屏" }).click();

  await expect(visibleRole(page, "heading", { level: 1, name: "一错破一类" })).toBeVisible();
  await expect(visibleText(page, "演示数据", { exact: true })).toBeVisible();
  await expect(
    visibleText(page, "一双鞋标价 250 元。商店先按标价打八折，再降价 40 元。售价是多少元？"),
  ).toBeVisible();
  await expect(visibleText(page, "正确答案是 160 元。")).toBeVisible();
  await expect(
    visibleText(page, "一根绳子长 50 米。先用去它的一半，再用去 6 米。还剩多少米？"),
  ).toBeVisible();
  await expect(visibleText(page, "正确答案是 19 米。")).toBeVisible();
  await expect(visibleText(page, "下一屏")).toHaveCount(0);
  await expect(visibleText(page, "上一屏")).toHaveCount(0);
  await expect(visibleText(page, "再看一次")).toHaveCount(0);
  await expect(visibleText(page, "错题列表")).toHaveCount(0);
  await expect(visibleText(page, "潜龙勿用")).toHaveCount(0);
  await expect(visibleRole(page, "button")).toHaveCount(0);
  await expect(visibleRole(page, "link")).toHaveCount(0);

  await page.reload();
  await expect(visibleRole(page, "heading", { level: 1, name: "硬件示意" })).toBeVisible();
  await expect(visibleRole(page, "heading", { level: 1, name: "一错破一类" })).toHaveCount(0);
});
