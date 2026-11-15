# Mac 上没有 Windows 时，用什么工具链把程序烧进 K10

调查日期：2026-11-15。回答 wayfinder 研究票 #61。只使用 UNIHIKER / DFRobot 官方 wiki、Mind+ 官网、DFRobot 的开源 BSP 与平台仓库、Espressif 官方工具文档，以及 K10webCam 库的源码。标「未核实」的，都是本次没有在真机上跑过的事，不得当成已定事实。

## 0. 结论

**官方 Mind+ 仍然不能在 macOS 上给 K10 上传。** 2026-11-09 的调研笔记这一条没有过期。官方 K10 支持的平台表把 Mind+ 一行写成 Windows ✅、macOS ❌、GNU Linux ❌，来源：<https://www.unihiker.com/wiki/K10/get-started/>。Mind+ 入门页的提示原文是「Mind+ is only available for Windows at the moment. MacOS/GNU Linux users can code on K10 via Arduino IDE or MicroPython.」，来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mindplus/>。

**排序（按「家长 + 初一孩子能真的把它跑起来」）：**

| 排序 | 路径 | Mac 官方支持 | 上手成本 | 摄像头 / 网络 / TF 文件 | 谁写代码 | 主要风险 |
|---|---|---|---|---|---|---|
| 1 首选 | Arduino IDE 2.x + UNIHIKER BSP 0.0.5 + K10webCam 用户库 | ✅ | 中（装一个 143MB 板级包，一次点按烧录） | 摄像头 ✅、WiFi ✅、TF ✅；`/capture` 取单张 JPEG 已经有人写好 | 家长写一份 C++ 草图，孩子负责烧录与操作 | BSP 仍是 beta；用户库靠 BSP 内部符号；本次没在真机编译 |
| 2 备选 | MicroPython 0.9.8 + ESP LaunchPad 烧录 + Thonny | ✅ | 中低（不用装板级包，浏览器烧固件） | 摄像头 ✅、WiFi ✅、TF ✅；HTTP/socket 服务要自己写，官方没示例 | 家长写 Python，孩子能读能改 | 官方没公开 socket / 取帧格式；0.9.8 注明 AI 功能不能和 WiFi 同时用 |
| 3 | PlatformIO（VSCode）+ 同一个 BSP，`framework = arduino` | ✅ | 高 | 同 1 | 家长 | 比 1 多一层工程配置，孩子碰不到 |
| 4 | ESP-IDF | ❌（官方 K10 文档没有这一页） | 很高 | 要自己写屏和摄像头驱动 | 家长 | 不现实，见第 5 节 |
| — | Schematik（官方文档新列的云端 AI 编程平台） | 待核（浏览器） | 低 | 未核实 | 平台生成 | 需账号、需联网、代码由 AI 生成；不适合写进「孩子自己做」的规格，见第 6 节 |

**一条会直接影响拍照方案的硬事实：** 官方 Arduino 这条路把摄像头固定成 320×240、RGB565。`initBgCamerImage()` 里写死 `register_camera(PIXFORMAT_RGB565, FRAMESIZE_QVGA, 2, xQueueCamer)`，来源：<https://github.com/DFRobot/framework-arduinounihiker/blob/master/libraries/unihiker_k10/src/unihiker_k10.cpp>。`photoSaveToTFCard()` 存的是同一帧的 16 位 BMP，文件大小 `54 + 宽 × 高 × 2 + 12`，同一条源码。所以「板子拍下来的照片够不够读清题面小字」这件事，不是调参问题，是这条路默认只有 320×240。MicroPython 那边的取帧分辨率官方没有写，见第 4 节。

**对现有分工的影响：** 只要还在 Mac 上，孩子原来那套「Mind+ 积木、上传模式」的 K10 分工就落不了地，因为 Mac 上没有任何官方积木入口能把程序烧进 K10。替代品里，Arduino 是家长写、孩子按按钮；MicroPython 是家长写、孩子能读能改。规格里怎么改写这一拍，不在这张票里。

