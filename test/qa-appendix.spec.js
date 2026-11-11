import { expect, test } from "@playwright/test";

const TENT_QA = "问辩备查 · 不在正式演示流程内";
const scene = (page, b) => page.locator(`.sc[data-beat="${b}"]`);
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const beat = async (page) =>
  +(await page.locator("#stage").getAttribute("data-beat"));

// 问辩附页(#47):招式速查卡之后的两拍普通拍,导轨外(seg:null)。只摆事实道具
// 帮李赫愃讲,不替她编——不写答词。常驻小标「问辩备查 · 不在正式演示流程内」。
// 拍 12 道具一「正式版流程图」:与拍 8 同一条正式版管线,标「正式版流程 · 尚未实现」。

test("拍 12 直达:正式版流程图道具在场,四节点管线与输入输出形状齐全", async ({
  page,
}) => {
  await page.goto("/?beat=12");
  const sc = scene(page, 12);
  await expect(sc).toHaveClass(/in/);

  await expect(sc).toContainText("问辩附页");
  await expect(sc).toContainText("正式版流程图");
  await expect(sc.getByText("正式版流程 · 尚未实现")).toBeVisible();

  const nodes = sc.locator(".fl-n");
  await expect(nodes).toHaveCount(4);
  await expect(nodes.locator(".fl-t")).toHaveText([
    "行空板拍照",
    "题目文本",
    "大模型 API",
    "掌名 + 错因",
  ]);
  await expect(nodes.nth(0)).toContainText("将由李赫愃用 Mind+ 制作");
  await expect(sc).toContainText("题面 + 已立掌名单");
  await expect(sc).toContainText("掌名 + 错因 + 要点");
  await expect(sc).toContainText("计划接入 DeepSeek 等国产大模型 API");

  await expect(page.getByText(TENT_QA)).toBeVisible();
  await expect(page.locator(".rail li.on")).toHaveCount(0);
  for (const s of [0, 1, 2, 3, 4, 5]) {
    await expect(segLi(page, s)).toHaveClass(/past/);
  }
});

test("拍 11 → 拍 12:速查卡后按 → 自然走进问辩附页", async ({ page }) => {
  await page.goto("/?beat=11");
  await page.keyboard.press("ArrowRight");

  expect(await beat(page)).toBe(12);
  await expect(scene(page, 12)).toHaveClass(/in/);
  await expect(page.getByText(TENT_QA)).toBeVisible();
});

// 拍 13 道具二三「提示词全文」「DeepSeek 真实输出 · 演示时预置播放」说明:
// 两格先放占位,标「占位 · 待换真实输出」,#43 真调冻结后换入库原文引用。

test("拍 13 直达:提示词全文与真实输出说明两格在场,均标占位待换", async ({
  page,
}) => {
  await page.goto("/?beat=13");
  const sc = scene(page, 13);
  await expect(sc).toHaveClass(/in/);
  await expect(sc).toContainText("问辩附页");

  const docs = sc.locator(".qa-doc");
  await expect(docs).toHaveCount(2);

  const prompt = docs.nth(0);
  await expect(prompt).toContainText("提示词全文");
  await expect(prompt).toContainText("占位 · 待换真实输出");
  await expect(prompt).toContainText("题面 + 已立掌名单");
  await expect(prompt).toContainText("掌名 + 错因 + 要点");

  const output = docs.nth(1);
  await expect(output).toContainText(
    "DeepSeek 真实输出 · 演示时预置播放",
  );
  await expect(output).toContainText("占位 · 待换真实输出");
  await expect(output).toContainText("演示现场不发请求");

  await expect(page.getByText(TENT_QA)).toBeVisible();
  await expect(page.locator(".rail li.on")).toHaveCount(0);
});

test("拍 12 → 拍 13:普通拍不作答,→ 照常推进,拍 13 为最后一拍", async ({
  page,
}) => {
  await page.goto("/?beat=12");
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(13);
  await expect(scene(page, 13)).toHaveClass(/in/);

  // 已是拍序末尾,再按 → 停在拍 13。
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(13);
});

test("问辩附页不写答词:两拍只摆事实道具,六段导轨不加段", async ({ page }) => {
  for (const b of [12, 13]) {
    await page.goto(`/?beat=${b}`);
    const sc = scene(page, b);
    await expect(sc).not.toContainText("答词");
    await expect(sc).not.toContainText("答：");
    await expect(sc).not.toContainText("问：");
    await expect(sc.locator(".opt, .numin-in")).toHaveCount(0);
  }

  // 导轨仍是六段,问辩附页未加段。
  await expect(page.locator(".rail li[data-seg]")).toHaveCount(6);
});
