import { expect, test } from "@playwright/test";

const TENT = "招式体系暂定 · 孩子未确认 · 演示数据";
const scene = (page, b) => page.locator(`.sc[data-beat="${b}"]`);
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const beat = async (page) =>
  +(await page.locator("#stage").getAttribute("data-beat"));

// 拍 7 演示回复块(#44):结构按规格 §5.4 的四要素槽位——掌名见龙在田、错因审题、
// 39 元算法、排除句(排除计算/概念/方法)。文字先放占位,标「占位 · 待换真实输出」,
// 由 #43「真调 DeepSeek 冻结演示回复」完成后换真并改标。
test("拍 7 直达:演示回复块落定,四要素槽位在场、占位标在、拆题段点亮", async ({
  page,
}) => {
  await page.goto("/?beat=7");
  const sc = scene(page, 7);
  await expect(sc).toHaveClass(/in/);

  const reply = sc.locator(".reply");
  await expect(reply).toBeVisible();
  await expect(reply.getByText("占位 · 待换真实输出")).toBeVisible();

  await expect(reply.locator(".rslot").nth(0)).toContainText("掌名");
  await expect(reply.locator(".rslot").nth(0)).toContainText("见龙在田");
  await expect(reply.locator(".rslot").nth(1)).toContainText("错因");
  await expect(reply.locator(".rslot").nth(1)).toContainText("审题");
  await expect(reply.locator(".rslot").nth(2)).toContainText(
    "10 + (10−3)×2 + (15−10)×3 = 39",
  );
  const excl = reply.locator(".rslot").nth(3);
  await expect(excl).toContainText("排除");
  await expect(excl).toContainText("不是计算错");
  await expect(excl).toContainText("不是概念错");
  await expect(excl).toContainText("不是方法错");

  await expect(page.getByText(TENT)).toBeVisible();
  await expect(segLi(page, 3)).toHaveClass(/on/);
  for (const s of [0, 1, 2]) await expect(segLi(page, s)).toHaveClass(/past/);
});

test("拍 7:拍 6 作答落定后 → 进拍 7,占位标仍在", async ({ page }) => {
  await page.goto("/?beat=6");
  await scene(page, 6)
    .getByRole("button", { name: "审题", exact: true })
    .click();
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(7);
  await expect(
    scene(page, 7).getByText("占位 · 待换真实输出"),
  ).toBeVisible();
});

// 拍 8 正式版流程示意拍(#44):四节点管线「行空板拍照 → 题目文本 → 大模型 API →
// 掌名 + 错因」。拍照节点标「将由李赫愃用 Mind+ 制作」,其余节点标「正式版软件部分」;
// 模型节点只展输入输出形状;文案「计划接入 DeepSeek 等国产大模型 API」不点死单一型号;
// 整拍标「正式版流程 · 尚未实现」;提示词全文不上这一拍。
test("拍 8 直达:四节点按序在场,拍照节点与软件节点归属标法各自正确", async ({
  page,
}) => {
  await page.goto("/?beat=8");
  const sc = scene(page, 8);
  await expect(sc).toHaveClass(/in/);

  const nodes = sc.locator(".fl-n");
  await expect(nodes).toHaveCount(4);
  await expect(nodes.nth(0)).toContainText("行空板拍照");
  await expect(nodes.nth(1)).toContainText("题目文本");
  await expect(nodes.nth(2)).toContainText("大模型 API");
  await expect(nodes.nth(3)).toContainText("掌名 + 错因");

  await expect(nodes.nth(0).getByText("将由李赫愃用 Mind+ 制作")).toBeVisible();
  for (const i of [1, 2, 3]) {
    await expect(nodes.nth(i).getByText("正式版软件部分")).toBeVisible();
  }

  // 管线按序排开:四节点同行、由左至右不重叠。
  const boxes = await nodes.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect()),
  );
  for (let i = 0; i + 1 < boxes.length; i++) {
    expect(Math.abs(boxes[i].y - boxes[i + 1].y)).toBeLessThan(20);
    expect(boxes[i].x + boxes[i].width).toBeLessThanOrEqual(
      boxes[i + 1].x + 40,
    );
  }
});

test("拍 8:模型节点只展形状——输入「题面 + 已立掌名单」→ 输出「掌名 + 错因 + 要点」", async ({
  page,
}) => {
  await page.goto("/?beat=8");
  const api = scene(page, 8).locator(".fl-n.api");
  await expect(api).toContainText("输入");
  await expect(api).toContainText("题面 + 已立掌名单");
  await expect(api).toContainText("输出");
  await expect(api).toContainText("掌名 + 错因 + 要点");
});

test("拍 8:文案「计划接入 DeepSeek 等国产大模型 API」、整拍标「正式版流程 · 尚未实现」", async ({
  page,
}) => {
  await page.goto("/?beat=8");
  const sc = scene(page, 8);
  await expect(
    sc.getByText("计划接入 DeepSeek 等国产大模型 API"),
  ).toBeVisible();
  await expect(sc.getByText("正式版流程 · 尚未实现")).toBeVisible();
  await expect(page.getByText(TENT)).toBeVisible();
  await expect(segLi(page, 3)).toHaveClass(/on/);
});

test("拍 8:提示词全文不上主流程拍", async ({ page }) => {
  await page.goto("/?beat=8");
  await expect(scene(page, 8).getByText(/提示词/)).toHaveCount(0);
});
