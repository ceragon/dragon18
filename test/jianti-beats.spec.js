import { expect, test } from "@playwright/test";

const TENT = "招式体系暂定 · 孩子未确认 · 演示数据";
const scene = (page, b) => page.locator(`.sc[data-beat="${b}"]`);
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const beat = async (page) =>
  +(await page.locator("#stage").getAttribute("data-beat"));

// 拍 4 呈现拍(#41):出租车分段计费题面拆条件片落位 + 演示错法连线算式 + 完整十八掌位。
test("拍 4:题面原文在场,角标「演示数据」+ 小标「示意:行空板拍照采集」", async ({
  page,
}) => {
  await page.goto("/?beat=4");
  const sc = scene(page, 4);
  await expect(sc).toHaveClass(/in/);

  const ptext = sc.locator(".ptext");
  await expect(ptext).toContainText("某市出租车收费标准");
  await expect(ptext).toContainText("3 千米以内（含 3 千米）收起步价 10 元");
  await expect(ptext).toContainText("超过 3 千米的部分，每千米加收 2 元");
  await expect(ptext).toContainText("也就是每千米共加收 3 元");
  await expect(ptext).toContainText("小李乘车 15 千米，应付多少元");

  await expect(
    sc.locator(".corner").getByText("演示数据", { exact: true }),
  ).toBeVisible();
  await expect(
    sc.getByText("示意：此题将来由行空板拍照采集"),
  ).toBeVisible();
});

test("拍 4:题面拆成条件片,逐个落位(延时严格递增、落定后全部可见)", async ({
  page,
}) => {
  await page.goto("/?beat=4");
  const chips = scene(page, 4).locator(".chip");
  await expect(chips).toHaveCount(4);
  await expect(chips.nth(0)).toContainText("起步价 10 元");
  await expect(chips.nth(1)).toContainText("每千米加收 2 元");
  await expect(chips.nth(2)).toContainText("共加收 3 元");
  await expect(chips.nth(3)).toContainText("15 千米");

  const delays = await chips.evaluateAll((els) =>
    els.map((e) => parseFloat(getComputedStyle(e).transitionDelay)),
  );
  for (let i = 0; i + 1 < delays.length; i++) {
    expect(delays[i]).toBeLessThan(delays[i + 1]);
  }
  for (const c of await chips.all()) await expect(c).toHaveCSS("opacity", "1");
});

test("拍 4:演示错法块标「演示错法 · 演示数据」,连线算式逐步画出 46", async ({
  page,
}) => {
  await page.goto("/?beat=4");
  const wrong = scene(page, 4).locator(".wrong");
  await expect(wrong.getByText("演示错法 · 演示数据")).toBeVisible();

  // 连线算式:数字与连线连成同一行算式 10 + (15−3)×3 = 46。
  const eq = wrong.locator(".eq");
  await expect(eq).toContainText("10 + (15−3)×3 = 46");
  await expect(eq.locator(".n.end")).toContainText("46");

  // 逐步画出:连线伸展 + 数字弹出的延时严格递增;落定后全部可见。
  const delays = await eq
    .locator(".n,.ar")
    .evaluateAll((els) =>
      els.map((e) => parseFloat(e.style.getPropertyValue("--d"))),
    );
  for (let i = 0; i + 1 < delays.length; i++) {
    expect(delays[i]).toBeLessThan(delays[i + 1]);
  }
  for (const n of await eq.locator(".n").all()) {
    await expect(n).toHaveCSS("opacity", "1");
  }
});

test("拍 4:十八掌位完整展示段 + 底部引句 + 导轨段态 + 常驻小标", async ({
  page,
}) => {
  await page.goto("/?beat=4");
  const sc = scene(page, 4);

  const cells = sc.locator(".p18 i");
  await expect(cells).toHaveCount(18);
  await expect(sc.locator(".p18 i.lit")).toHaveCount(2);
  await expect(cells.filter({ hasText: "见龙在田" })).toHaveCount(1);
  await expect(cells.filter({ hasText: "潜龙勿用" })).toHaveCount(1);
  await expect(cells.filter({ hasText: "待立" })).toHaveCount(16);

  await expect(sc.getByText("先看这道题涉及哪一掌")).toBeVisible();

  await expect(segLi(page, 2)).toHaveClass(/on/);
  for (const s of [0, 1]) await expect(segLi(page, s)).toHaveClass(/past/);
  await expect(page.getByText(TENT)).toBeVisible();
});

// 拍 5 判断拍(#41):选项三枚等长、正确位不固定;先作答再推进,答后揭晓。
const opt = (page, name) =>
  scene(page, 5).getByRole("button", { name, exact: true });

