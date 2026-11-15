# DeepSeek 当前是否支持图片输入；不支持时用什么替代

- 研究票：#63
- 核实日期：2026-11-15
- 核实方式：只读官方一手文档（api-docs.deepseek.com、platform.deepseek.com 指向的协议与隐私政策、Apple Developer 文档、智谱官方模型页、OCRBench v2 榜单）。未调用真实 API（环境里没有 `DEEPSEEK_API_KEY`），凡「文档没写」的地方一律标为证据缺口。
- 结论只覆盖「能不能这样接」，不替产品决定走哪条路。

---

## 0. 结论

**支持。** 截至 2026-11-15，DeepSeek 官方 API 的 `deepseek-flash` 模型原生接受图片输入，官方有独立的 Vision 指南、Files API 和 JSON Output，价格按 token 计。另有独立的 OCR 接口（`POST /v1/tools/ocr`），按页计价。

因此票面里的「若不支持，比较三条替代」不是当前主问题；但三条替代仍作为**降级与对照**保留在 §3，因为在「手写中文 + 学生错误解法 + K10 小传感器」这个具体场景下，**没有任何一家给出可引用的准确率**，包括 DeepSeek。

一句话推荐（只考虑「家里只有 DeepSeek key」）：

> 先走 `deepseek-flash` **直读图片**（一次调用同时做见题和拆题），整页 + 局部特写两张图，关思考、JSON 输出、低温度、失败重试 + 校验；跑不通或结果不稳，再用**同一个 key** 的 OCR 接口转文字后交给文本模型。GLM 只做 A/B 对照，macOS Vision OCR 只做离线兜底，本地 VLM 暂不投入。

---

## 1. DeepSeek 官方 API 视觉能力事实表

来源：<https://api-docs.deepseek.com/guides/vision>、<https://api-docs.deepseek.com/quick_start/pricing>、<https://api-docs.deepseek.com/guides/files_api>、<https://api-docs.deepseek.com/guides/json_mode>、<https://api-docs.deepseek.com/guides/ocr>、<https://api-docs.deepseek.com/updates>。

