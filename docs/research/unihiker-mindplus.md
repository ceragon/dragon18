# 行空板和 Mind+ 能把拍照、分类和屏幕演示做到哪

调查日期：2026-11-09。只使用 DFRobot / UNIHIKER 官网与官方 wiki，以及 Mind+ 官网文档。社区转帖不作为依据。

「行空板」现在是系列，不是一块板。官方把 UNIHIKER K10 和 UNIHIKER M10 都叫行空板：K10 是 ESP32-S3 单片机、无操作系统、面向三年级以上，图形化走 Mind+；M10 是 RK3308 Linux 小电脑、面向六年级以上，图形化也走 Mind+，另外还有 Python 和 VS Code。来源：<https://www.unihiker.com/>。DFRobot 产品 wiki 的选型说明与此一致：K10 适合入门图像/语音模型和 TinyML 自训；M10 适合已经用过 TinyML、还要 YOLO / MobileNet / MediaPipe 的人。来源：<https://wiki.dfrobot.com/dfr0992-en/>。

给初一、并且规格写的是「她以后用 Mind+ 自己做」时，能写进孩子部分的，主要是 **K10 的上传模式积木**：屏幕、拍照、按键和传感器，再用如果 / 否则做规则分类。拍一道数学错题再把它归成「计算 / 概念 / 审题」这类，以及用大模型写复盘，官方积木参考没有对应入口，留在成人做的软件 Demo。M10 的拍照和光线分档，官方例子是 Python，不要写成她的积木作业。

## 两块板的板载输入

### K10：有摄像头，规格表没有触摸屏

板载：AHT20 温湿度、LTR303ALS 环境光（0–64k Lux）、SC7A20H 三轴加速度、2.8 英寸 240×320 彩屏（ILI9341）、2MP 摄像头（GC2145，80°）、按键 A / B / RST / BOOT、两路 MEMS 麦克风、2W 喇叭、三颗 WS2812。接口是 USB-C（供电和上传）、电池口、两路 3Pin GPIO、一路 I2C、TF 卡、兼容 micro:bit 的金手指。来源：<https://www.unihiker.com/wiki/K10/HardwareReference/hardwarereference_specs/>，产品页复述同一套传感器和「Button x 2、Microphone x 2」。来源：<https://www.unihiker.com/products/k10>。

产品页和规格表都没有把触摸屏列进传感器。DFRobot 商品 wiki 有一张图的替代文字写成 “with Touchscreen”，和规格表冲突；本笔记以规格表和产品页的传感器清单为准，不把 K10 屏幕当成触摸输入。来源：<https://wiki.dfrobot.com/dfr0992-en/>。

官方用「背面有没有摄像头和 USB-A」区分两块板：M10 有 USB-A、没有板载摄像头；K10 相反。来源：<https://www.unihiker.com/wiki/K10/>。因此 K10 的官方接口表里也没有用来插 USB 摄像头的 USB-A。

### M10：有触摸屏，没有板载摄像头

板载：Home、A、B 键；2.8 英寸 240×320 彩色触摸屏；电容硅麦；PT0603 光敏；无源蜂鸣器；蓝色 LED；六轴（加速度 + 陀螺仪）。接口含 USB-C、USB-A、Micro SD、Gravity 3Pin/4Pin、金手指。来源：<https://www.unihiker.com/wiki/HardwareReference/hardware_reference_specification/>，产品页同样写 Touch Screen，传感器是按键、麦克风、光敏、加速度、陀螺仪，没有摄像头。来源：<https://www.unihiker.com/products/m10>。

Home 菜单可以校准触摸屏：依次点五个点。来源：<https://www.unihiker.com/wiki/SystemAndConfiguration/system_and_configuration_home_menu/>。

外接摄像头在官方文档里，但是 Python，不是积木。AI 应用页写明：板上没有摄像头；需要摄像头时，把免驱 USB 摄像头插到 USB-A。来源：<https://www.unihiker.com/wiki/Playground/AI/>。DIY Camera 示例用 OpenCV 的 `cv2.VideoCapture(0)` 读 USB 摄像头，再裁成 240×320 显示。来源：<https://www.unihiker.com/wiki/Examples/PythonCodingExamples/AdvanceExamples/3_DIY_Camera/>。`draw_image()` 的第二个示例同样用 OpenCV 取 USB 画面，叠上板载光线读数。来源：<https://www.unihiker.com/wiki/LanguageReference/UNIHIKER_Library/ScreenDisplay/reference_unihiker_draw_image/>。