test("拍 5 直达呈未作答态:选项在场、揭晓不在、gating 拦住前进键", async ({
  page,
}) => {
  await page.goto("/?beat=5");
  const sc = scene(page, 5);
  await expect(sc).toHaveClass(/in/);
  await expect(sc).not.toHaveClass(/done/);

  await expect(sc.locator(".opt")).toHaveCount(3);
  await expect(sc.locator(".rv")).not.toBeVisible();
  await expect(page.getByText(TENT)).toBeVisible();

  for (const key of ["ArrowRight", " ", "PageDown"]) {
    await page.keyboard.press(key);
    expect(await beat(page)).toBe(5);
  }
});

test("拍 5:选项三枚等长、正确答案不占固定首位(各拍正解位不同)", async ({ page }) => {
  await page.goto("/?beat=5");
  const opts = scene(page, 5).locator(".opt");
  await expect(opts).toHaveCount(3);
  await expect(opt(page, "见龙在田")).toBeVisible();
  await expect(opt(page, "潜龙勿用")).toBeVisible();
  await expect(opt(page, "暂无对应的掌")).toBeVisible();

  const widths = await opts.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().width),
  );
  expect(widths[0]).toBeCloseTo(widths[1], 0);
  expect(widths[1]).toBeCloseTo(widths[2], 0);

  await expect(opts.first()).not.toContainText("见龙在田");
});

test("拍 5:先作答再推进——选错标错仍锁定,答对揭晓后解锁", async ({ page }) => {
  await page.goto("/?beat=5");
  const sc = scene(page, 5);

  await opt(page, "潜龙勿用").click();
  await expect(opt(page, "潜龙勿用")).toHaveClass(/bad/);
  await expect(sc.locator(".fb")).toContainText("潜龙勿用");
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(5);
  await expect(sc.locator(".rv")).not.toBeVisible();

  await opt(page, "见龙在田").click();
  await expect(opt(page, "见龙在田")).toHaveClass(/ok/);
  await expect(sc.locator(".rv")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(6);
});

test("拍 5 答后揭晓:本次重点=见龙在田 + 判断依据 + 逐项解释;不打把握度", async ({
  page,
}) => {
  await page.goto("/?beat=5");
  const sc = scene(page, 5);
  await opt(page, "见龙在田").click();

  const rv = sc.locator(".rv");
  await expect(rv).toContainText("本次重点");
  await expect(rv.locator(".rv-h")).toContainText("见龙在田");
  await expect(rv).toContainText("判断依据");
  await expect(rv).toContainText("题面写明的条件，按写明的顺序展开");
  await expect(rv.locator(".rv-per li")).toHaveCount(3);
  await expect(rv).toContainText("潜龙勿用");
  await expect(rv).toContainText("暂无对应的掌");

  // 掌位:见龙在田格点亮为本次重点;「也涉及」主线不触发。
  await expect(sc.locator(".p18 i.focus")).toContainText("见龙在田");
  await expect(sc.locator(".p18 i.focus")).toContainText("本次重点");
  await expect(sc.getByText("也涉及")).toHaveCount(0);
  await expect(sc.locator(".p18 i.linked")).toHaveCount(0);

  // 不打每掌把握度。
  await expect(sc.getByText(/把握度|\d+%/)).toHaveCount(0);
  await expect(page.getByText(TENT)).toBeVisible();
  await expect(segLi(page, 2)).toHaveClass(/on/);
});

test("拍 5 显示规则(主线不触发):「也涉及」与「暂无对应的掌→待立」已实现", async ({
  page,
}) => {
  await page.goto("/?beat=5");
  const sc = scene(page, 5);

  // 另有相关掌 → 该掌格标「也涉及」。
  await page.evaluate(() => {
    applyVerdict(
      { focus: "潜龙勿用", also: ["见龙在田"], none: false },
      document.querySelector('.sc[data-beat="5"]'),
    );
  });
  const alsoCell = sc.locator(".p18 i.also");
  await expect(alsoCell).toHaveCount(1);
  await expect(alsoCell).toContainText("见龙在田");
  await expect(alsoCell).toContainText("也涉及");
  await expect(sc.locator(".p18 i.focus")).toContainText("潜龙勿用");

  // 无掌适用 → 显示「暂无对应的掌」并关联一个灰色待立掌位。
  await page.evaluate(() => {
    applyVerdict(
      { focus: null, also: [], none: true },
      document.querySelector('.sc[data-beat="5"]'),
    );
  });
  await expect(sc.locator(".p18 i.also")).toHaveCount(0);
  const linked = sc.locator(".p18 i.linked");
  await expect(linked).toHaveCount(1);
  await expect(linked).toContainText("待立");
  await expect(linked).toContainText("暂无对应的掌");
});