| 项 | 官方文档写的 | 备注 |
| --- | --- | --- |
| 支持视觉的模型名 | `deepseek-flash` | 对应 `DeepSeek-V4.1-Flash-1017`。旧名 `deepseek-v4-flash-vision-exp`、`deepseek-v4-flash` 仍接受，但已退役、请求转由最新 Flash 服务、按 Flash 价格计费 |
| 不支持视觉的模型 | `deepseek-v4-pro` | 价格页 Features 表里 Vision 一行：`deepseek-flash` 是 ✓，`deepseek-v4-pro` 是 **Not supported**。这是最容易踩的坑 |
| 上下文 / 最大输出 | 1M / 最大 384K | 与计划一致 |
| 图片格式 | JPEG、PNG、GIF、WebP | 「格式按文件实际内容判断，不看文件名或声明的 MIME」 |
| 单图大小 | base64 内联或外链：**32 MiB**；Files API `file_id`：**64 MiB** | 计划里只写了 32MB，漏了 `file_id` 的 64MiB |
| 单次请求体 | **48 MiB**（内联图片计入） | 超过就改用 Files API |
| 单次图片张数 | **最多 600 张** | — |
| 单次图片总大小 | 不含 `file_id` 时 64 MiB；含 `file_id` 时最多 200 MiB | — |
| 单边像素 | **8192 px**；请求里图片 ≥15 张时降为 **4096 px** | — |
| 外链 URL | 必须公网可访问 `http(s)`，长度 ≤ **8192 字符**，图片 ≤ 32 MiB，下载须在 **60 秒**内完成 | — |
| 三种传法 | ① `data:image/jpeg;base64,...` 内联；② 公网 URL；③ Files API `file_id`（`{"type":"file","file_id":"file-api-..."}`），也可用 `file_data` 内联 base64 | OpenAI 兼容 Chat Completions；同一个 `content` 数组里放 `image_url` / `file` / `text` 块 |
| `detail` 字段 | `low` = 先缩到 512×512；`high` = 保留原图（等价 `original`）；`original` = 保留原图；`auto` = 目前等价 `original` | 默认即原图，但**推理前仍会自动缩放**，见下一行 |
| 图片 token | 推理前统一重采样：小于约 544×544 的放大，更大的缩小到「总像素约等于 1300×1300」；**每图上限 1024 token** | 2000×2000 和 5000×5000 花的 token 一样。多图各自独立计，无多图合并优惠 |
| 图片放哪 | 支持放在 `user`、`system`、`tool` 消息里；放在 `assistant` 消息里返回 **400** | — |
| 安全审查 | 开启 model content safety 时图片会被审核，不通过则返回 refusal 并点名被拦图片 | 可选参数 |
| JSON 输出 | `response_format: {"type":"json_object"}`，提示词里必须出现「json」并给一个完整示例；`max_tokens` 要留够防止截断 | **重要坑**：模型输出无法解析为 JSON 时，API 会把非 JSON 内容替换成空格，于是 `content` 可能只有空格、`finish_reason` 仍是 `stop`。必须判空并重试 |
| JSON × 图片 组合 | 文档没有单独声明不支持，也没有给出联合示例 | **证据缺口**：组合可用性只能实测 |
| 价格（每 1M token） | `deepseek-flash`：输入缓存命中 闲时 $0.003 / 峰时 $0.006；缓存未命中 闲时 $0.15 / 峰时 $0.3；输出 闲时 $0.6 / 峰时 $1.2 | 峰时 = UTC 周一至周五 01:00–04:00 与 06:00–10:00，中国法定节假日除外；其余全为闲时（半价） |
| 一次调用的量级 | 1 张图 ≈ 1024 token，加提示词和输出约 1.5k–2k token | 峰时粗算 $0.001 以内/次（约人民币几分钱），20 张不到 1 元。仅为量级估算，以账单为准 |
| 独立的 OCR 接口 | `POST https://api.deepseek.com/v1/tools/ocr`，`multipart/form-data`，字段只有 `file` + `purpose`；支持 PDF / Word / PPT / PNG / JPEG / WebP / GIF / BMP / TIFF；按页返回 JSON，含 `pages[].text` 和归一化坐标 `<|box|>` | 计费 **$0.225 / 1000 页**；文件 ≤100 MiB、≤1000 页；单次识别全程 180 秒；同时在跑最多 15 个；文件「不进 Files API，也不传给对话模型」。文档**没有**声明语言覆盖或手写准确率 |
| 隐私 / 数据用途 | 见 §2 | 这是全篇最需要打问号的一格 |

另有两点与工程实现直接相关：

- `deepseek-flash` **默认开启思考模式**（价格页：non-thinking and thinking (default)）。分类任务应显式关掉，否则输出 token 和延迟都会上去。
- 视觉上线时间线（update log）：2026-08-21 发布实验视觉模型 `deepseek-v4-flash-vision-exp`；2026-09-10 `DeepSeek-V4.1-Flash` 原生多模态、模型名统一为 `deepseek-flash`，旧视觉实验名退役；2026-11-13 开放 OCR / 文件解析等应用 API。**这说明视觉能力是最近三个月内两次换底的，接口稳定性要按「新功能」对待。**

---

## 2. 隐私与数据用途：官方到底承诺了什么

这是现有计划里**最需要修正**的一条。计划写「DeepSeek 可在设置里关闭『数据用于优化体验』」，暗示 API 也有同样的训练退出开关。核对后不成立：

1. 《DeepSeek 隐私政策》（更新 2026-02-10）里关于训练的那句，位于 **「一、2. 智能对话」**，原文：

   > 「在经安全加密技术处理和去标识化前提下，我们可能会将服务所收集的输入及对应输出，用于DeepSeek模型训练和服务的优化。如您拒绝将您的数据用于模型训练，可以在产品内通过关闭『数据用于优化体验』来选择退出……」

   退出路径写的是「点击头像区域 → 设置 → 数据管理 → 关闭『数据用于优化体验』」，这是**消费端 App 的操作路径**。

2. 同一政策 **「一、3. 开放平台服务」** 只写了实名认证、邮箱、支付订单这几类信息，**没有**复述「输入输出可能用于训练」，也**没有**给出 API 侧的退出开关。

3. 《DeepSeek 开放平台服务协议》（更新 2026-04-22）第 4 条只解决权属：输入输出的权利归开发者，可用于包括「训练其他模型」在内的场景；**没有**任何「不用于训练本模型」的承诺。