## 1. 判定口径

- 「能在 macOS 上烧录」= 官方文档明写支持 macOS，并且给出了 macOS 的烧录步骤，或官方发布的工具链二进制里有 macOS 版本。
- 「能编译、能烧、能跑」分开写。本次只做到了「源码与头文件逐条核对，证明依赖齐全」，没有在真机编译和烧录。理由：本工作区没有 K10，也没有装 143MB 的板级包。
- 所有「未核实」都在第 8 节再列一次。

## 2. (a) 官方 Mind+ 在 macOS 上给 K10 上传

三处官方证据互相印证，结论是「不支持」：

1. 平台表：Mind+ 一行 Windows ✅ / macOS ❌ / GNU Linux ❌，版本要求 V1.8.1 RC1.0；同表 Arduino IDE、PlatformIO、MicroPython 都是三个系统全 ✅。来源：<https://www.unihiker.com/wiki/K10/get-started/>。
2. Mind+ 入门页的 Note：「Mind+ is only available for Windows at the moment. MacOS/GNU Linux users can code on K10 via Arduino IDE or MicroPython.」，并且写明 K10 只支持 Mind+ V1.8.1 及以上。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mindplus/>。
3. Mind+ 官网下载页：Mind+ V1 的 Mac 版停在 **V1.7.3 RC2.0**（Windows 版是 V1.8.1 RC3.0）；Mind+ V2 的 Mac 版是 V2.0.7，但标注 **「Only support Coding Mode」**。也就是说 Mac 版 V1 版本号低于 K10 要求的 V1.8.1，Mac 版 V2 只给编码模式，不给烧录。来源：<https://mindplus.cc/download-en.html>。

所以「装个新版 Mind+ 就行」不成立。官方给 macOS 用户的替代路径就是 Arduino IDE 或 MicroPython，原文见上面第 2 条。

## 3. (b) Arduino IDE + UNIHIKER K10 板级包 + K10webCam

### 3.1 安装步骤（macOS）

1. 装 Arduino IDE 2.x（官方下载页按系统给包）：<https://www.arduino.cc/en/software/>。
2. 打开 Preferences，把板级包地址加进「Additional boards manager URLs」：`https://downloadcd.dfrobot.com.cn/UNIHIKER/package_unihiker_index.json`；同时把「Compiler warnings」设为 None。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_arduinoide/>。
3. 在 Boards Manager 搜 `unihiker`，装 UNIHIKER 包。索引里当前正式版是 **0.0.5**，压缩包 143,820,656 字节。来源：<https://downloadcd.dfrobot.com.cn/UNIHIKER/package_unihiker_index.json>。
4. 选板：Tools → Board → UNIHIKER K10；**Tools → USB CDC on Boot 必须打开**，否则串口监视器看不到板子打印的内容。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_arduinoide/>。
5. Tools → Model 选 None，不去重刷语音模型（一次只能刷一种语言模型）。来源同上。
6. 放库：把 K10webCam 仓库里 `arduinoC/libraries/unihiker_k10_webcam-main/` 整个目录拷进 `~/Documents/Arduino/libraries/`，或压成 zip 用 Sketch → Include Library → Add .ZIP Library。**不要用仓库里的 `.mpext`**，那是 Mind+ 的用户库打包格式，不是 Arduino 库。
7. 打开 `example/webcam/webcam.ino`，改 SSID 和密码，Upload。
8. 串口监视器 115200 读板子打印的 IP；浏览器开 `http://<IP>/` 有拍照按钮，`/capture` 单张 JPEG，`/stream` 是 MJPEG 流。来源：<https://github.com/YeezB/K10webCam>（README）与同仓库 `arduinoC/libraries/unihiker_k10_webcam-main/unihiker_k10_webcam.cpp`（三个 URI 的注册在 `enableWebcam()` 里）。

