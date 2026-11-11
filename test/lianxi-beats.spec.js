import { expect, test } from "@playwright/test";

const TENT = "招式体系暂定 · 孩子未确认 · 演示数据";
const scene = (page, b) => page.locator(`.sc[data-beat="${b}"]`);
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const beat = async (page) =>
  +(await page.locator("#stage").getAttribute("data-beat"));

// 拍 9 引导练习(#45):阶梯水费题面(规格 §5.2 原文)+ 条件片;选项四枚
// 52 / 66 / 42 / 45(规格列出的集合;画面落位 66 / 42 / 45 / 52,正解在第 4 位,
// 与拍 5、拍 6 的正解位不同)等长、正确位不固定、选前留思考时间;先作答再推进,
// 提交后立即带解释反馈,三错项各自点出对应的具体错误;标「演示数据」。
const opt9 = (page, name) =>
  scene(page, 9).getByRole("button", { name, exact: true });

test("拍 9:题面原文在场 + 条件片逐个落位 + 角标「演示数据」", async ({
  page,
}) => {
  await page.goto("/?beat=9");
  const sc = scene(page, 9);
  await expect(sc).toHaveClass(/in/);

  const ptext = sc.locator(".ptext");
  await expect(ptext).toContainText("某市自来水收费");
  await expect(ptext).toContainText("3 吨以内（含 3 吨）收基本费 6 元");
  await expect(ptext).toContainText("超过 3 吨的部分每吨 3 元");
  await expect(ptext).toContainText("超过 10 吨的部分每吨 5 元");
  await expect(ptext).toContainText("小红家这个月用水 15 吨，应交水费多少元");

  const chips = sc.locator(".chip");
  await expect(chips).toHaveCount(4);
  await expect(chips.nth(0)).toContainText("基本费 6 元");
  await expect(chips.nth(1)).toContainText("每吨 3 元");
  await expect(chips.nth(2)).toContainText("每吨 5 元");
  await expect(chips.nth(3)).toContainText("15 吨");

  const delays = await chips.evaluateAll((els) =>
    els.map((e) => parseFloat(e.style.getPropertyValue("--d"))),
  );
  for (let i = 0; i + 1 < delays.length; i++) {
    expect(delays[i]).toBeLessThan(delays[i + 1]);
  }

  await expect(
    sc.locator(".corner").getByText("演示数据", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(TENT)).toBeVisible();
  await expect(segLi(page, 4)).toHaveClass(/on/);
  for (const s of [0, 1, 2, 3]) await expect(segLi(page, s)).toHaveClass(/past/);
});

test("拍 9 直达呈未作答态:选项在场、揭晓不在、gating 拦住前进键", async ({
  page,
}) => {
  await page.goto("/?beat=9");
  const sc = scene(page, 9);
  await expect(sc).toHaveClass(/in/);
  await expect(sc).not.toHaveClass(/done/);

  await expect(sc.locator(".opt")).toHaveCount(4);
  await expect(sc.locator(".rv")).not.toBeVisible();

  for (const key of ["ArrowRight", " ", "PageDown"]) {
    await page.keyboard.press(key);
    expect(await beat(page)).toBe(9);
  }
});

test("拍 9:选项四枚 52 / 66 / 42 / 45 等长、正确位不固定、选前留思考时间", async ({
  page,
}) => {
  await page.goto("/?beat=9");
  const sc = scene(page, 9);
  const opts = sc.locator(".opt");
  await expect(opts).toHaveCount(4);
  for (const name of ["52", "66", "42", "45"]) {
    await expect(opt9(page, name)).toBeVisible();
  }

  const widths = await opts.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().width),
  );
  for (let i = 0; i + 1 < widths.length; i++) {
    expect(widths[i]).toBeCloseTo(widths[i + 1], 0);
  }

  // 正确位不固定:52 不占首位,且不与拍 5(第 2 位)、拍 6(第 3 位)的正解位重复。
  const idx52 = await opts.evaluateAll((els) =>
    els.findIndex((e) => e.getAttribute("aria-label") === "52"),
  );
  expect(idx52).toBeGreaterThan(0);
  expect([1, 2]).not.toContain(idx52);

  // 选前留思考时间:选项落定晚于全部条件片。
  const optDelay = await sc
    .locator(".opts")
    .evaluate((e) => parseFloat(e.style.getPropertyValue("--d")));
  const chipMax = Math.max(
    ...(await sc
      .locator(".chip")
      .evaluateAll((els) =>
        els.map((e) => parseFloat(e.style.getPropertyValue("--d"))),
      )),
  );
  expect(optDelay).toBeGreaterThan(chipMax);
});

