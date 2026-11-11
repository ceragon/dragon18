import { expect, test } from "@playwright/test";

const TENT = "招式体系暂定 · 孩子未确认 · 演示数据";
const scene = (page, b) => page.locator(`.sc[data-beat="${b}"]`);
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const beat = async (page) =>
  +(await page.locator("#stage").getAttribute("data-beat"));

// 拍 6 拆题·判断拍(#42):先讲「见题不等于拆题」,再判断错因四选一(审题/概念/计算/方法),
// 先作答再推进;答后揭晓错因=审题,并把演示错法 46 与正确 39 连线算式并排对比、高亮错步。
const opt = (page, name) =>
  scene(page, 6).getByRole("button", { name, exact: true });

test("拍 6 直达呈未作答态:「见题不等于拆题」说明在场、选项在场、揭晓与对比不在、gating 拦住前进键", async ({
  page,
}) => {
  await page.goto("/?beat=6");
  const sc = scene(page, 6);
  await expect(sc).toHaveClass(/in/);
  await expect(sc).not.toHaveClass(/done/);

  // 「见题不等于拆题」:见题看是哪一掌,拆题看错在哪。
  await expect(sc.getByText("见题不等于拆题")).toBeVisible();
  await expect(sc.locator(".neq")).toContainText("看是哪一掌");
  await expect(sc.locator(".neq")).toContainText("看错在哪");

  await expect(sc.locator(".opt")).toHaveCount(4);
  await expect(sc.locator(".rv")).not.toBeVisible();
  await expect(sc.locator(".cmp")).not.toBeVisible();
  await expect(page.getByText(TENT)).toBeVisible();
  await expect(segLi(page, 3)).toHaveClass(/on/);
  for (const s of [0, 1, 2]) await expect(segLi(page, s)).toHaveClass(/past/);

  for (const key of ["ArrowRight", " ", "PageDown"]) {
    await page.keyboard.press(key);
    expect(await beat(page)).toBe(6);
  }
});

test("拍 6:选项四枚「审题 / 概念 / 计算 / 方法」等长、正确位不固定", async ({
  page,
}) => {
  await page.goto("/?beat=6");
  const opts = scene(page, 6).locator(".opt");
  await expect(opts).toHaveCount(4);
  for (const name of ["审题", "概念", "计算", "方法"]) {
    await expect(opt(page, name)).toBeVisible();
  }

  const widths = await opts.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().width),
  );
  for (let i = 0; i + 1 < widths.length; i++) {
    expect(widths[i]).toBeCloseTo(widths[i + 1], 0);
  }

  await expect(opts.first()).not.toContainText("审题");
});

test("拍 6:先作答再推进——选错标错仍锁定可重选,答对后解锁进拍 7", async ({
  page,
}) => {
  await page.goto("/?beat=6");
  const sc = scene(page, 6);

  await opt(page, "计算").click();
  await expect(opt(page, "计算")).toHaveClass(/bad/);
  await expect(sc.locator(".fb")).toContainText("不是计算错");
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(6);
  await expect(sc.locator(".rv")).not.toBeVisible();

  await opt(page, "审题").click();
  await expect(opt(page, "审题")).toHaveClass(/ok/);
  await expect(sc.locator(".rv")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(7);
});

test("拍 6:三个错项各自带出对应的排除解释", async ({ page }) => {
  await page.goto("/?beat=6");
  const sc = scene(page, 6);

  await opt(page, "概念").click();
  await expect(sc.locator(".fb")).toContainText("不是概念错");
  await opt(page, "方法").click();
  await expect(sc.locator(".fb")).toContainText("不是方法错");
  await opt(page, "计算").click();
  await expect(sc.locator(".fb")).toContainText("不是计算错");
});

test("拍 6 答后揭晓:错因=审题并解释——写明的条件没按写明的进式子", async ({
  page,
}) => {
  await page.goto("/?beat=6");
  const sc = scene(page, 6);
  await opt(page, "审题").click();

  const rv = sc.locator(".rv");
  await expect(rv.locator(".rv-h")).toContainText("错因");
  await expect(rv.locator(".rv-h")).toContainText("审题");
  await expect(rv).toContainText("只适用超 10 千米");
  await expect(rv).toContainText("全部超 3 千米的 12 千米");
  await expect(page.getByText(TENT)).toBeVisible();
  await expect(segLi(page, 3)).toHaveClass(/on/);
});

test("拍 6:39 与 46 连线算式并排对比,高亮错的那一步", async ({ page }) => {
  await page.goto("/?beat=6");
  const sc = scene(page, 6);
  await opt(page, "审题").click();

  const cmp = sc.locator(".cmp");
  await expect(cmp).toBeVisible();

  const wrongEq = cmp.locator(".cmp-s.bad .eq");
  const rightEq = cmp.locator(".cmp-s.ok .eq");
  await expect(wrongEq).toContainText("10 + (15−3)×3 = 46");
  await expect(rightEq).toContainText("10 + (10−3)×2 + (15−10)×3 = 39");

  // 并排:左右两条算式同行不重叠。
  const wb = await wrongEq.boundingBox();
  const rb = await rightEq.boundingBox();
  expect(Math.abs(wb.y - rb.y)).toBeLessThan(20);
  expect(wb.x + wb.width).toBeLessThanOrEqual(rb.x + 1);

  // 高亮错的那一步:(15−3)×3 标出(伪元素挂「错在这一步」签),并注明把「共加收 3 元」
  // 用到了全部超 3 千米的 12 千米。
  const miss = wrongEq.locator(".n.miss");
  await expect(miss).toHaveCount(1);
  await expect(miss).toContainText("(15−3)×3");
  await expect(miss).toHaveCSS("border-color", "rgb(239, 91, 63)");
  await expect(
    cmp.getByText("把「共加收 3 元」用到了全部超 3 千米的 12 千米"),
  ).toBeVisible();
});