另一类「外接眼睛」是 HUSKYLENS 2，不是 USB 摄像头。官方 wiki 有 K10 和 M10 的 Mind+ 积木例程（人脸、物体、颜色、物体分类、自学习分类等），识别发生在 HUSKYLENS 2 上，结果送到行空板屏幕。来源：<https://wiki.dfrobot.com/sen0638/>。这是额外模块。当前地图不采购硬件，不能写成孩子已经能做的板载能力。

## Mind+ 积木能做的，和必须写 Python 的

Mind+ 有多套模式。和行空板有关的是：K10 用上传 / 离线模式；M10 用 Python 模式下的积木（官方称 Graphical Python）；另外还有不连板、在电脑舞台上跑的实时模式。

### K10：拍照、预览、屏幕、规则分类，积木够用

K10 的 Mind+ 要求 V1.8.1 及以上，并且官方入门写明目前只有 Windows；macOS / Linux 要用 Arduino IDE 或 MicroPython，不能用这套 Mind+。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mindplus/>，平台表：<https://www.unihiker.com/wiki/K10/get-started/>。

积木参考里，和「看见、拍下、显示」直接对应的积木：

- 打开或关闭摄像头画面，显示在 K10 自己的屏幕上。清屏清不掉摄像头层，要另用关闭摄像头积木。来源：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>
- 把当前帧存进 TF 卡。只支持 bmp。右上角指示灯亮起后建议稳住约 0.5 秒，灯灭才算存完。同一页。
- 在屏幕上显示文字（竖屏最多 13 行；坐标文字字号 16 或 24）、点、线、圆、矩形、二维码，以及本地图片或 TF 卡上的 png/jpg/bmp。本地图片须在 240×320 以内，太大或太多会在烧录时报内存不足。同一页。
- 电子相册示例就是积木：TF 卡 FAT32，按 A 拍照，按 B 把照片显示出来。来源：<https://www.unihiker.com/wiki/K10/Examples/examples_mindplus/>

板载输入在同一份积木参考里都有积木：A/B 按下或松开（轮询或中断；开着摄像头/AI 时建议用中断）、六种姿态、温度或湿度、环境光 Lux、加速度。音频积木可以播内置音乐、播音符、从 TF 卡播双声道 wav、以及按指定时长录音存成 wav。来源：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>。

「按自定条件分成几类」要拆开：

- 数值条件：Mind+ 上传模式有「如果」「如果 / 否则」「多次条件判断」。来源：<https://mindplus.dfrobot.com.cn/sc-mk-kongzhi>。K10 积木又能读出光线、温湿度、加速度和按键。所以「按键 A 算一类、否则再按光线或温度分成另一类」这种规则分类，是积木，不必写 Python。上传模式运算符积木页这次没有打开，比较和与或非的积木名字不单独引。
- 语音命令词：语音识别积木可以添加命令词 ID（0–199）和词语，词语建议 2–5 个音节，单音节如 “hi” 可能认不出。唤醒后再判断是哪一个 ID。来源：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>。这是「自定词语」，不是自定图像类别。
- 板载视觉只有四种算法：人脸检测、猫狗检测、运动检测、二维码。人脸和猫脸才会叠识别框，而且屏幕必须竖放（Type-C 朝上），横屏不检测。人脸学习最多 48 个 ID，断电不用重学。来源同上。产品页的预置能力与此对应，并多写了 Customizable Image Detection Models、本地语音识别、自定义语音命令、联网在线语音识别。来源：<https://www.unihiker.com/products/k10>。

积木参考里没有「把一张照片分进我自己起的几个类」这种积木。产品页和 DFRobot wiki 都说 K10 可以用 TinyML 训练并部署自定义图像模型和传感器模型。来源：<https://www.unihiker.com/products/k10>，<https://wiki.dfrobot.com/dfr0992-en/>。Mind+ 首页也写：图像分类等模型可以一键部署到二哈识图 2 和行空板。来源：<https://mindplus.cc/>。但是 K10 的 Mind+ 积木参考没有列出加载自训图像模型的积木。2026-11-09 再打开 Mind+ 官网文档里模型训练的细页（`mindplus.cc` 上的 AITools / realtime-ext-docs 路径）返回 404，所以「部署之后在板上用哪块积木调用」没有核对到仍可打开的页面。电脑上的图像识别积木是另一条路，见下文，不在行空板上跑。

因此：孩子用 K10 积木可以拍、可以显示、可以用预设的脸/猫狗/动作/二维码或用自己写的数值条件分类。不能据此写成「她用积木训练一个错题图像分类器并在板上调用」。自训模型如何在积木里被调用，积木参考没有写出来，记在不确定项。