### 3.2 macOS 上能不能装、能不能编译

**装：能。** 索引里的工具系统清单包含 macOS 原生架构：

- `xtensa-esp32s3-elf-gcc esp-2021r2-patch5-8.4.0` 同时提供 `x86_64-apple-darwin` 与 **`arm64-apple-darwin`**（文件名 `xtensa-esp32s3-elf-gcc8_4_0-esp-2021r2-patch5-macos-arm64.tar.gz`）。
- `esptool_py 5.1.0` 提供 `esptool-v5.1.0-macos-arm64.tar.gz`。
- `mklittlefs 3.0.0` 只有 `x86_64-apple-darwin`，在 Apple Silicon 上要靠 Rosetta；普通草图上传用不到它。

来源：<https://downloadcd.dfrobot.com.cn/UNIHIKER/package_unihiker_index.json>。官方 K10 平台表把 Arduino IDE 的 macOS 列 ✅，来源：<https://www.unihiker.com/wiki/K10/get-started/>。

**编译：依赖逐条对得上，但本次没编译。** K10webCam 不引用任何奇怪的第三方库，它要的四个东西都在 BSP 里：

| 它 include / 用到的符号 | 在 BSP 里的位置 | 核对结果 |
|---|---|---|
| `app_httpd.hpp` | `tools/sdk/esp32s3/include/modules/web/app_httpd.hpp` | 存在，声明 `register_httpd(...)` |
| `esp_http_server.h` | BSP 自带 ESP-IDF 头文件 | 属于标准 IDF 头 |
| `extern QueueHandle_t xQueueCamer` | `libraries/unihiker_k10/src/unihiker_k10.cpp` 第 32 行 `QueueHandle_t xQueueCamer = NULL;` | 是 Arduino 核心里的全局变量，链接时能对上 |
| `frame2jpg(...)` | `tools/sdk/esp32s3/include/esp32-camera/conversions/include/img_converters.h`，且 `esp_camera.h` 末尾 `#include "img_converters.h"` | 声明可见 |
| `WiFi.h` | 核心自带 `libraries/WiFi` | 存在 |

来源：<https://github.com/DFRobot/framework-arduinounihiker>（上面各文件路径均可在此仓库核对），以及 <https://github.com/YeezB/K10webCam> 的 `unihiker_k10_webcam.cpp` / `.h`。

另外，K10 自己的 `unihiker_k10.h` 里就 `#include "who_camera.h"` 和 `#include "app_httpd.hpp"`，而官方 Arduino 例子能在 Arduino IDE 里编译，说明这两个头所在的目录本来就在包含路径上。来源：<https://github.com/DFRobot/framework-arduinounihiker/blob/master/libraries/unihiker_k10/src/unihiker_k10.h>。

### 3.3 Arduino 这条路能拿到哪些能力

- 屏：`initScreen`、`creatCanvas`、`canvasText`、`canvasLine`、`canvasCircle`、`canvasRectangle`、`canvasDrawCode`，以及摄像头画面当背景 `initBgCamerImage` / `setBgCamerImage`。
- TF 卡：`initSDFile()`、`photoSaveToTFCard("S:/photo.bmp")`、`playTFCardAudio`、`recordSaveToTFCard`。
- 传感器与按键：`readALS`、`readUVS`、`getAccelerometerX/Y/Z`、`buttonA/buttonB` 的回调、`write`（WS2812）等。
- AI：`initAi`、`switchAiMode`、`getFaceData`、`isDetectContent`、`getQrCodeContent` 等。
- 语音：`asrInit`、`addASRCommand`、`isWakeUp`、`isDetectCmdID`。

来源：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_arduinoide/>。

### 3.4 已知限制