test("拍 9:先作答再推进——选错标错可重选,答对揭晓后解锁进拍 10", async ({
  page,
}) => {
  await page.goto("/?beat=9");
  const sc = scene(page, 9);

  await opt9(page, "66").click();
  await expect(opt9(page, "66")).toHaveClass(/bad/);
  await expect(sc.locator(".fb")).toHaveClass(/bad/);
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(9);
  await expect(sc.locator(".rv")).not.toBeVisible();

  await opt9(page, "52").click();
  await expect(opt9(page, "52")).toHaveClass(/ok/);
  await expect(sc.locator(".rv")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(10);
});

test("拍 9:三个错项各自带出对应的具体错误", async ({ page }) => {
  await page.goto("/?beat=9");
  const sc = scene(page, 9);

  // 66 = 6 + 12×5:全部超 3 吨按 5 元计(与演示题同型错)。
  await opt9(page, "66").click();
  await expect(sc.locator(".fb")).toContainText("6 + 12×5");
  await expect(sc.locator(".fb")).toContainText("5 元");
  // 42 = 6 + 12×3:全部超 3 吨按 3 元计。
  await opt9(page, "42").click();
  await expect(sc.locator(".fb")).toContainText("6 + 12×3");
  await expect(sc.locator(".fb")).toContainText("3 元");
  // 45 = 15×3:只认一档。
  await opt9(page, "45").click();
  await expect(sc.locator(".fb")).toContainText("15×3");
  await expect(sc.locator(".fb")).toContainText("只认一档");
});

test("拍 9 答对揭晓:52 元正确算法连线算式", async ({ page }) => {
  await page.goto("/?beat=9");
  const sc = scene(page, 9);
  await opt9(page, "52").click();

  const rv = sc.locator(".rv");
  await expect(rv).toBeVisible();
  await expect(rv).toContainText("52");
  await expect(rv.locator(".eq")).toContainText(
    "6 + (10−3)×3 + (15−10)×5 = 52",
  );
});

// 拍 10 独立解题(#45):补角余角题面(规格 §5.3 原文),无选项、不提示掌名,
// 输数字提交;反馈展示算式 180−x = 3(90−x)−10 → x = 40 与验算;
// 一次答对只核对本题,不称掌握;标「演示数据」。
test("拍 10 直达呈未作答态:题面 + 输入在场、无选项不提示掌名、揭晓不在、gating 拦住前进键", async ({
  page,
}) => {
  await page.goto("/?beat=10");
  const sc = scene(page, 10);
  await expect(sc).toHaveClass(/in/);
  await expect(sc).not.toHaveClass(/done/);

  await expect(sc.locator(".ptext")).toContainText(
    "一个角的补角，比它的余角的 3 倍小 10°。求这个角的度数。",
  );
  await expect(
    sc.locator(".corner").getByText("演示数据", { exact: true }),
  ).toBeVisible();

  await expect(sc.locator(".opt")).toHaveCount(0);
  await expect(sc.locator(".numin-in")).toBeVisible();
  await expect(sc.locator(".numin-in")).toBeEnabled();
  await expect(sc.locator(".numin-go")).toBeVisible();
  await expect(sc.getByText("见龙在田")).toHaveCount(0);
  await expect(sc.locator(".rv")).not.toBeVisible();

  await expect(page.getByText(TENT)).toBeVisible();
  await expect(segLi(page, 4)).toHaveClass(/on/);

  for (const key of ["ArrowRight", " ", "PageDown"]) {
    await page.keyboard.press(key);
    expect(await beat(page)).toBe(10);
  }
});

test("拍 10:交错数字仍锁定可重交,反馈带提示不泄答案", async ({ page }) => {
  await page.goto("/?beat=10");
  const sc = scene(page, 10);

  await sc.locator(".numin-in").fill("50");
  await sc.locator(".numin-go").click();
  await expect(sc.locator(".fb")).toHaveClass(/bad/);
  await expect(sc.locator(".fb")).toContainText("再想想");
  await expect(sc.locator(".rv")).not.toBeVisible();
  // 错答不揭晓算式,不给出 x = 40。
  await expect(sc.locator(".fb")).not.toContainText("40");
  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(10);

  // 空提交:不判定对错,只提示填数字,仍锁定。
  await sc.locator(".numin-in").fill("");
  await sc.locator(".numin-go").click();
  await expect(sc.locator(".fb")).toContainText("填一个数字");
  expect(await beat(page)).toBe(10);
});

test("拍 10:输入 40 回车提交,反馈展示算式与验算,只核对本题不称掌握,答后解锁", async ({
  page,
}) => {
  await page.goto("/?beat=10");
  const sc = scene(page, 10);

  await sc.locator(".numin-in").fill("40");
  await page.keyboard.press("Enter");

  await expect(sc.locator(".fb")).toHaveClass(/ok/);
  await expect(sc.locator(".numin-in")).toBeDisabled();
  await expect(sc.locator(".numin-go")).toBeDisabled();

  const rv = sc.locator(".rv");
  await expect(rv).toBeVisible();
  await expect(rv).toContainText("180−x = 3(90−x)−10 → x = 40");
  await expect(rv).toContainText("验算");
  await expect(rv).toContainText("补角 140°");
  await expect(rv).toContainText("余角 50°");
  await expect(rv).toContainText("3×50−10 = 140");
  await expect(rv).toContainText("不称掌握");

  await page.keyboard.press("ArrowRight");
  expect(await beat(page)).toBe(11);
});