官方入门还说 K10 有离线语音合成。来源：<https://www.unihiker.com/wiki/K10/get-started/>。积木参考的音频一节只写到内置音乐、音符、wav 播放和录音，没有一条「把这段文字念出来」的积木。来源：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>。不要把语音合成写成孩子用积木就能做，除非以后积木参考补上。

MicroPython 积木是另一套固件。Mind+ V2 可以给 K10 烧 MicroPython，示例里同样有显示摄像头、按键、光线。固件 0.9.8 注明：人脸、猫狗、二维码很吃资源，当时不能和 Wi-Fi 同时用。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mpy/>。这不是默认的上传模式，也不该和上面的 Arduino 积木混成同一套限制。

### M10：屏幕文字有积木；拍照和光线分档的官方例子是 Python

图形化入口：Mind+ V1.7.2 RC3.0 及以上，右上角切到 Python，再选 Blocks，扩展里加载官方库 “UNIHIKER”，远程终端连 10.1.2.3，积木库里有「在屏幕上显示文字」。点 Run 后板上出现文字。Windows、macOS、Linux 的安装步骤官方都写了。来源：<https://www.unihiker.com/wiki/GettingStarted/gettingstarted_mindplus/>。

官方没有像 K10 那样给出一份 M10 积木总表。Mind+ 的 Python 入门文档有 `if / else / elif`，那是代码语法，不是一块已经接上 M10 传感器的积木。来源：<https://mindplus.dfrobot.com.cn/python-base>。光线分成四档并换屏幕图片的示例，是 Python：`light.read()` 再 `if / elif`。来源：<https://www.unihiker.com/wiki/Examples/PythonCodingExamples/BasicExamples/examples_py_luminosity_detector/>。按键控制灯和换图、触摸屏上放按钮，也是 Python：`button_a.is_pressed()`、`gui.add_button()`。来源：<https://www.unihiker.com/wiki/Examples/PythonCodingExamples/BasicExamples/examples_py_button_lights/>，<https://www.unihiker.com/wiki/LanguageReference/UNIHIKER_Library/ScreenDisplay/reference_unihiker_add_button/>。Home 键留给主页菜单，A/B 才给用户程序。来源：<https://www.unihiker.com/wiki/LanguageReference/PinPong_Library/FunctionOnboard/2_Button_A_and_Button_B/>。

USB 摄像头的打开、拍照、把画面画到板载屏，官方示例都是 OpenCV Python，不是积木。见上一节两条摄像头链接。

M10 的 Mind+ 积木可以接 HUSKYLENS 2，用积木读物体分类或自学习分类的 ID、名字。物体分类是模型里固定的最多 1000 类，置信度目前不能从程序读回，只在画面上；自学习是先教会再认。来源：<https://wiki.dfrobot.com/sen0638/docs/24928>，<https://wiki.dfrobot.com/sen0638/docs/24929>。没有这块外接传感器，M10 积木不能自己拍照分类。

## 现场改一小段再跑

可以改完重跑，但不是在板子上改积木，也不是改一行就热补丁。

- K10：电脑上的 Mind+ 离线模式改积木，点 Upload，等上传完。程序写进 Flash，断电还在，下次上电跑最后一次上传的程序。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mindplus/>，<https://www.unihiker.com/wiki/K10/get-started/>。改一小段的代价是整份程序重新上传。积木会在代码区自动生成代码，也可以切到手动编辑再上传。来源：<https://mindplus.dfrobot.com.cn/sc-daima>。手写区不是初一规格该依赖的路径。
- M10：改积木后再点 Run。Run 会把积木生成的 Python（以及项目文件）上传到板上 `mindplus` 目录，文件名是 Mind+ 顶栏那个名字，其中 `.cache_file.py` 是积木生成的程序。拔掉电脑后，还能在板子 Home 菜单的 mindplus 文件夹里找到并运行。来源：<https://www.unihiker.com/wiki/Troubleshooting/How_can_I_get_the_Mind_graphical_program_to_run_on_the_UNIHIKER_after_disconnecting_it_from_my_computer/>。产品页写可以从电脑、iPad 甚至手机编程，并支持热点。来源：<https://www.unihiker.com/products/m10>。官方没有写「只重传改过的那几行」。

K10 还有几条和现场演示有关的限制：屏幕积木不要放进 MQTT、引脚中断或子线程，否则会异常重启（A/B 按键帽子积木除外，但也不要堆很多屏幕更新）；AI 积木除语音外也不能放进子线程；劣质 TF 卡和 AI 一起用会崩；「开关摄像头」和「切换检测模式」不要高频调用。来源：<https://www.unihiker.com/wiki/K10/faq/>。