4. 文档站与 FAQ 也没找到 API 侧的数据用途条款（FAQ 是 JS 应用，抓不到正文；这本身算检索缺口）。

**可以下的结论**：官方文档里**找不到**「API 输入不用于训练」的明确承诺，也**找不到** API 专属的退出开关。所以计划里「可在设置里关闭」不能作为 API 路径的隐私依据。

**落地建议**（不依赖任何一方的承诺）：拍照时只拍题纸，裁掉姓名/班级/学号；不要把孩子的正脸、学校、住址带进画面；家长账号注册，不用孩子信息。

---

## 3. 三条替代方案对比（降级/对照用）

| 维度 | (a) macOS Vision OCR + DeepSeek 文本 | (b) 智谱 GLM-4.6V-Flash | (c) Mac 本地 VLM（MLX） |
| --- | --- | --- | --- |
| 接入成本 | **最低**。系统自带，无需新 key；`VNRecognizeTextRequest` 从 macOS 10.15 起可用，几行 Swift/Python(pyobjc) 即可 | 中。要注册智谱账号、实名、拿第二个 key；OpenAI 兼容，改 `base_url` + model 名即可 | **最高**。要装 Python/MLX 环境、下模型权重、调分辨率与提示词 |
| 费用 | OCR 免费；只付 DeepSeek 文本 token | 模型页写明是免费版本 | 一次性下载 + 电费；无 API 费 |
| 隐私 | **最好**。Apple 原文：「In all cases, all of Vision's processing happens on the user's device」 | 第二个厂商、第二份隐私条款；本轮**未核实**其训练/留存条款 | **最好**，可完全离线 |
| 中文支持 | 支持。官方要求把 `zh-Hans` / `zh-Hant` 放在 `recognitionLanguages` 最前；英文是唯一可与中文并列的語言 | 官方模型页把手写表单、通用 OCR（印刷/手写/楷体/艺术字）、透视变形/模糊/光照不均/复杂背景列为推荐场景 | 取决于所选模型；mlx-vlm 支持 DeepSeek-OCR、PaddleOCR-VL、GLM-OCR、MiniCPM-V 等 |
| 手写证据 | **Apple 完全没提手写**。文档只说 fast/accurate 两条路径、可选语言纠错；并且明确：「Vision doesn't support language correction … for Chinese」 | 有官方场景声明，但**没有准确率数字**；第三方 OCRBench v2（2026.09 私有集，中文）GLM-4.6V-Flash 9B 均分 **59.5**、Recognition **61.1**，全榜第 16/24（榜单含手写内容抽取任务，但无手写单项分） | 无统一评测；mlx-vlm README 未给内存门槛，需按模型实测 |
| 结构信息 | **丢**。只回文本行 + 框；accurate 路径按空白分词，官方明确「处理中文时 bounding box 往往是一行或行片段」。圈注、划线、箭头、几何图、被划掉的步骤都留不下 | 保留整图，能看见划掉/圈注/图形 | 同 (b) |
| 对「拆题（错因）」的适配 | **弱**。错因=方法时，关键在「哪一步错了」，OCR 文本经常足以看出算式，但图形题、辅助线、涂改会丢；还需要第二次文本模型调用 | 强，一次调用同时看图与文 | 强，但质量未知 |
| 运维风险 | 低风险、低上限。macOS 升级可能换 revision；`minimumTextHeight`、低分辨率、透视会显著掉字 | 免费模型可能限流/调整；多一个账号与 key 要管；与 DeepSeek 结果口径不一致 | 模型下载数 GB、首次加载慢、不同机器表现不同；演示现场风险最高 |
| 适合的角色 | 断网/额度用完时的**离线兜底** | **A/B 对照**与备用主路径 | 不作为本阶段选项 |

补充：OCRBench v2 榜单上**没有** `deepseek-flash` / V4.1-Flash（只有 2024 年的 DeepSeek-VL2-Small，中文均分 48.1）。也就是说，DeepSeek 这一步的 OCR 能力**没有进入这个公开的中文 OCR 横评**，不能拿 GLM 的分数类推。

---

## 4. 针对「K10 拍手写中文数学题 + 学生错误解法」的具体风险

