import { expect, test } from "@playwright/test";

const TENT = "招式体系暂定 · 孩子未确认 · 演示数据";
// 拍 3 是拍 2 的同屏续拍:同一景以 data-cover 兼作,故按 beat 或 cover 取景。
const scene = (page, b) =>
  page.locator(`.sc[data-beat="${b}"],.sc[data-cover~="${b}"]`);
const segLi = (page, s) => page.locator(`.rail li[data-seg="${s}"]`);
const svg = (page, b) => scene(page, b).locator(".k10");

// 硬件示意两拍(#40):同一屏两拍——拍 2 板轮廓+如实标注+归属清单,拍 3 续拍出现三条引出线。
for (const b of [2, 3]) {
  test(`拍 ${b} 硬件示意:如实说明条、常驻小标、两条归属清单在场`, async ({
    page,
  }) => {
    await page.goto(`/?beat=${b}`);
    const sc = scene(page, b);
    await expect(sc).toHaveClass(/in/);

    await expect(page.locator("#notebar")).toHaveText(
      "这是设计示意：行空板尚未实物制作",
    );
    await expect(page.locator("#tent")).toContainText("硬件示意");
    await expect(page.locator("#tent")).toContainText(TENT);

    await expect(
      sc.getByText("将由李赫愃用 Mind+ 积木制作"),
    ).toBeVisible();
    await expect(
      sc.getByText("按键拍照并在板载屏显示题目"),
    ).toBeVisible();
    await expect(
      sc.getByText("A/B 键分别显示见龙在田、潜龙勿用及她写的定义"),
    ).toBeVisible();

    await expect(segLi(page, 1)).toHaveClass(/on/);
    await expect(segLi(page, 0)).toHaveClass(/past/);
  });

  test(`拍 ${b} 硬件示意:简笔轮廓一眼看出是画的,屏幕无内容、掌名不上板`, async ({
    page,
  }) => {
    await page.goto(`/?beat=${b}`);
    const k10 = svg(page, b);

    // 简笔示意:板轮廓为虚线描边;图下小字标名。
    await expect(k10.locator(".bd")).toHaveCSS("stroke-dasharray", /[0-9]/);
    await expect(
      scene(page, b).getByText("行空板 K10"),
    ).toBeVisible();

    // 板载屏为空:屏幕区域内没有任何文字/图形内容。
    await expect(k10.locator(".scr")).toHaveCount(1);
    const inScreen = await k10.evaluate((el) => {
      const s = el.querySelector(".scr").getBBox();
      const hit = (n) => {
        const bb = n.getBBox();
        return (
          bb.x < s.x + s.width &&
          bb.x + bb.width > s.x &&
          bb.y < s.y + s.height &&
          bb.y + bb.height > s.y
        );
      };
      return [...el.querySelectorAll("text,image,foreignObject")].filter(hit)
        .length;
    });
    expect(inScreen).toBe(0);

    // 掌名不归类到板上(归属清单在板图外,故只在 svg 内断言)。
    await expect(k10.getByText("见龙在田")).toHaveCount(0);
    await expect(k10.getByText("潜龙勿用")).toHaveCount(0);
  });
}

test("拍 2:引出线尚未出现、部件未高亮;拍 3:三条引出线出现", async ({
  page,
}) => {
  await page.goto("/?beat=2");
  const cos2 = svg(page, 2).locator(".co");
  await expect(cos2).toHaveCount(3);
  for (const co of await cos2.all()) {
    await expect(co).toHaveCSS("opacity", "0");
  }
  await expect(svg(page, 2).locator(".hl .part").first()).toHaveCSS(
    "stroke",
    "rgb(107, 115, 133)",
  );

  await page.goto("/?beat=3");
  const cos = svg(page, 3).locator(".co");
  await expect(cos).toHaveCount(3);
  await expect(cos.nth(0)).toContainText("摄像头");
  await expect(cos.nth(0)).toContainText("将来拍错题");
  await expect(cos.nth(1)).toContainText("A/B 键");
  await expect(cos.nth(1)).toContainText("将来按出掌名和定义");
  await expect(cos.nth(2)).toContainText("板载屏");
  await expect(cos.nth(2)).toContainText("将来显示题目·掌名");
});

test("拍 3:摄像头→A/B 键→板载屏依次高亮,动效只做高亮", async ({ page }) => {
  await page.goto("/?beat=3");
  const sc = scene(page, 3);
  await expect(sc).toHaveClass(/in/);

  // 引出线与部件高亮延时严格递增 = 依次;次序与文案次序一致。
  const coDelay = await sc.locator(".k10 .co").evaluateAll((els) =>
    els.map((e) => parseFloat(getComputedStyle(e).transitionDelay)),
  );
  expect(coDelay[0]).toBeLessThan(coDelay[1]);
  expect(coDelay[1]).toBeLessThan(coDelay[2]);

  const parts = sc.locator(".k10 g.hl");
  await expect(parts).toHaveCount(3);
  const partDelay = await parts.evaluateAll((gs) =>
    gs.map((g) =>
      parseFloat(getComputedStyle(g.querySelector(".part")).transitionDelay),
    ),
  );
  expect(partDelay[0]).toBeLessThan(partDelay[1]);
  expect(partDelay[1]).toBeLessThan(partDelay[2]);
  expect(partDelay).toEqual(coDelay);

  // 落定后:三条引出线全部可见,三部件描边收亮黄。
  for (const co of await sc.locator(".k10 .co").all()) {
    await expect(co).toHaveCSS("opacity", "1");
  }
  for (const g of await parts.all()) {
    await expect(g.locator(".part").first()).toHaveCSS(
      "stroke",
      "rgb(255, 196, 61)",
    );
  }
});

test("拍 2 → 拍 3 为同屏续拍:同景不重新入场,仅 .cont 触发引出线;← 回退消隐", async ({
  page,
}) => {
  await page.goto("/?beat=2");
  const sc = scene(page, 2);
  await expect(sc).toHaveClass(/in/);
  await expect(sc).not.toHaveClass(/cont/);

  await page.keyboard.press("ArrowRight");
  expect(+(await page.locator("#stage").getAttribute("data-beat"))).toBe(3);
  // 同一景仍在场,只加 .cont——板图、归属清单不重演入场动效。
  await expect(sc).toHaveClass(/in/);
  await expect(sc).toHaveClass(/cont/);
  await expect(segLi(page, 1)).toHaveClass(/on/);
  await expect(segLi(page, 0)).toHaveClass(/past/);

  await page.keyboard.press("ArrowLeft");
  expect(+(await page.locator("#stage").getAttribute("data-beat"))).toBe(2);
  await expect(sc).toHaveClass(/in/);
  await expect(sc).not.toHaveClass(/cont/);
});