- **BSP 仍是 beta。** 官方原文：「The Arduino IDE BSP for UNIHIKER K10 is still in beta (development), there may be some bugs.」来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_arduinoide/>。
- **装板级包可能超时。** 官方列出 Arduino IDE 2.3.x 会报 `4 DEADLINE EXCEEDED`，并给了 Arduino 论坛的解决办法。来源同上。
- **不要装 TFT_eSPI。** FAQ 写：自己装了 TFT_eSPI 会让 K10 屏幕例子黑屏，因为 BSP 里的 TFT_eSPI 没被调到。来源：<https://www.unihiker.com/wiki/K10/faq/>。
- **分辨率锁 320×240。** 见第 0 节，来源：`unihiker_k10.cpp`。
- **摄像头帧队列被两方抢。** 屏幕上显示摄像头时，核心起了 `cameDisPlayTask` 从 `xQueueCamer` 取帧；网络摄像头库的 `/stream` 和 `/capture` 也从同一个队列取帧。队列长度只有 2，一帧只能给一个消费者。会不会导致 `/capture` 偶尔等到旧帧或拿不到帧，本次没在真机验证。
- **内存与崩溃。** 官方 FAQ 写：K10 屏幕大，刷屏占内存多，回调 / 子线程里刷屏会异常重启；劣质 TF 卡配合 AI 会崩；「开关摄像头」和「切换检测模式」不要高频调用。来源：<https://www.unihiker.com/wiki/K10/faq/>。
- **官方 Arduino 例子没有网络例子。** 官方 Arduino/PlatformIO 例子清单里只有显示、传感器、音频、AI、GPIO，没有 WiFi/HTTP。来源：<https://www.unihiker.com/wiki/K10/Examples/examples_arduinoide/>。所以「联网把照片发出去」这段一定得靠用户库或自己写。
- **K10webCam 是个人用户库，不是官方内置库。** README 的兼容表只勾了 K10 的 ArduinoC 一格；MIT 许可；版本 0.0.1 / 0.0.2。来源：<https://github.com/YeezB/K10webCam>，镜像 <https://gitee.com/yeezb/k10web-cam>。

## 4. (c) MicroPython + ESP LaunchPad / Thonny

### 4.1 macOS 烧录步骤（官方写法）

官方明确区分了 Windows 和 Mac/Linux 两条烧录路：

- 固件：MicroPython **0.9.8**（Google Drive 链接在官方页内）。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mpy/>。
- 工具：Flash Download Tool 只有 Windows 版；官方给 macOS / GNU Linux 的办法是用 **ESP LAUNCHPAD**（网页工具）。来源同上。
- 步骤（官方原文顺序）：访问 ESP LaunchPad → 按住 K10 背面的 BOOT，接 USB，松开 BOOT → 点 connect 选串口 → 进 DIY 页 → 选下载好的 .bin → 把 Flash Address 改成 **0x00** → 点 Program。来源同上。
- ESP LaunchPad 需要支持 Web Serial 的浏览器，官方 README 写的是 Chrome 或 Edge。来源：<https://github.com/espressif/esp-launchpad>。Safari 没有 Web Serial，别用 Safari。
- 官方页给的链接是 `https://igrr.github.io/esp-launchpad/`（Thonny 作者的部署），Espressif 自己的部署是同名工具的 <https://espressif.github.io/esp-launchpad/>。两边是同一个网页工具，官方 K10 文档只保证前者。
- 编辑与运行：装 Thonny，选 ESP32 设备，Ctrl+S 存到板子上，文件名 **main.py**；存到电脑上的话重启会丢。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mpy/>，Thonny 下载 <https://thonny.org/>。
- 想换回 Arduino 固件：macOS 用 Arduino IDE 装 BSP，Model 选 EN，上传一个空程序即可。来源同上。