## 大模型和图像识别的官方入口

板载、且积木能直接调用的图像识别，只有 K10 那四种：人脸（可学习 ID）、猫狗、运动、二维码。入口是 Mind+ 里选 UNIHIKER K10 之后的 AI 积木，不是云端大模型。限制见上：竖屏、人脸最多 48 个 ID、识别框只覆盖人脸和猫脸。来源：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>。

电脑舞台上的图像识别积木，不在行空板上跑。Mind+ V1.6.0 起的「AI图像识别」在实时模式、扩展、网络服务里加载。它要一台带摄像头的电脑和通畅网络，服务器是百度大脑；Mind+ 只是把接口做成积木。能做的包括人脸、常用物体、文字、车牌、手势、人体关键点。默认用公用账户，同时访问有限制；建人脸库要自己的百度 AI 账户。离线替代是同一篇里指出的机器学习（ML5）或硬件模块。来源：<https://mindplus.dfrobot.com.cn/ai_image>。ML5 的图像分类用电脑摄像头和 MobileNet，识别上千种常见物体，不用联网，结果是英文。来源：<https://mindplus.dfrobot.com.cn/ml5-mobilenet>。官网首页另说七类模型可以三步训练，并一键部署到二哈识图 2 和行空板。来源：<https://mindplus.cc/>。部署到板子之后用哪块积木，这次没在仍可打开的文档里核对到。

外接 HUSKYLENS 2 的积木是另一套官方接口，K10、M10 都有，能做物体分类和自学习分类。它不是行空板板载摄像头。来源：<https://wiki.dfrobot.com/sen0638/>。

大模型没有 Mind+ 积木。K10 的官方入口是另刷 xiaozhi-esp32 英文固件，而不是在 Mind+ 里拖一块积木。刷完后到小智网站注册（手机号）、在控制台添加设备、输入 K10 屏幕上的设备码，再在角色配置里改模型和发音人。官方示例建议调 DeepSeek，并把语言限制为英语；每次改角色配置都要重启。能力写成多轮对话、唤醒词、实时翻译。来源：<https://www.unihiker.com/wiki/K10/Playground/XiaozhiAI/>。这会换掉原来的 Mind+ 上传程序所用固件路径，也不能把它说成「积木调用大模型批改数学题」。M10 官方 AI 页写的是本机 Python，并注明没有 AI 加速，算力高的应用可能不流畅。来源：<https://www.unihiker.com/wiki/Playground/AI/>。那里没有大模型积木。

## 对「降题十八掌」规格的边界

孩子以后如果有一块 K10、一台 Windows 电脑和 Mind+ 1.8.1 及以上，规格里可以写成她自己用积木做的：

- 在板载屏上显示文字、图形和 TF 卡里的图片，当作演示屏。
- 打开板载摄像头预览，按键拍照存成 bmp，再把这张 bmp 显示出来。
- 用 A/B 键、光线、温湿度、加速度做输入，用如果 / 否则分成少数几类，并把类名显示在屏幕上。
- 使用预置的人脸、猫狗、动作、二维码，或自定义语音命令词。这些类不是数学错题类。
- 在电脑上改积木，重新上传，再看屏幕。不能写成在展台上不连电脑就改程序。

只能留在成人软件 Demo、不要写成她的 Mind+ 作品的：

- 拍一道数学错题，判断它属于哪一种错因，再生成复盘和训练题。K10 积木没有这种模型；实时模式的图像分类跑在电脑舞台上；大模型入口是另刷固件加云端账号。
- M10 上用 USB 摄像头拍照并显示。官方路径是 OpenCV Python。
- 依赖 HUSKYLENS 2 或别的外接视觉传感器。官方积木有，但这张地图不采购硬件。
- 在 macOS 上用 Mind+ 给 K10 上传。官方平台表是不支持的。

不确定、规格里先不要写死的：

- TinyML / Mind+「部署到行空板」之后，板上到底有没有给初中生用的积木去调用自训图像模型。产品页和 Mind+ 首页说能部署，K10 积木参考没有这条积木，模型训练细页这次打开是 404。
- K10 离线语音合成有没有对应积木。功能列表写了，积木参考的音频节没写。
- M10 官方库除了「显示文字」以外还有多少积木。入门只演示了文字；光线分档、触摸按钮、USB 摄像头的官方例程是 Python。
- K10 商品图替代文字里的 Touchscreen 是否指某次硬件改版。规格表和产品页传感器清单都没有触摸。
