#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""思源宋体/思源黑体子集内嵌(issue #50,规格 §1)——可重跑脚本。

用法:python3 scripts/embed-fonts.py

流程:
  1. 自举:首次运行创建 .font-tools/ venv 装 fontTools+brotli,再以该解释器重入本脚本。
  2. 取源:下载思源宋体 SC / 思源黑体 SC 各所需字重 OTF 到 .font-cache/(存在即复用)。
  3. 集字:收集 demo/index.html 全量字符(剔除既有子集块)+ ASCII 可印字符。
  4. 子集:逐字重子集化出 woff2,并校验子集 cmap 覆盖全部可印字符(缺字即失败)。
  5. 内嵌:base64 写进 <style id="font-subsets"> 的 FONT-SUBSET 标记之间;标记块不存在则先建。

文案更新后重跑本脚本重建子集即可;.font-cache/ 与 .font-tools/ 均已 gitignore。
"""

import base64
import html
import io
import os
import re
import subprocess
import unicodedata
import venv

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENV = os.path.join(ROOT, ".font-tools")
CACHE = os.path.join(ROOT, ".font-cache")
INDEX = os.path.join(ROOT, "demo", "index.html")

SERIF = "Source Han Serif SC"
SANS = "Source Han Sans SC"
SERIF_URL = "https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/OTF/SimplifiedChinese/SourceHanSerifSC-{}.otf"
SANS_URL = "https://raw.githubusercontent.com/adobe-fonts/source-han-sans/release/OTF/SimplifiedChinese/SourceHanSansSC-{}.otf"

# (内嵌 family, 源字重名, 声明的 CSS font-weight, 源 OTF 地址)
# 思源宋体最重的字重名是 Heavy(900);思源黑体 Medium(500)声明为 600 对应 CSS 常用档。
FACES = [
    (SERIF, "Bold", 700, SERIF_URL.format("Bold")),
    (SERIF, "Heavy", 900, SERIF_URL.format("Heavy")),
    (SANS, "Regular", 400, SANS_URL.format("Regular")),
    (SANS, "Medium", 600, SANS_URL.format("Medium")),
    (SANS, "Bold", 700, SANS_URL.format("Bold")),
    (SANS, "Heavy", 900, SANS_URL.format("Heavy")),
]

STYLE_RE = re.compile(r'<style id="font-subsets">.*?</style>\n?', re.S)
BLOCK_RE = re.compile(
    r"(/\* FONT-SUBSET-BEGIN \*/\n).*?(\n/\* FONT-SUBSET-END \*/)", re.S
)
# 说明放进 FONT-SUBSET 标记之间:整段 <style id="font-subsets"> 在集字前被剔除,
# 生成块的任何文字都不会回流进字符集——脚本重跑幂等。
NOTE = (
    "/* 思源宋体/思源黑体子集内嵌(issue #50):scripts/embed-fonts.py 生成,"
    "勿手改;文案更新后重跑。 */"
)


def bootstrap():
    """无 fontTools/brotli 时建 .font-tools venv 并重入;已具备则直接返回。"""
    try:
        import fontTools, brotli  # noqa: F401
        return
    except ImportError:
        pass
    py = os.path.join(VENV, "bin", "python3")
    if not os.path.exists(py):
        print("[embed-fonts] 创建 .font-tools/ venv 并装 fontTools + brotli …")
        venv.create(VENV, with_pip=True)
        subprocess.run(
            [os.path.join(VENV, "bin", "pip"), "install", "-q", "fonttools", "brotli"],
            check=True,
        )
    os.execv(py, [py, os.path.abspath(__file__)])


def fetch(url):
    """下载源 OTF 到 .font-cache/,已存在即复用;断线重试并断点续传,校验 OTF 魔数。"""
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, url.rsplit("/", 1)[-1])
    if os.path.exists(path) and _is_otf(path):
        return path
    print(f"[embed-fonts] 下载 {url.rsplit('/', 1)[-1]} …")
    subprocess.run(
        [
            "curl",
            "-fL",
            "--retry",
            "20",
            "--retry-all-errors",
            "--retry-delay",
            "2",
            "-C",
            "-",
            "-o",
            path,
            url,
        ],
        check=True,
    )
    if not _is_otf(path):
        raise SystemExit(f"[embed-fonts] {path} 不是合法 OTF(下载损坏)")
    return path


def _is_otf(path):
    try:
        with open(path, "rb") as f:
            return os.path.getsize(path) > (1 << 20) and f.read(4) == b"OTTO"
    except OSError:
        return False


def page_charset(src):
    """全量字符:整页文本剔除既有子集块,解码 HTML 实体后集字,并补 ASCII 可印字符。"""
    text = html.unescape(STYLE_RE.sub("", src))
    return sorted(set(text) | {chr(c) for c in range(0x20, 0x7F)})


def charset_sig(chars):
    """字符集签名 = FNV-1a(UTF-8 排序字串):N —— test/offline-file.spec.js 同式复算,
    文案改动未重跑本脚本时签名不一致、测试报错。"""
    h = 2166136261
    for b in "".join(chars).encode("utf-8"):
        h = ((h ^ b) * 16777619) & 0xFFFFFFFF
    return f"{h:08x}:{len(chars)}"


def subset_face(path, text):
    """单字重子集化 → woff2 字节;校验 cmap 覆盖全部可印字符。"""
    from fontTools import subset
    from fontTools.ttLib import TTFont

    opts = subset.Options(flavor="woff2", layout_features="*", name_IDs="*")
    font = subset.load_font(path, opts)
    ss = subset.Subsetter(opts)
    ss.populate(text=text)
    ss.subset(font)
    buf = io.BytesIO()
    font.save(buf)
    data = buf.getvalue()

    cmap = TTFont(io.BytesIO(data)).getBestCmap()
    missing = [
        c
        for c in text
        if not unicodedata.category(c).startswith("C") and ord(c) not in cmap
    ]
    if missing:
        names = ", ".join(f"U+{ord(c):04X} {c!r}" for c in missing)
        raise SystemExit(
            f"[embed-fonts] {os.path.basename(path)} 子集缺字:{names}"
        )
    return data


def splice(src, css):
    """子集块写回:有标记原位替换,无标记插到首个 <style> 之前。"""
    m = BLOCK_RE.search(src)
    if m:
        return src[: m.start()] + m.group(1) + css + m.group(2) + src[m.end() :]
    block = (
        '<style id="font-subsets">\n/* FONT-SUBSET-BEGIN */\n'
        + css
        + "\n/* FONT-SUBSET-END */\n</style>\n"
    )
    if "<style>" not in src:
        raise SystemExit("[embed-fonts] 找不到 <style> 可插入子集块")
    return src.replace("<style>", block + "<style>", 1)


def main():
    src = open(INDEX, encoding="utf-8").read()
    text = page_charset(src)
    print(f"[embed-fonts] 页面字符 {len(text)} 个")

    css, total = [], 0
    for family, weight_name, css_weight, url in FACES:
        data = subset_face(fetch(url), "".join(text))
        total += len(data)
        css.append(
            f'@font-face{{font-family:"{family}";font-style:normal;'
            f"font-weight:{css_weight};"
            f'src:url(data:font/woff2;base64,{base64.b64encode(data).decode()})'
            f' format("woff2")}} /* {weight_name} */'
        )
        print(
            f"[embed-fonts] {family} {weight_name} → {css_weight}: "
            f"{len(data) / 1024:.0f} KiB"
        )

    out = splice(
        src, NOTE + f"\n/* charsig:{charset_sig(text)} */\n" + "\n".join(css)
    )
    with open(INDEX, "w", encoding="utf-8") as f:
        f.write(out)
    print(
        f"[embed-fonts] 已写入 demo/index.html:"
        f"子集合计 {total / 1024:.0f} KiB,文件 {len(out.encode()) / 1024:.0f} KiB"
    )


if __name__ == "__main__":
    bootstrap()
    main()