**esptool 命令行（未核实，官方 K10 文档没写这条）**：`pip install esptool` 后用 `esptool --chip esp32s3 -p /dev/cu.usbmodem* erase-flash`、`esptool --chip esp32s3 -p /dev/cu.usbmodem* write-flash 0x00 <firmware>.bin`。命令形态来自 Espressif 官方文档 <https://docs.espressif.com/projects/esptool/en/latest/esp32s3/esptool/basic-commands.html>；0x00 这个地址来自 K10 官方页；macOS 端口名要按实际枚举结果填。

### 4.2 MicroPython 能用的 API（官方例子里的）

- 屏：`from unihiker_k10 import screen`；`screen.init(dir=2)`、`screen.show_camera(camera)`、`screen.show_camera_img(image_data)`、`draw_text`、`draw_line`、`draw_rect`、`draw_circle`、`show_draw`、`clear`。
- 摄像头：`from k10_base import Camera`，`camera = Camera(); camera.init()`；AI 例子用 `import ai` + `ai.camera_start()` + **`ai.camera_capture()`** 取一帧 `image_data`，再交给 `screen.show_camera_img()`。
- TF 卡：`from k10_base import TF_card`；`import os`；`os.listdir("/sd")`。
- 联网：`from k10_base import WiFi, MqttClient`；`wifi.connect(ssid=..., psd=..., timeout=...)`、`wifi.status()`、`wifi.info()`；MQTT 有 `connect/publish/message/received`。
- 其他：`button`、`temp_humi`、`light`、`acce`、`rgb`、`mic`、`speaker`、`servo`、`neopixel`、`dht`、`ds18b20`、`ultrasonic`、`force`、`pin`、`hid`。

来源：<https://www.unihiker.com/wiki/K10/Examples/examples_mpy/>。

**官方没有给的：** 没有 socket / HTTP 服务示例，也没有「把 `image_data` 存成 jpg/bmp 到 TF 卡」的示例。文档仓库里给 MicroPython 准备的 API 参考页 `docs/K10/CodeReference/CodeReference_mpyReference.md` 是 **0 字节的空文件**，来源：<https://github.com/UNIHIKER/unihiker-docs/blob/master/docs/K10/CodeReference/CodeReference_mpyReference.md>。所以「MicroPython 能不能当一个小 HTTP 服务器」「`image_data` 是 JPEG 还是 RGB565」这两件事，官方查不到，只能真机试。

### 4.3 已知限制

- **0.9.8 的 AI 功能不能和 WiFi 同时用。** 官方原文：「The current version (0.9.8) of AI features—including facial recognition, cat/dog recognition, and QR code recognition consumes significant hardware resources. Therefore, simultaneous use of AI and WiFi functionality is not supported at this time.」来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mpy/>。摄像头取帧归在 `ai` 模块里，取帧 + WiFi 在不在这个限制内，未核实。
- 烧录后程序存在板子上，断电不丢（Arduino 固件同理）。来源：<https://www.unihiker.com/wiki/K10/get-started/> 的 Tips。
- 存盘位置决定持久性：存到电脑上的 main.py 重启就没了。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mpy/>。

## 5. (d) PlatformIO 与 ESP-IDF

**PlatformIO：官方支持 macOS，但它就是 Arduino 那条路的另一种壳。**

官方给的 `platformio.ini`：

```ini
[env:unihiker]
platform = https://github.com/DFRobot/platform-unihiker.git
board = unihiker_k10
framework = arduino
build_flags =
    -DARDUINO_USB_CDC_ON_BOOT=1
    -DARDUINO_USB_MODE=1
    -DModel=None
```

来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_platformio/>。同一页写明两个坑：K10 在 PlatformIO 里选不到，必须先随便建一个 DFRobot 板子的工程再改 ini；从第二个工程起串口相关的 build_flags 要手动补。平台表里 PlatformIO 的 macOS 是 ✅，来源：<https://www.unihiker.com/wiki/K10/get-started/>。

**ESP-IDF：平台声明里写了，但实际做不了。**

