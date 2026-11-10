# 学习科学证据笔记：支撑「故事线与学习循环」（issue #31）

> 目的：为「见题拆题之降题十八掌」3 到 5 分钟 Demo 的互动设计提供一手证据。
> 范围：teach skill 的各条原则 + 错题复盘（错因归类、变式练习、先判断再反馈）。
> 本笔记不含代码，不依赖旧研究。

## 0. 核对方式与可信度说明（先读）

- 本笔记的每个来源都在本次调研中通过 `webfetch` 或 `web_search` 实际打开或检索到页面内容。
- 限制：SAGE、PubMed、ScienceDirect 的页面对 `webfetch` 返回 403 或 cookie 拦截。这些来源改为通过 `web_search` 返回的「出版社/DOI 页、作者或机构托管的全文、ERIC 记录」核对。
- 因此多数来源只核对到**标题、作者、年份、摘要与关键数字**，没有逐段读正文。凡是正文细节没读到的，已在条目里标「仅摘要」。
- 没有核对到的内容一律标「未能核实」，列在第 12 节。
- 文中所有数字都来自上述打开的页面。下面「落地做法」和「设计约束」是**我基于证据的推断**，不是来源原话，已在文中标「推断」。
- 证据强度写法：IES 评级（原样引用）、或论文类型（实验 / 元分析 / 理论综述 / 章节综述）。

---

## 1. 提取练习（先回忆再揭晓）