按风险从高到低：

1. **分辨率被压到 1300×1300 等效、每图最多 1024 token。** 这是官方写死的，不是猜测。一张 A4 题纸整页塞进 1024 token，题干小字和学生的细小批注很可能糊掉。缓解：**分两张图**——整页一张（看布局与题号）+ 学生解答区域一张紧特写（看错在哪一步），必要时题干再一张。上限 600 张，完全够。
2. **手写本身。** DeepSeek 的 Vision 指南只举例「描述图片、读截屏文字、分析图表」，**没有任何手写或中文手写的承诺**，也没有准确率。GLM 有场景声明但没有数字。三家都没有「初中数学手写」的公开评测。
3. **数学符号与版式。** 分式、根号、上下标、几何图、辅助线，OCR 与 VLM 都容易走形；错因判定对符号极其敏感（把 `+` 读成 `÷` 就会把「计算」误判成「方法」）。
4. **透视、光照、阴影。** K10 固定机位俯拍通常比手持好，但纸张翘边和台灯反光仍是变量。DeepSeek 未提供纠偏能力说明；GLM 把「透视变形、光照不均」写进了推荐场景，但那是厂商自述。
5. **JSON 静默失败。** 官方明确：JSON 模式解析失败时会把内容替换成空格，`finish_reason` 仍是 `stop`。如果不判空，页面会「看起来成功但什么都没有」。
6. **思考模式默认开。** 不关会拖长延迟、抬高输出 token；演示现场体感差。

---

## 5. 推荐路径（给定「只有 DeepSeek key」）

**主路径：`deepseek-flash` 直读图片，一次调用完成见题 + 拆题。**

- 输入：同一请求放 2 张图（整页 + 解答区特写），都走 `data:image/jpeg;base64,...`，不引入公网 URL 与对象存储。
- 参数：`thinking` 关闭、`temperature` 低、`response_format={"type":"json_object"}`、`max_tokens` 留足。
- 输出约束：`掌名` ∈ {见龙在田, 潜龙勿用, 暂无对应的掌}，`错因` ∈ {审题, 概念, 计算, 方法}，附关键步骤；**要求模型在「看不清」时输出「暂无对应的掌」而不是猜**。
- 健壮性：JSON 判空 → 重试（最多 2 次）；schema 校验失败 → 降级为固定文案「暂无对应的掌」并记日志；超时 → 重试一次后降级。
- 为什么不是「先 OCR 再文本」：这条链路要多一次调用、丢掉划线与几何信息，而错因=方法恰恰依赖「看见哪一步被写错/划掉」。

**同 key 降级路径：DeepSeek OCR 接口 → 文本模型。**

- 只在「直读图片连续两次结果不稳」或「图片分辨率实在不够」时启用。
- 成本极低（$0.225/1000 页），且能拿到坐标做裁剪复核；代价是两次调用、丢失版面语义。
- 注意 OCR 接口文档同样**没有**手写承诺，它是降级不是保险。

**不建议作为主路径**：macOS Vision OCR（丢结构、中文无语言纠错、无手写承诺）；GLM-4.6V-Flash（引入第二厂商与第二份隐私条款，收益未被本场景证据支持，适合做 20 张 A/B 对照）；本地 VLM（演示现场风险与准备成本最高）。

---

## 6. 对 `docs/capture-pipeline-plan.md` 的逐条核对

| 计划原文 | 核对结果 |
| --- | --- |
| 「DeepSeek `deepseek-flash` 官方已支持视觉」 | **对**。且要补一句：`deepseek-v4-pro` 不支持视觉 |
| 「1M 上下文，最大输出 384K」 | **对** |
| 「支持 base64 data URL、公网 URL、Files API 的 `file_id`」 | **对**；`file_id` 图可到 64MiB，内联/外链 32MiB，请求体 48MiB |
| 「32MB、约 1300×1300、1024 token/图」 | **对**，但应补「最多 600 张、单边 8192px、≥15 张时降到 4096px」 |
| 「JSON 模式」 | **对**，但要补官方那条「解析失败 → 内容变空格、`finish_reason` 仍为 stop」的静默失败 |
| 「价格：输入未命中闲时 $0.15 / 峰时 $0.3；输出闲时 $0.6 / 峰时 $1.2」 | **对** |
| 「可在设置里关闭『数据用于优化体验』」 | **不准确**。该开关与训练条款写在隐私政策的「智能对话」一节，是 App 内路径；API 侧没有对应承诺或开关。计划不应把它当作 API 的隐私依据 |
| 「没有给手写数学题的准确率承诺」 | **对**。本轮进一步确认：也没有任何公开中文 OCR 榜单成绩，属纯证据空白 |