- `platform-unihiker` 的 `platform.json` 确实声明了两个 framework：`arduino` 和 `espidf`；`boards/unihiker_k10.json` 的 `frameworks` 也是 `["arduino","espidf"]`。来源：<https://github.com/DFRobot/platform-unihiker/blob/master/platform.json>、<https://github.com/DFRobot/platform-unihiker/blob/master/boards/unihiker_k10.json>。
- 但 K10 的屏、摄像头、AI、按键这些驱动不在 ESP-IDF 里，而在 Arduino 核心的 `libraries/unihiker_k10` 和 `tools/sdk/esp32s3/include/modules/{camera,web}` 里。这些是 Arduino 框架的库，`framework = espidf` 不会把它们编进来。来源：<https://github.com/DFRobot/framework-arduinounihiker>。
- 官方 K10 文档站没有 ESP-IDF 页面，Getting Started 只列 Mind+、Arduino IDE、PlatformIO、MicroPython、Schematik。来源：<https://www.unihiker.com/wiki/K10/get-started/>。
- 结论：ESP-IDF 意味着自己重写 ILI9341 屏驱动、GC2145 摄像头初始化、TF 卡和分区表，还要自己解决 AI 模型分区。这是研究项目，不是家长加孩子一个周末能落地的事。不作为候选。

## 6. 附：Schematik（官方文档 2026 年新列的一页）

官方 K10 文档里多了一页 Schematik：云端在线 AI 编程平台，后端编译兼容 Arduino 和 PlatformIO，用自然语言描述需求后由 AI 生成可编译代码，并带「一键固件上传」，步骤是注册账号 → 对话 → 看生成的代码/接线图/引脚图 → 点 deploy 烧到 K10。来源：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_schematik/>，入口 <https://www.schematik.io/>。

它可能是一条「Mac 上完全不装本地工具链」的救急路，但本次没有核实：它要求的浏览器（大概率同样是 Web Serial，即 Chrome/Edge）、免费额度、生成代码的可控性、离线可用性。也没有任何证据说明孩子能用它做「稳定的、每次都一样的」课堂演示。规格里不要写成孩子自己写。

## 7. 对「K10 拍照 → Mac」这条链路的具体影响

1. **分辨率天花板是 320×240。** Arduino 路的取帧和存卡都锁在 QVGA，来源：`unihiker_k10.cpp`。板载是 2MP 传感器，但驱动没用上。题面小字能不能读清，要拿真机拍一张错题实测，别先假设。
2. **存卡是 16 位 BMP。** `photoSaveToTFCard` 写 `bitsPerPixel = 16`、`compression = 3`（BI_BITFIELDS，带 R/G/B 三个掩码），来源同上。Mac 端用 Pillow 读这类 BMP 要自己处理位域，不能用系统预览直接看。
3. **`/capture` 是「现取一帧再压 JPEG」，不是读卡上那个 BMP。** 压缩质量参数是 80，来源：`unihiker_k10_webcam.cpp` 的 `frame2jpg(frame, 80, ...)`。所以 Mac 拿到的是另一帧，不是板上那张文件。这一点和 2026-11-15 的方案稿 A 描述一致。
4. **屏幕预览和 HTTP 取帧共用一个 2 深的帧队列**，见 3.4。演示时如果同时开浏览器预览和脚本取图，失败概率会上升；这和 2026-10-19 探索笔记里「只开一个取图客户端」的结论方向一致。
5. **IP 地址怎么拿到。** webcam 例子只往串口打 IP；Mac 上必须开 USB CDC on Boot 才看得到串口输出。更稳的是家长在草图里把 IP 用 `canvasText` 打到屏上，但这要改代码。

## 8. 不确定项（都没在真机验证）