**一手来源**
- Roediger & Karpicke (2006). *Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention.* Psychological Science 17(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x （全文托管：https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf ）
- Rowland (2014). *The effect of testing versus restudy on retention: A meta-analytic review of the testing effect.* Psychological Bulletin 140(6), 1432–1463. https://doi.org/10.1037/a0037559 （仅摘要）
- Dunlosky, Rawson, Marsh, Nathan, Willingham (2013). *Improving Students' Learning With Effective Learning Techniques.* Psychological Science in the Public Interest 14(1), 4–58. https://doi.org/10.1177/1529100612453266 （APS 页面：https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html ）
- IES Practice Guide, Pashler 等 (2007). *Organizing Instruction and Study to Improve Student Learning.* https://ies.ed.gov/ncee/WWC/PracticeGuide/1

**证据强度**：实验 + 元分析 + 专家综述。IES 评级：「用测验让学生重新接触关键内容」= Strong；「用前置问题引入新主题」= Minimal。

**结论**
- Roediger & Karpicke：学生读短文后做自由回忆测验（无反馈），5 分钟后的测验中重复阅读更好；2 天和 1 周后的测验中，做过测验的组成绩明显更高。重复阅读还让学生更自信。
- Rowland：初次测验为回忆（recall）时，测验收益大于再认（recognition）。
- Dunlosky：把「练习测验」和「分散练习」评为高效用；划线、重读等评为低效用。（我只在 APS 页面确认了这两点，其余 8 项的具体评级未核实。）

**落地做法（推断）**
- 在揭晓解法之前，让学生先凭记忆说出或写出「这题该用哪一招、第一步是什么」，再显示答案。
- 速查卡的使用方式设计成「先盖住再回忆，再翻开核对」。

**要避开的坑**
- 实验材料是大学生和文章段落，不是初一数学。
- 提取练习的价值在「延迟后」才显现，一次演示内测不出来，不要在 Demo 里声称「已记住」。
- 学生点开看答案再自评「我会了」，等于没有提取。

---

## 2. 反馈：时机、形式、hypercorrection

**一手来源**
- Hattie & Timperley (2007). *The Power of Feedback.* Review of Educational Research 77(1), 81–112. https://doi.org/10.3102/003465430298487 （仅摘要）
- Shute (2008). *Focus on Formative Feedback.* Review of Educational Research 78(1), 153–189. https://doi.org/10.3102/0034654307313795 （摘要 + 作者托管 PDF 首页：https://myweb.fsu.edu/vshute/pdf/shute%202008%5Fb.pdf ）
- Butler & Roediger (2008). *Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing.* Memory & Cognition 36(3), 604–616. https://doi.org/10.3758/MC.36.3.604 （作者托管：https://gwern.net/doc/psychology/spaced-repetition/2008-butler.pdf ）
- Kulik & Kulik (1988). *Timing of Feedback and Verbal Learning.* Review of Educational Research 58(1), 79–97. https://doi.org/10.3102/00346543058001079 （摘要）
- Butterfield & Metcalfe (2001). *Errors committed with high confidence are hypercorrected.* JEP: Learning, Memory, and Cognition 27(6), 1491–1494. https://doi.org/10.1037/0278-7393.27.6.1491 （摘要）
- Metcalfe (2017). *Learning from Errors.* Annual Review of Psychology 68, 465–489. https://doi.org/10.1146/annurev-psych-010416-044022 （作者本人综述，仅摘要）
- IES Practice Guide, Gersten 等 (2009). *Assisting Students Struggling with Mathematics: RtI for Elementary and Middle Schools.* https://ies.ed.gov/ncee/WWC/PracticeGuide/2

**证据强度**：综述 + 实验 + 元分析；IES 数学指南「显式、系统的教学（含纠正性反馈）」= Strong。

**结论**
- Hattie & Timperley：反馈影响很大，但可正可负，取决于反馈的类型和给法。时机、正负反馈是其讨论的难点。（具体分层模型细节我未读到正文，未核实。）
- Shute：好的形成性反馈应当非评价性、支持性、及时、具体。形式包括「验证对错、解释正确答案、提示、worked example」。
- Butler & Roediger：多选题会让学生记住干扰项，但给反馈后，立即反馈和延迟反馈都提高了正确率、减少了干扰项侵入；该文还指出反馈不必立即给。
- Kulik & Kulik 元分析（53 项研究）：课堂小测的应用研究多半立即反馈更好；对测验内容获得的实验研究多半相反。**时机结论互相冲突。**
- Butterfield & Metcalfe：高信心的错误反而最容易在拿到正确答案反馈后被纠正（hypercorrection）。
- Metcalfe 综述：先出错再给纠正性反馈有益；反馈里包含对「出错推理」的分析很关键。
- IES 数学指南：第 3 条 explicit & systematic instruction 含 corrective feedback，评级 Strong。

**落地做法（推断）**
- 学生作答或选择后立即给反馈，且反馈不止「对 / 错」，要说「你的做法在哪一步假设了什么，所以会得到这个错误」。
- 在揭晓前让学生标一个「有把握 / 没把握」，再揭晓；对「有把握但错」的情形给出重点反馈。

**要避开的坑**
- 只给对错或分数，没有解释。
- 正确答案先露出、再让学生自评。
- hypercorrection 的证据来自常识性问答，不是数学解题步骤。迁移性未知。
- 反馈措辞评价人（「你太粗心」）而不是描述任务过程；此点见 Hattie & Timperley 摘要中的「正负反馈」讨论，具体结论未读正文。

---

## 3. 先判断/预测再揭晓（pretesting、productive failure）

**一手来源**
- Richland, Kornell & Kao (2009). *The pretesting effect: Do unsuccessful retrieval attempts enhance learning?* JEP: Applied 15(3). https://doi.org/10.1037/a0016496 （全文托管：https://learninglab.uchicago.edu/Pre-Testing_files/RichlandKornellKao.pdf ）
- *Unsuccessful retrieval attempts enhance subsequent learning.* JEP: LMC. https://doi.org/10.1037/a0015729 （页面没有显示作者与年份；据记忆为 Kornell、Hays、Bjork 2009，**作者未核实**）
- Kapur (2008). *Productive Failure.* Cognition and Instruction 26(3), 379–424. https://doi.org/10.1080/07370000802212669
- Sinha & Kapur (2021). *When Problem Solving Followed by Instruction Works: Evidence for Productive Failure.* Review of Educational Research 91(5), 761–798. https://journals.sagepub.com/doi/full/10.3102/00346543211019105 （开放获取）
- Kirschner, Sweller & Clark (2006). *Why Minimal Guidance During Instruction Does Not Work.* Educational Psychologist 41(2), 75–86. https://doi.org/10.1207/s15326985ep4102_1

**证据强度**：多个实验 + 一个元分析；同时有明确的反对立场论文。IES 对前置问题评级仅 Minimal。

**结论**
- Richland 等：5 个实验中，学生在阅读前先回答问题（初测答对率约 5%，答对的项目被剔除分析），后测优于延长阅读时间的对照。作者的解释是：失败的提取尝试本身有益。
- Kapur 2008：11 年级物理，先做结构不良问题的组虽然在小组中失败，但在个体近迁移与远迁移上优于对照组。
- Sinha & Kapur 元分析：53 项研究、166 个比较；先解题后讲授的效应 g = 0.36（95% CI 0.20–0.51）；对 2 到 5 年级和「领域通用技能」，效应偏向先讲授。
- Kirschner 等：最小指导的教学对新手效果差，只有先验知识足够高时指导优势才下降。

**落地做法（推断）**
- 每一招开讲前，先给一道「和那道错题同类」的短题，让学生先猜「这一招用不用得上、卡在哪」，再揭晓。
- 不放整道大题让学生自己摸索，只放一个「判断」级别的小问题，难度保持在够得着。

**要避开的坑**
- 把 productive failure 理解成「让学生干耗」。Kapur 的研究设计是失败后有后续讲授与对比。
- 初一学生与 Sinha & Kapur 中「年龄越小效应越不稳」的趋势之间的关系，我没有找到直接证据。
- 在 3 到 5 分钟里没有时间做「先失败很久再讲授」，所以只能做到「轻量判断」，不能声称做了 productive failure。

---

## 4. 认知负荷、一次一招、worked example、变式练习

**一手来源**
- Sweller (1988). *Cognitive load during problem solving: Effects on learning.* Cognitive Science 12(2), 257–285. https://doi.org/10.1016/0364-0213(88)90023-7
- Sweller & Cooper (1985). *The Use of Worked Examples as a Substitute for Problem Solving in Learning Algebra.* Cognition and Instruction 2(1), 59–89. https://doi.org/10.1207/s1532690xci0201_3 （摘要）
- Paas & Van Merriënboer (1994). *Variability of worked examples and transfer of geometrical problem-solving skills.* J. Educational Psychology 86(1), 122–133. https://doi.org/10.1037/0022-0663.86.1.122 （作者机构托管全文：https://ris.utwente.nl/ws/files/288323661/Paas1994variability.pdf ）
- Kalyuga, Ayres, Chandler & Sweller (2003). *The Expertise Reversal Effect.* Educational Psychologist 38(1), 23–31. https://doi.org/10.1207/S15326985EP3801_4
- Rittle-Johnson & Star (2007). *Does comparing solution methods facilitate conceptual and procedural knowledge?* J. Educational Psychology 99(3), 561–574. https://doi.org/10.1037/0022-0663.99.3.561 （摘要）
- IES：Pashler (2007) 第 2 条「把 worked example 与解题练习交替」= Moderate；Gersten (2009) 第 4 条「基于共同底层结构教授应用题」= Strong。

**证据强度**：理论 + 实验；IES Moderate 与 Strong。

**结论**
- Sweller 1988：常规的手段–目的分析式解题占用大量加工容量，妨碍图式获得。
- Sweller & Cooper 1985（代数）：新手学 worked example 比做题耗时更少，后续「与原题同结构」的题解得更快、错误更少；这一优势**只对同结构题成立**，作者结论是新手只形成有限的图式，抽象需要大量练习与更宽的暴露。
- Paas & Van Merriënboer 1994：学 worked example 的组，从高变异的例子中受益最多，迁移更好、所需心力更少。被试为机床编程领域，不是中学数学。
- Kalyuga 等 2003：对新手有效的教学技术，对有经验的学习者会失效甚至有害（expertise reversal）。
- Rittle-Johnson & Star：七年级 70 人；并排比较两种解法的组，在程序性知识和灵活性上收益更大，概念性知识相当。
- IES Gersten：基于「共同底层结构」的教学，Strong。

**对「同结构」与「换情境」两类变式的证据小结**
| 变式类型 | 一手证据 | 能说什么 | 不能说什么 |
|---|---|---|---|
| 同结构（同一招，换数字） | Sweller & Cooper 1985 | 新手在同结构题上变快、错少 | 不保证迁移到结构不同的题 |
| 换情境（同一结构，换故事或图形） | Paas & Van Merriënboer 1994；Gersten 2009 第 4 条 | 高变异例子更利于迁移；认出底层结构有强证据支持 | Paas 的被试不是中学生 |
| 并排比较 | Rittle-Johnson & Star 2007 | 提高程序性知识与灵活性 | 概念性收益不稳 |

**落地做法（推断）**
- 一次只教一招，只展示这一招的 worked example，分步展开。
- 顺序：1 个完整 worked example → 1 道同结构的半完成题（学生补最后一步）→ 1 道换情境题（学生独立判断「是不是同一招」）。

**要避开的坑**
- 在同一屏堆多个解法或多个错因。
- 把「同结构练对了」说成「已能迁移」。
- 对已经熟练的学习者（例如演示里讲解的孩子本人）仍然给大量分步脚手架，可能触发 expertise reversal。

---

## 5. 错误分析、自我解释、错因归类

**一手来源**
- Booth, Lange, Koedinger & Newton (2013). *Using example problems to improve student learning in algebra: Differentiating between correct and incorrect examples.* Learning and Instruction 25, 24–34. https://doi.org/10.1016/j.learninstruc.2012.11.002 （ERIC 全文：https://files.eric.ed.gov/fulltext/ED543090.pdf ）
- Chi, de Leeuw, Chiu & LaVancher (1994). *Eliciting self-explanations improves understanding.* Cognitive Science 18(3), 439–477. https://doi.org/10.1016/0364-0213(94)90016-7 （摘要）
- IES Pashler (2007) 第 7 条「提出深层解释性问题」= Strong。
- Metcalfe (2017)，见第 2 节。

**证据强度**：Booth 为课堂内随机实验；Chi 为小样本实验；IES 第 7 条 Strong。

**结论**
- Booth 等：Algebra I 认知导师，两个实验。让学生解释 worked example（含自我解释提示）比单做引导练习有更好的概念理解；**错误例子（单独或与正确例子并用）对概念理解特别有益**。
- Chi 等：14 名八年级学生被提示自我解释，比对照组（10 人重读）收益大；解释得多的学生理解更深。材料是循环系统课文，不是数学。
- IES 第 7 条：Strong。

**落地做法（推断）**
- 把孩子原来的错解作为「错误例子」展示，让学生指出出错的那一步并**说出为什么这一步看上去合理**。
- 讲解环节用「为什么」提示，而不是只让学生「再算一遍」。

**要避开的坑**
- **我没有找到一手实证直接证明「给错因贴类别标签本身」能提高成绩。** 目前的证据支持的是「分析错误例子」「自我解释」「识别底层结构」，不是任何具体的错因分类法。错因归类的价值在本笔记中属**推断**，需要人来判断（见第 11 节）。
- 只改正答案、不解释，容易变成「抄写 + 重做」（见第 9 节中文研究的描述）。
- Booth 的实验在认知导师中给定错误例子，我没有读到这些错误例子的来源细节；不要假定它等同于学生自己的真实错误（推断）。

---

## 6. 间隔与交错（一次演示做不到，写清证据供将来扩展）

**一手来源**
- Cepeda, Pashler, Vul, Wixted & Rohrer (2006). *Distributed practice in verbal recall tasks: A review and quantitative synthesis.* Psychological Bulletin 132(3), 354–380. https://pubmed.ncbi.nlm.nih.gov/16719566/ （作者托管全文：http://www.yorku.ca/ncepeda/publications/CPVWR2006.pdf ）
- Rohrer, Dedrick & Stershic (2015). *Interleaved practice improves mathematics learning.* J. Educational Psychology 107(3), 900–908. https://doi.org/10.1037/edu0000001 （作者托管：http://uweb.cas.usf.edu/~drohrer/pdfs/Rohrer_et_al_2015JEdPsych.pdf ）
- IES Pashler (2007) 第 1 条「分散学习」= Moderate：几周到几个月后回顾关键内容。
- Dunlosky 等 2013（分散练习评为高效用，APS 页面已核实）。

**证据强度**：元分析（Cepeda，317 个实验，839 个评估）；一项课堂实验（Rohrer）；IES Moderate。

**结论**
- Cepeda：最佳学习间隔随保留间隔变长而变长。
- Rohrer 等：126 名七年级学生，3 个月；交错练习相对集中练习，1 天后测验 Cohen's d = 0.42，30 天后 d = 0.79。
- IES：Moderate。

**落地做法（推断）**
- Demo 内**不声称**做了间隔或交错。
- 在结尾字幕或口头说明：「隔天与一周后各回来做一道混合辨题」，作为后续计划。
- 若要在演示里体现，只能是「预告」，例如速查卡上放一个「混合辨题」入口。

**要避开的坑**
- 把一次演示中的「两题混做」称为交错练习已验证有效。
- Cepeda 的材料为言语回忆，不是数学技能。数学证据请看 Rohrer。

---

## 7. 多媒体学习原则与动效

**一手来源**
- Mayer & Moreno (2003). *Nine Ways to Reduce Cognitive Load in Multimedia Learning.* Educational Psychologist 38(1), 43–52. https://doi.org/10.1207/S15326985EP3801_6 （摘要）
- Mayer & Fiorella (2014). *Principles for Reducing Extraneous Processing in Multimedia Learning: Coherence, Signaling, Redundancy, Spatial Contiguity, and Temporal Contiguity.* Cambridge Handbook of Multimedia Learning. https://doi.org/10.1017/cbo9781139547369.015 （章节摘要）
- Mayer & Pilegard (2014). *Principles for Managing Essential Processing in Multimedia Learning: Segmenting, Pre-training, and Modality.* 同上手册。https://doi.org/10.1017/cbo9781139547369.016 （摘要）
- Harp & Mayer (1998). *How seductive details do their damage.* J. Educational Psychology 90(3), 414–434. https://doi.org/10.1037/0022-0663.90.3.414 （摘要）
- Berney & Bétrancourt (2016). *Does animation enhance learning? A meta-analysis.* Computers & Education 101, 150–167. https://doi.org/10.1016/j.compedu.2016.06.005 （UNIGE 摘要：https://archive-ouverte.unige.ch/unige:92234 ）
- IES Pashler (2007) 第 3 条「图形加语言描述」= Moderate。

**证据强度**：作者本人的章节综述（Mayer 系列）+ 元分析（Berney）+ 实验（Harp & Mayer）。章节综述由 Mayer 本人撰写，属于「作者本人发布」，但它汇总的是自家实验，需注意并非独立复核。

**结论**
- Coherence：排除无关材料更利于深层学习，23 个实验中 23 个支持，效应量中位数 0.86。
- Signaling：加提示突出组织结构更好，28 个实验中 24 个支持，中位数 0.41。
- Redundancy：图形加讲解优于图形加讲解加屏幕文字，16 个中 16 个支持，中位数 0.86。
- Segmenting：学习者自控节奏的分段优于连续播放，10 个中 10 个支持，中位数 0.79。
- Harp & Mayer：有趣但无关的细节（seductive details）让学生回忆主要观点更少、迁移更差；该研究中加高亮、学习目标、signaling 都没有消除这一效应；把细节放在开头更糟，放结尾则减弱。
- Berney & Bétrancourt：动画对静态图总体有小的正效应（Hedges' g = 0.226，95% CI 0.12–0.33）；系统控制节奏时 g = 0.309，配音解说时 g = 0.336，**无附带文字**时 g = 0.883。

**落地做法（推断）**
- 动效的唯一用途：高亮「当前这一步改变了什么」（signaling），与解说同步。
- 默认静态画面，点击后逐步出现（segmenting）；一屏只出现一个新元素。
- 屏幕上少写字，配合孩子的语音讲解（redundancy）。
- 装饰性动画一律不要（coherence、seductive details）。

**要避开的坑**
- Mayer 的 segmenting 强调「学习者自控」，而录屏 Demo 本质是系统控制节奏。这两者不一致。Berney 的结果显示系统控制节奏的动画并不差。如何取舍见第 11 节。
- Harp & Mayer 的被试是大学生读文章，不是动画。
- 「动效越多越吸引评委」没有对应的学习证据。

---

## 8. 近端发展区、想象中的掌握、desirable difficulties

**一手来源**
- Vygotsky (1978). *Mind in Society.* Harvard University Press. https://www.hup.harvard.edu/books/9780674576292 （全书扫描 PDF：https://home.fau.edu/musgrove/web/vygotsky1978.pdf ；ZPD 定义的页码引用来自 Chaiklin 的二手章节，原书第 86 页，**页码引文未直接在原书扫描里核对**）
- Bjork (1994). *Memory and metamemory considerations in the training of human beings.* 载 Metcalfe & Shimamura (eds.), *Metacognition: Knowing about knowing*, MIT Press, 185–205. https://doi.org/10.7551/mitpress/4561.003.0011 （作者实验室托管：https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/07/RBjork_1994a.pdf ）
- Bjork & Bjork (2020). *Desirable difficulties in theory and practice.* J. Applied Research in Memory and Cognition 9(4), 475–479. https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2021/01/RABjorkELBjorkJARMAC2020ForPostingSingleSpaced.pdf
- Soderstrom & Bjork (2015). *Learning versus performance: An integrative review.* Perspectives on Psychological Science 10(2), 176–199. https://doi.org/10.1177/1745691615569000 （摘要）
- Koriat & Bjork (2005). *Illusions of competence in monitoring one's knowledge during study.* JEP: LMC 31(2), 187–194. https://doi.org/10.1037/0278-7393.31.2.187

**证据强度**：理论（Vygotsky）；理论综述 + 实验（Bjork 系列）。

**结论**
- Bjork 1994：加快训练期表现的操作，可能无法支持长期成绩；看似给学习者增加困难的操作，可能提高长期表现。学习者对自己进度的误读是另一个问题。
- Bjork & Bjork 2020：让表现快速提高的学习条件常常不支持长期保持与迁移；因此学习者与教师都容易误判是否学会。区分「合意困难」与「不合意困难」。
- Soderstrom & Bjork：训练中可观察到的是 performance，它常常不可靠地反映 learning。
- Koriat & Bjork：学习时在答案可见的状态下做学习判断，会产生「能力错觉」。
- Vygotsky：ZPD 指独立解题水平与在成人指导或能力更强同伴协作下可达水平之间的距离（定义来自 Chaiklin 二手引用，未在原书扫描核对）。

**落地做法（推断）**
- 难度由「刚做错的那一道题」锚定：展示的新题应比原题稍易或同难度，而不是更难。
- 在翻开答案之前，不让学生自评「我会了」。
- 结尾语避免「学会了」，改成「现在能做对；隔天再做一次才算数」。

**要避开的坑**
- ZPD 只是理论构念，没有可直接套用的测量方法，不能写成「已经科学测定了孩子的 ZPD」。
- 「合意困难」是有条件的：太难、没有反馈时就是不合意困难（Bjork & Bjork 2020 讨论了合意与不合意之分，这里没读到具体条件细节）。

---

## 9. 中国初中数学「错题本」实证（补充，可信度低）

**打开并确认过的材料**
1. 董慧敏 (2022). *费曼学习法在小学高段学生数学错题管理中的实验研究*（硕士学位论文，石河子大学）。https://lwtj.shzu.edu.cn/docinfo.action?id1=1b6499192368b5e3c176a8e50a79b2b3&id2=nD7QcxzPYKs%253D
   - 类型：硕士论文，准实验，**五年级**，2 个班，约 3 个月。
   - 摘要声称：实验班同类题错误率下降、成绩提高；干预步骤含「讲授错题」「复述」「纠错反馈」，随后出同类型题检验。
   - 可信度：**低**。非同行评议；小学；班级为单位；样本小。但干预形式（孩子讲错题）与本 Demo 相近，可作为「方向相符」的旁证。
2. *The Present Situation and Prospect of the Use of the NWCA in Middle School Teaching.* Learning & Education 9(5), 2021. https://doi.org/10.18282/l-e.v9i5.2093
   - 类型：文献综述。
   - 摘要指出：中国中学错题本研究多为问卷、访谈、观察，**实验方法很少**，且缺乏理论支撑。
   - 可信度：作为「该领域证据薄」的说明有用；它自己不是效果证据。
3. *Situation of Junior High School Students' Use of MENBs and Optimization Strategies.* https://bryanhousepub.com/index.php/jerp/article/download/3671/3529
   - 类型：安阳某初中的问卷与访谈，调查现状。
   - 摘要指出：多数学生只改正错误、不深入分析，缺少收集与分类；教师只布置、不监督。
   - 可信度：**低**（期刊信誉我未核实；调查性质，不测成绩效应）。

**结论**：我没有找到可信的、测量成绩效应的初中数学错题本对照实验。现有材料只能支持两点：「错题本常被做成抄写 + 重做」和「缺少深入分析与分类」，这与前面第 5 节的国际证据方向一致，但**不是**因果证据。

**未采用**：九江新闻网（课题结题新闻稿）与某些没有方法描述的期刊网文章，不属于一手研究，已排除。

---

## 10. 对故事线与学习循环的设计含义

以下是 9 条可操作约束。每条标明依据（节号）。这些约束是我从证据推导的设计建议，不是来源原话。

1. **先让学生判断，再揭晓。** 每个关键步骤的顺序是：看题 → 学生先说「错在哪一步 / 用哪一招」，并标有无把握 → 再显示答案。（§1 §2 §3）
2. **反馈要立即且带解释。** 揭晓后用一句话说明「这一步为什么看着合理但不成立」，不要只显示对错。有把握却错的情形多给一句。（§2 Butler、Metcalfe、Shute）
3. **一次只教一招。** 整个 Demo 只讲一招，名称和触发信号一致使用，不并列介绍多招。（§4 Sweller）
4. **用「孩子的真实错解」当错误例子，再配正确 worked example。** 先展示错解并让学生找错，再给出分步的正确解法，分段点击出现。（§4 §5 Booth、Sweller & Cooper）
5. **变式分两步放。** 先一道同结构的半完成题（补最后一步），再一道换情境题，只问「是不是同一招，第一步是什么」。（§4）
6. **孩子讲解放在反馈之后，不是之前。** 孩子用自己的话解释「为什么」，承担自我解释的角色。（§5 Chi、IES 第 7 条）；注意孩子已熟悉此题，避免过度脚手架。（§4 Kalyuga）
7. **速查卡由回忆生成并支持再回忆。** 卡片放：招名、触发信号（见到什么特征）、第一步动作、一个典型错因、一个反例。使用方式写明「先盖住再回忆」。（§1 §4；卡片内容为推断，没有直接测试速查卡有效性的一手证据）
8. **动效只做 signaling。** 动效用于高亮当前改变，与解说同步；一屏一个新元素；屏幕少文字；无装饰动画。（§7）
9. **诚实的结尾。** 说明本 Demo 只展示「当场流畅」；间隔与交错需要隔天、一周后回来做，列在结尾字幕里。（§6 §8）

建议的 3 到 5 分钟时间分配（推断，非证据）：
- 0:00–0:30 展示错题与孩子原错解
- 0:30–1:15 判断 + 信心标记，揭晓并给解释
- 1:15–2:15 一招的 worked example，分段出现，孩子讲解
- 2:15–3:15 同结构半完成题 + 换情境题，各给立即反馈
- 3:15–4:00 速查卡生成与「先盖住再回忆」演示
- 4:00–4:30 结尾说明隔天复习计划

---

## 11. 证据不足或互相冲突、需要人来拍板的点

1. **多选还是自由作答。** teach skill 要求测验选项等长、答案位置变化，但 Rowland (2014) 的元分析显示初次测验为回忆时收益大于再认。判断环节建议改成「先说出再选」，还是接受多选，需要人决定。
2. **反馈立即还是延迟。** Kulik & Kulik 的结果因研究类型而异，Butler & Roediger 显示延迟反馈也可行。本笔记倾向立即，但这是在 3 到 5 分钟内的实用取舍，不是证据的结论。
3. **「先判断再讲」的力度。** IES 对前置问题仅 Minimal；Sinha & Kapur 对低年级效应偏向先讲授，对初一没有直接数据；Kirschner 等反对最小指导。建议只做轻量判断，是否接受由人定。
4. **录屏的节奏。** Mayer 的 segmenting 要求学习者自控；录屏是系统控制。Berney 显示系统控制节奏的动画并无劣势。是否另做一版「可点击」的交互 Demo 供孩子自己练习，需要人定。
5. **错因归类。** 没有一手实证证明某种错因分类法能提升成绩，只有间接证据（错误例子分析、自我解释、底层结构教学）。「十八掌」本身是孩子的分类框架，能不能用这些证据背书，应由人判断，措辞上不要写「已被证明有效」。
6. **谁是学习者。** 评委是观看者，孩子是讲解者。观看者没有真正做提取，Demo 对评委的「学习」效果无法检验；孩子本人对该题已熟悉，可能处于 expertise reversal 一侧。需要人明确 Demo 的主要用途。
7. **hypercorrection 与信心标记。** 证据来自常识问答，用在数学步骤上属外推。
8. **速查卡的有效性。** 没有找到直接测试「参考卡」学习效果的一手研究，只有间接支持（结构化图式、提取练习）。
9. **「孩子讲解」的专项证据。** 我没有检索「教别人学习（learning by teaching）」的一手研究，仅用到自我解释与 Feynman 方法的低可信度中文论文。若要强调孩子讲解，建议补一轮检索。

---

## 12. 自查结论

**每个链接是否打开过**
- 已通过 `webfetch` 直接打开：IES 两份 Practice Guide 页面、APS 对 Dunlosky 的页面。
- 已通过 `web_search` 返回正文片段核对：其余全部来源。其中 SAGE、PubMed、ScienceDirect 的 `webfetch` 失败（403 或 cookie 拦截）。
- `webfetch` 对 Hattie & Timperley 的 PDF 返回的是二进制，未能读取正文。

**未能核实的清单**
- Hattie & Timperley (2007)：只核对摘要，反馈分层模型细节与「正负反馈」具体结论**未读到正文**。
- Dunlosky 等 (2013)：只核实练习测验与分散练习为高效用、划线重读为低效用；自我解释、交错练习等其他项目的评级**未核实**。
- Richland 等 (2009)：读到全文片段，仅核对了摘要与初测答对率约 5%。
- `10.1037/a0015729`（Unsuccessful retrieval attempts enhance subsequent learning）：页面未显示作者与年份，**作者与年份未核实**。
- Vygotsky (1978)：ZPD 定义与页码来自 Chaiklin 章节的引用，**未在原书扫描里逐页核对**。
- Mayer 系列三篇章节与 Mayer & Moreno (2003)：只核对摘要及效应量中位数；temporal contiguity 的数字未读到。
- Butterfield & Metcalfe (2001)、Metcalfe (2017)、Sweller (1988)、Sweller & Cooper (1985)、Kalyuga 等 (2003)、Rittle-Johnson & Star (2007)、Chi 等 (1994)、Kapur (2008)、Kulik & Kulik (1988)、Soderstrom & Bjork (2015)、Rowland (2014)、Koriat & Bjork (2005)：仅摘要级核对。
- 中文材料第 9 节：仅读到摘要和页面片段，可信度均低。

**是否把二手说法当一手**
- Mayer 系列章节是作者本人综述，已在 §7 标明。
- Metcalfe (2017) 是作者本人对自家与他人研究的综述，已标明。
- Chaiklin 对 Vygotsky 的引文是二手，已在 §8 标明。
- 未引用博客与科普文章。

**凭记忆的数字**
- 本笔记所有数字均来自上述打开的页面；凭记忆的内容只有 `10.1037/a0015729` 的作者推测，已标「未核实」。