计划没有提到的两件事：官方**独立的 OCR 接口**（$0.225/1000 页，可作降级），以及**思考模式默认开启**（分类任务应显式关闭）。

---

## 7. 证据缺口与验证清单

**最大的不确定性**：`deepseek-flash` 在真实 K10 照片（手写中文、小字、透视、反光、有涂改）上的识别与判断质量，没有任何官方承诺或第三方数据；而官方又把每图压到约 1300×1300 / 1024 token，这正好打在「小字手写」的软肋上。榜单缺席使这个问题无法用公开数据回答。

**必须实测才能定的事**（建议就用计划里的 20 张真实照片）：

1. 题面字符准确率：逐字比对，重点看数字、运算符、上下标、单位。
2. `掌名` 是否与定稿一致；不一致时是否至少给出「暂无对应的掌」而不是硬猜（**误判比拒答更伤演示**）。
3. `错因` 四分类的 exact match；特别统计「计算↔方法」的混淆。
4. JSON 合法率、空 `content` 发生率、平均延迟（开/关思考各一组）。
5. 单图整页 vs 整页+特写两张图的差异；`detail: low` 作为负对照。
6. 同 key 的 OCR 接口 + 文本模型作为对照组的分数与延迟。
7. 可选对照：GLM-4.6V-Flash 同提示词、同 20 张。

判定线建议（工程建议，非产品决定）：`掌名` 一致率 ≥ 90%、`错因` ≥ 80%、JSON 合法率 100%（含重试后）、单次端到端 < 15 秒，才把它当主路径；否则主路径改「OCR + 文本」或换 GLM，DeepSeek 视觉只做补充。

**仍未核实**：智谱的隐私/训练条款；DeepSeek API 侧数据是否用于训练；JSON 模式与图片输入同时使用的实际表现；DeepSeek OCR 接口对中文手写的实际质量；本地 VLM 在具体 Mac 配置上的内存与速度。

---

## 8. 来源

- DeepSeek Vision 指南：<https://api-docs.deepseek.com/guides/vision>
- DeepSeek 模型与价格：<https://api-docs.deepseek.com/quick_start/pricing>
- DeepSeek Token 用量（含图片 token 计算器）：<https://api-docs.deepseek.com/quick_start/token_usage>
- DeepSeek JSON Output：<https://api-docs.deepseek.com/guides/json_mode>
- DeepSeek Files API：<https://api-docs.deepseek.com/guides/files_api>
- DeepSeek OCR 接口：<https://api-docs.deepseek.com/guides/ocr>
- DeepSeek 更新日志（视觉上线与模型退役）：<https://api-docs.deepseek.com/updates>
- DeepSeek 隐私政策（2026-02-10）：<https://cdn.deepseek.com/policies/zh-CN/deepseek-privacy-policy.html>
- DeepSeek 开放平台服务协议（2026-04-22）：<https://cdn.deepseek.com/policies/zh-CN/deepseek-open-platform-terms-of-service.html>
- Apple `VNRecognizeTextRequest`：<https://developer.apple.com/documentation/vision/vnrecognizetextrequest>
- Apple《Recognizing Text in Images》（中英文语言、设备端处理、中文不支持语言纠错）：<https://developer.apple.com/documentation/vision/recognizing-text-in-images>
- 智谱 GLM-4.6V-Flash 模型页（免费、128K、手写/OCR/抗干扰场景、base64 示例）：<https://docs.bigmodel.cn/cn/guide/models/free/glm-4.6v-flash>
- OCRBench v2 榜单（2026.09 私有集，含中文 Recognition 分项）：<https://99franklin.github.io/ocrbench_v2/>
- mlx-vlm（Apple silicon 本地 VLM，MIT，支持多种 OCR 模型）：<https://github.com/Blaizzy/mlx-vlm>