1. K10webCam 在 BSP 0.0.5 + Arduino IDE 2.x（macOS）下**能否编译通过、能否烧录、`/capture` 能否稳定出图**。头文件、符号、依赖本次已逐条对到源码，但没有实际编译。
2. Apple Silicon 上 `mklittlefs` 只有 x86_64 包，装板级包/上传时是否要 Rosetta。普通草图不用它，但不确定 Arduino IDE 在安装阶段是否强依赖它。
3. MicroPython 固件是否带 `socket` / `usocket`，能否在板上开一个小 HTTP 服务。
4. `ai.camera_capture()` 返回的 `image_data` 是什么格式（JPEG？RGB565？），能否直接写文件存成可读图片，分辨率多少。
5. MicroPython 0.9.8 下「只取帧 + WiFi」是否触发 AI 与 WiFi 不能并用的限制。
6. `esptool` 命令行烧 K10 这条备份路，官方没写，命令和地址是按 Espressif 文档 + K10 页推的。
7. Schematik 在 macOS 上的浏览器要求、账号门槛、生成代码质量。
8. 官网另列了 Mac 版 Mind+ Link V0.2.0，本次没查到它与 K10 有任何关系，不作为路径。
9. 把摄像头分辨率从 QVGA 提到 VGA/更高是否可行：`initBgCamerImage()` 总会按 QVGA 重新 `register_camera`，要改只能绕开它自己初始化，未验证稳定性与内存。

## 9. 来源

- K10 平台支持表：<https://www.unihiker.com/wiki/K10/get-started/>
- K10 + Mind+（Windows only 原文、V1.8.1、上传模式）：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mindplus/>
- K10 + Arduino IDE（BSP 地址、USB CDC、beta、Model）：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_arduinoide/>
- K10 + PlatformIO（platformio.ini、两个坑）：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_platformio/>
- K10 + MicroPython（ESP LaunchPad、0x00、Thonny、0.9.8 AI 与 WiFi、刷回 Arduino）：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mpy/>
- K10 + Schematik：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_schematik/>
- K10 官方 Arduino/PlatformIO 例子清单：<https://www.unihiker.com/wiki/K10/Examples/examples_arduinoide/>
- K10 官方 MicroPython 例子（含 camera_capture、TF、WiFi）：<https://www.unihiker.com/wiki/K10/Examples/examples_mpy/>
- K10 官方 MicroPython 积木例子：<https://www.unihiker.com/wiki/K10/Examples/examples_mpy_block/>
- K10 Arduino/PlatformIO API 列表：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_arduinoide/>
- K10 FAQ（崩溃、TFT_eSPI、TF 卡、高频调用）：<https://www.unihiker.com/wiki/K10/faq/>
- Mind+ 下载页（V1 Mac 1.7.3、V2 Mac「Only support Coding Mode」）：<https://mindplus.cc/download-en.html>
- 板级包索引（0.0.5、macOS arm64 工具链）：<https://downloadcd.dfrobot.com.cn/UNIHIKER/package_unihiker_index.json>
- DFRobot Arduino 核心仓库（unihiker_k10.cpp 的 QVGA / BMP / xQueueCamer，who_camera.h，app_httpd.hpp）：<https://github.com/DFRobot/framework-arduinounihiker>
- DFRobot PlatformIO 平台仓库（platform.json、板定义）：<https://github.com/DFRobot/platform-unihiker>
- K10webCam 库（README、示例、源码三处 URI）：<https://github.com/YeezB/K10webCam>，镜像 <https://gitee.com/yeezb/k10web-cam>
- ESP LaunchPad（Web Serial，Chrome/Edge）：<https://github.com/espressif/esp-launchpad>，在线版 <https://espressif.github.io/esp-launchpad/>
- esptool 基本命令：<https://docs.espressif.com/projects/esptool/en/latest/esp32s3/esptool/basic-commands.html>
- Thonny：<https://thonny.org/>
- UNIHIKER 文档仓库里空的 MicroPython API 参考：<https://github.com/UNIHIKER/unihiker-docs/blob/master/docs/K10/CodeReference/CodeReference_mpyReference.md>
