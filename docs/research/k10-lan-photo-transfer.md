# K10 通过局域网把照片交给 Mac：可行接口核实

> 研究票：ceragon/dragon18#62。调查日期：2026-11-15。
> 范围：只回答「K10 能把一张照片交给 Mac 的全部可行接口，各自要什么、代价是什么」。**不在本文选路**；选路由 #66 决定；Mac 目录与命名由另一张票决定。
> 方法：只使用一手来源——K10webCam 源码（GitHub 与 Gitee 为同一份，SHA-256 一致）、DFRobot 官方 K10 SDK 源码、UNIHIKER 官方 wiki、Mind+ 官方网络服务文档，以及 MQTT 规范、Mosquitto 与 ESP-IDF 的官方文档。
> 标记：**已核实**＝源码或官方文档直接写明；**推算**＝由源码常数算出，尚未在真机文件上验证；**未验证**＝必须真机确认。
> 术语按仓库根目录 `GLOSSARY.md`：错题采集、见题、拆题、复盘、练习、掌、错因。本文只谈「照片」，不改变 `spec-draft.md` 与演示分工。

## 0. 摘要

- 至少五条接口在技术上存在：**(a)** Mac `GET /capture`；**(b)** Mac 从 `/stream` 抓一帧；**(c)** K10 向 Mac 的本地服务 HTTP POST；**(d)** K10 经 MQTT 发布；**(e)** 板端 HTTP 服务器读 TF 卡里的 BMP 再发给 Mac。
- 只有 (a)(b) 是「装一个用户库、拖一块积木」就能到位的；其余三条都要写 ArduinoC 代码，Mind+ 的文档化积木不足以完成图片上传或图片下载。
- **最重要的一条修正**：K10 的摄像头在官方 SDK 里被注册为 **320×240（QVGA）、RGB565、2 个帧缓冲、队列深度 2**。2MP 的 GC2145 不等于 2MP 输出。因此无论走哪条路，局域网里拿到的照片默认都是 QVGA；只有自己改 `register_camera` 的分辨率才可能更高，而那会绕开 K10 库的显示与拍照路径（**未验证**）。
- **板端 JPEG 编码存在，但只对摄像头帧**：`/capture` 与 `/stream` 都用 `frame2jpg(frame, 80, ...)` 把 RGB565 帧压成 JPEG。把 TF 卡里的 BMP 再压成 JPEG，没有现成 API。
- **内存不是最大的拦路虎**：K10 是 ESP32-S3 N16R8，512KB SRAM + 8MB PSRAM；官方 SDK 的 `sdkconfig` 开了 `CONFIG_SPIRAM_USE_MALLOC=y`，大于 4KB 的分配可以落到 PSRAM。一张 QVGA BMP 只有 150KB，base64 后约 200KB，不是「必然爆内存」。真正的卡点是库的固定缓冲（如 PubSubClient 默认 256 字节）、工具链，以及板端程序要同时跑摄像头、WiFi 和上传时的稳定性。
- 若只按「现场活动部件最少、失败可恢复」排序，**(a) `/capture` 看起来最不脆弱**；(b) 是它的备用。这个排序不是选路结论。

## 1. 已核实的事实

### 1.1 摄像头：分辨率、格式、帧队列

| 事实 | 依据 |
|---|---|
| 摄像头注册为 `PIXFORMAT_RGB565`、`FRAMESIZE_QVGA`（320×240）、`fb_count = 2`；注释里列出的备选是 `FRAMESIZE_HVGA`、`FRAMESIZE_240X240` | 官方 SDK `unihiker_k10.cpp` 第 416、419 行：<https://github.com/DFRobot/framework-arduinounihiker/blob/master/libraries/unihiker_k10/src/unihiker_k10.cpp#L414-L421> |
| 帧队列 `xQueueCamer = xQueueCreate(2, sizeof(camera_fb_t *))`，深度 2 帧 | 同上，第 415 行 |
| 屏幕预览任务 `cameDisPlayTask` 也从这个队列取帧；预览关闭时它仍然取帧并归还 | 同上，第 325–352 行：<https://github.com/DFRobot/framework-arduinounihiker/blob/master/libraries/unihiker_k10/src/unihiker_k10.cpp#L325-L352> |
| 显示缓冲常量按 320×240×2 = 153,600 字节硬编码 | 同上，第 341 行 `img_camera.data_size = 153600 / ...` |
| 摄像头只在 `initBgCamerImage()` 里注册；不调用它就没有 `xQueueCamer` | 同上，第 406–422 行 |
| 官方 FAQ 要求：开摄像头/AI 时按键用中断；不要高频调用「开关摄像头」「切换检测模式」；屏幕积木不要放进 MQTT 回调、引脚中断、子线程 | <https://www.unihiker.com/wiki/K10/faq/> |
| 官方 MicroPython 0.9.8 说明：人脸/猫狗/二维码与 WiFi 不能同时使用 | <https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mpy/> |

**推论（推算）**：所有基于 K10 摄像头帧的出口——预览、`/capture`、`/stream`、`photoSaveToTFCard`——拿到的都是同一尺寸的 QVGA 帧。`/capture` 返回的 JPEG 因此是 320×240、质量 80 的单帧。

### 1.2 TF 卡照片：格式、大小、路径、头部缺陷

官方拍照积木与 Arduino 示例都只存 BMP，路径形如 `S:/photo.bmp`：

- 官方积木参考：拍照「仅支持存储为 bmp 格式」，BMP「只支持 16 位颜色位深」：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>（中文页：<https://www.unihiker.com.cn/wiki/k10/mindplus-screen>）
- 官方 Arduino 示例：`k10.photoSaveToTFCard("S:/photo.bmp")`，配 `k10.initSDFile()`：<https://www.unihiker.com/wiki/K10/Examples/examples_arduinoide/>
- SDK 实现：<https://github.com/DFRobot/framework-arduinounihiker/blob/master/libraries/unihiker_k10/src/unihiker_k10.cpp#L478-L539>

从 SDK 源码可读出：

| 项 | 值 | 性质 |
|---|---|---|
| 像素格式 | RGB565，`bitsPerPixel = 16`，`compression = 3`（BI_BITFIELDS），mask R=`0xf800`、G=`0x07e0`、B=`0x001f` | 已核实（源码第 491–502 行） |
| 尺寸 | 320×240（由摄像头帧决定） | 已核实（帧注册为 QVGA） |
| 像素数据 | 320×240×2 = 153,600 字节；按 BMP 规则自下而上写 | 已核实（源码第 514–533 行） |
| 文件大小 | 头部 66 字节 + 153,600 = **153,666 字节**（`fileSize` 字段也按 54 + 数据 + 12 计算） | 推算（源码第 514 行） |
| **头部偏移字段** | `bfOffBits` 写死为 **54**，但实际写入了 **66 字节**头（14 字节文件头 + 40 字节信息头 + 12 字节三位掩码） | 推算（源码第 491、519 行；`sizeof(BMPFileHeader)` = 66） |
| 写入速度 | 逐像素 `lv_fs_write`，每像素一次加锁；所以官方提示拍照后约 0.5 秒画面卡顿、指示灯亮着逐步写卡 | 已核实（源码第 525–533 行；官方积木说明） |
| 完整性信号 | 只有右上角指示灯；没有文件锁、临时文件或完成标记 | 已核实（官方积木说明） |

**这条缺陷很重要**：按 `bfOffBits` 找像素数据的解码器（Pillow 等通常如此）会从第 54 字节开始读，比真正的像素起点早 12 字节，结果整幅图错位、颜色错。Mac 端读这张 BMP 时要么按 66 字节自行定位，要么先修头部。**未验证**：真机文件是否确实如此，以及 Pillow 的实际行为。

### 1.3 K10webCam 用户库：三个端点与它们的真实行为

库源码（GitHub 与 Gitee 同一份，SHA-256 `e53923e2…`）：

- GitHub：<https://github.com/YeezB/K10webCam/blob/master/arduinoC/libraries/unihiker_k10_webcam-main/unihiker_k10_webcam.cpp>
- Gitee：<https://gitee.com/yeezb/k10web-cam>
- README 只写 `IP/stream`：<https://github.com/YeezB/K10webCam/blob/master/README.md>

| 端点 | 行为 | 依据 |
|---|---|---|
| `GET /` | 返回一张 HTML，按钮 `fetch("/capture")` 后下载 `esp32_snapshot.jpg` | 源码第 105–144 行 |
| `GET /stream` | `multipart/x-mixed-replace; boundary=frame`，每帧 `Content-Type: image/jpeg` + `Content-Length`，循环发送 | 源码第 18–68 行 |
| `GET /capture` | 从队列取一帧，`frame2jpg(frame, 80, ...)`，返回 `image/jpeg`，带 `Content-Disposition: attachment; filename=capture.jpg` 和 `Access-Control-Allow-Origin: *` | 源码第 70–103 行 |
| 取帧方式 | 两个 handler 都 `xQueueReceive(xQueueCamer, &frame, portMAX_DELAY)`；没有帧就**无限阻塞** | 源码第 34、75 行 |
| 帧来源 | 与屏幕预览任务共用同一个深度 2 的队列；三个消费者（预览、`/stream`、`/capture`）抢同一批帧 | 1.1 与源码 |
| 依赖 | 必须先 `k10.initBgCamerImage()` 建立 `xQueueCamer`；README 示例也这么做 | 源码；示例 `webcam.ino` |
| HTTP 服务 | `HTTPD_DEFAULT_CONFIG()`，即 80 端口、默认 7 个 socket、4KB 任务栈；没有鉴权 | 源码第 153–188 行 |
| 版本 | V0.0.1 基础功能，V0.0.2 加英文；支持列表只有 K10 的 ArduinoC | README |
| 工具链 | 库本身是普通 Arduino 库，官方 SDK 里有它依赖的 `app_httpd.hpp`；因此理论上可在 Mac 上用 PlatformIO/Arduino IDE 编译（**未编译验证**） | 源码 include；SDK 头文件 <https://github.com/DFRobot/framework-arduinounihiker/blob/master/tools/sdk/esp32s3/include/modules/web/app_httpd.hpp> |

源码里还有两个稳定性隐患（**推算，需真机确认**）：

1. `stream_handler` 在 `httpd_resp_send_chunk` 失败时直接 `break`，跳过 `free(_jpg_buf)`；客户端每次中途断开都会漏掉一块 JPEG 缓冲。反复连断可能耗尽 PSRAM。
2. `disableWebcam()` 会 `esp_camera_fb_return(frame)`，但 handler 归还帧后没有把静态 `frame` 置空；如果之前成功抓过帧，关摄像头时会对同一个指针再归还一次。**不要在拍照/取流之后调用「关闭网络摄像头」**，除非先确认这个版本已修。

另外，ESP-IDF 的 HTTP 服务器默认在单个任务里顺序处理请求；该库没有使用异步 handler。所以 **`/stream` 一旦连上并持续发送，`/` 和 `/capture` 都要等这条流结束**（依据：ESP-IDF 文档说明 `httpd_req_async_handler_begin()` 是「同时处理多个请求」所必需的）：<https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/protocols/esp_http_server.html>。

### 1.4 Mind+ 的网络能力：有 WiFi/MQTT/HTTP，但没有图片上传/下载积木

K10 的积木参考本身没有网络章节（只有屏幕、传感器、LED、音频、AI、串口、引脚、系统）：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>。

网络能力来自 Mind+ 的「网络服务」扩展。官方兼容表列出：WiFi、MQTT、NTP、UDP 广播、HTTP、获取天气、TinyWebDB：<https://www.unihiker.com.cn/wiki/k10/compatibility2>。

Mind+ 上传模式的网络功能文档逐条列出积木：<https://mindplus.dfrobot.com.cn/sc-mk-wangluo>

- MQTT：初始化参数、发起连接、断开、是否连接、**发送消息**、收到某主题消息、收到某主题为某内容的消息。
- WiFi：连接热点、是否成功、断开、获取配置、AP 模式、AP 模式本机 IP、错误码。
- HTTP：参数中加 key/value、**请求体中添加 text**、**HTTP GET 请求**、读取一行内容。
- UDP：服务器/客户端收发广播；NTP；天气；TinyWebDB。

由此可核实：**文档化的 HTTP 积木只有 GET**；虽然有「请求体中添加 text」，但没有 POST 积木，也没有文件/二进制上传积木。**文档化的 MQTT 只有文本消息**，没有 payload 大小说明。用积木完成 (c) 或 (d) 的图片传输没有官方依据。

### 1.5 MicroPython：有 WiFi/MQTT，没有拍照存文件，也没有 HTTP/socket 示例

官方 MicroPython 示例（代码模式）只有：摄像头显示、按键、温湿度、光、加速度、RGB、**TF 卡 `os.listdir("/sd")`**、录放音、WiFi、MQTT、蓝牙 HID、外设、AI：<https://www.unihiker.com/wiki/K10/Examples/examples_mpy/>。

- WiFi：`from k10_base import WiFi`；`wifi.connect(...)`、`wifi.status()`、`wifi.info()`。
- MQTT：`MqttClient`；`publish(topic=..., content='hello')`，`content` 是文本；`received(topic, callback)`；`message(topic)`。
- TF 卡：只演示列目录，路径是 `/sd`。
- 摄像头：`Camera()`、`camera.init()`、`screen.show_camera(camera)`；AI 示例用 `ai.camera_capture()` 只为显示，**没有存成 BMP/JPEG 的官方示例**。
- 没有 `urequests`、`socket` 服务器、HTTP 客户端或文件发送示例。

结论：MicroPython 可以联网、可以发 MQTT 文本，但「拍一张存在 TF 卡上的照片」这条官方路径不存在；因此 (d) 若走 MicroPython，要有自行拍照/读文件的代码，**未验证**。若照片已由 ArduinoC 固件写好，MicroPython 可以读 `/sd` 文件，但两种固件不能同时跑，现场逐张切换不现实。

### 1.6 内存与存储

| 项 | 值 | 依据 |
|---|---|---|
| MCU | ESP32-S3 N16R8，双核 240MHz | <https://www.unihiker.com/wiki/K10/HardwareReference/hardwarereference_specs/> |
| SRAM | 512KB | 同上 |
| PSRAM | 8MB | 同上 |
| Flash | 16MB | 同上 |
| PSRAM 作为堆 | `CONFIG_SPIRAM=y`、`CONFIG_SPIRAM_USE_MALLOC=y`、`CONFIG_SPIRAM_MALLOC_ALWAYSINTERNAL=4096`、`CONFIG_SPIRAM_TRY_ALLOCATE_WIFI_LWIP=y` | 官方 SDK `sdkconfig` 第 1348–1355 行：<https://github.com/DFRobot/framework-arduinounihiker/blob/master/tools/sdk/esp32s3/sdkconfig#L1348-L1355> |

含义：大于 4KB 的分配可以落到 PSRAM，所以 150KB 的 JPEG 缓冲、153KB 的 BMP、甚至 205KB 的 base64 字符串，**容量上**都放得下。风险不在容量，而在：分配是否连续、`String` 扩容时的翻倍峰值与碎片、库的固定小缓冲、以及 WiFi/摄像头/HTTP 同时运行时内部 RAM 的余量。MicroPython 固件是否把 PSRAM 并入堆，官方没有写，**未验证**。

### 1.7 MQTT 的消息上限

| 层 | 限制 | 依据 |
|---|---|---|
| MQTT 协议 | 单个 Control Packet 最大 268,435,455 字节（256MB） | MQTT 3.1.1 规范 §2.2.3：<https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html> |
| Mosquitto（Mac 本地 broker 的常见选择） | `max_packet_size` 自 2.1 起默认 **2,000,000 字节**（整包，不只是 payload）；`message_size_limit` 默认 0，即接受所有合法 MQTT 消息 | <https://mosquitto.org/man/mosquitto-conf-5.html> |
| PubSubClient（Arduino 常见 MQTT 客户端） | `MQTT_MAX_PACKET_SIZE` 默认 **256 字节**，需 `setBufferSize()` 提高 | <https://github.com/knolleary/pubsubclient/blob/master/src/PubSubClient.h> |
| Mind+ MQTT 积木 | 只文档化文本消息；底层实现与缓冲大小未公开 | <https://mindplus.dfrobot.com.cn/sc-mk-wangluo> |

因此：205KB 的 base64 BMP 消息在 Mosquitto 默认配置下**能通过 broker**；但如果客户端是 PubSubClient 且没改缓冲，连 1KB 都过不去。Mind+ 积木属于哪一类，**未验证**。

### 1.8 体积换算

| 对象 | 原始字节 | base64 后（×4/3，向上取整） |
|---|---|---|
| QVGA RGB565 帧 | 153,600 | 204,800 字符 |
| QVGA 16 位 BMP 文件 | 153,666 | 204,888 字符 |
| QVGA JPEG（质量 80） | **未实测**；同类图像经验值约 8–30KB | 约 11–40KB 字符 |

base64 膨胀按 RFC 4648 §4：<https://www.rfc-editor.org/rfc/rfc4648#section-4>。BMP/base64 的数是精确值；JPEG 的是估计值，必须以真机为准。

## 2. 逐条接口

### (a) Mac `GET /capture`

| 项 | 内容 |
|---|---|
| 数据怎么走 | K10 连 WiFi 并开网络摄像头；Mac 请求 `http://<K10-IP>/capture`；K10 从相机队列取一帧、压成 JPEG、作为响应体返回 |
| 固件/工具链 | Mind+ 上传模式 + WiFi 库 + K10webCam 用户库（官方路径需要 Windows）；或 Mac 上用 Arduino IDE/PlatformIO + 同一份库源码（**未编译验证**） |
| 图片格式 | JPEG，质量 80 |
| 分辨率 | **320×240**（帧注册为 QVGA；`frame2jpg` 原样转换）——已核实 |
| 板端 JPEG 编码 | 有，`frame2jpg` |
| 板端内存 | 一帧 RGB565 150KB + JPEG 输出（约 10–30KB）；队列里还可能有 2 帧。PSRAM 可承接 |
| Mac 要跑什么 | 只需 `curl`/`requests`；不需要 broker、不需要本地服务器 |
| 现场活动部件 | K10、热点、Mac；Mac 上一条命令 |
| 失败表现 / 恢复 | 404、超时、连接拒绝；重试即可。若 `/stream` 正开着，`/capture` 会被单任务服务器挡住，直到流结束 |
| 风险 | 与预览任务抢帧（预览可能卡顿）；无鉴权；库 README 没写该端点；`disableWebcam()` 的重复归还隐患；只在 `initBgCamerImage()` 之后可用 |
| 未验证 | JPEG 实际字节数与题面/手写清晰度；`/capture` 与「A 键存 BMP + 显示照片」能否在同一程序里长时间共存；连续 20 次请求是否稳定；Mac 上 PlatformIO 编译该库是否一次通过 |

### (b) Mac 从 `/stream` 抓一帧

| 项 | 内容 |
|---|---|
| 数据怎么走 | Mac 连 `http://<K10-IP>/stream`，按 `multipart/x-mixed-replace` 解析，取一帧 JPEG 后断开 |
| 固件/工具链 | 与 (a) 相同；Mac 端要多一个能解析 MJPEG 的客户端（OpenCV `VideoCapture`、ffmpeg、或手写 multipart 解析） |
| 图片格式 | JPEG，质量 80 |
| 分辨率 | 320×240（同一队列、同一 `frame2jpg`） |
| 板端 JPEG 编码 | 有 |
| 板端内存 | 同上；但流是持续的，长时间运行会持续分配/释放 JPEG 缓冲 |
| Mac 要跑什么 | OpenCV 或 ffmpeg（比 (a) 多一个依赖） |
| 失败表现 / 恢复 | 画面卡住、连接被重置；重连即可，但每次异常断开可能触发 1.3 的缓冲泄漏 |
| 风险 | 单任务 HTTP 服务器被长连接占满，期间 `/` 与 `/capture` 不可用；客户端断开时的 `_jpg_buf` 泄漏；预览明显变慢；只适合一个客户端 |
| 未验证 | macOS 上 OpenCV/ffmpeg 对该流的兼容性；连续开关 10 次后的内存；抓到的帧与屏幕/BMP 是否同一帧（不会，是相邻帧） |

### (c) K10 HTTP POST 到 Mac 的本地服务

| 项 | 内容 |
|---|---|
| 数据怎么走 | K10 拍一张 → 把 JPEG 或 BMP 作为请求体，POST 到 Mac 上监听的 HTTP 服务 → Mac 落盘 |
| 固件/工具链 | **ArduinoC 自定义程序**（PlatformIO/Arduino IDE）。Mind+ 文档化积木只有 HTTP GET，没有 POST、没有文件上传，**不足以完成**。需要 `WiFi` + `HTTPClient`（`POST(uint8_t*, size)` 或 `sendRequest("POST", Stream*, size)`）<br>依据：<https://github.com/espressif/arduino-esp32/blob/master/libraries/HTTPClient/src/HTTPClient.h> |
| 图片来源 | 两种：① 从 `xQueueCamer` 取帧后 `frame2jpg`，直接发 JPEG（约 10–30KB，无需 base64）；② 等 A 键把 BMP 写完，读 `S:/photo.bmp`，发 153,666 字节原始 BMP。①更快，但不是 TF 卡上那张；②与板上原图完全一致，但要等写卡完成 |
| 图片格式 | JPEG（①）或 16 位 BMP（②） |
| 分辨率 | 320×240 |
| 板端 JPEG 编码 | ①有；②没有「BMP 转 JPEG」的现成 API，只能发 BMP |
| 板端内存 | ①约 150KB 帧 + 10–30KB JPEG；②153KB 文件可分块读、分块发，或整块读入 PSRAM。base64 只会让体积和拷贝次数变差，**没有必要** |
| Mac 要跑什么 | 一个监听 `0.0.0.0` 的本地 HTTP 服务（Python `http.server` 的 `do_POST` 即可），并允许防火墙入站；K10 要能解析到 Mac 的 IP |
| 现场活动部件 | K10、热点、Mac、**先启动的本地服务**；比 (a) 多一个必须活着的进程 |
| 失败表现 / 恢复 | 连接失败/超时：板上要重试或提示；Mac 服务没开就必然失败。失败后照片仍在 TF 卡，可改走 (a)/(e) |
| 风险 | 全是自写代码；摄像头 + WiFi + HTTP 客户端 + 显示同时跑；`HTTPClient` 的超时与重试要自己写；Content-Length 要正确（BMP 头部的 `fileSize` 可用，但 `bfOffBits` 有缺陷）；Mac IP 会变 |
| 未验证 | 自定义程序在 K10 上同时开摄像头、WiFi、POST 的稳定性；153KB 流式 POST 是否一次成功；Mind+ HTTP 积木是否其实支持 POST（文档没写） |

### (d) MQTT 发布

| 项 | 内容 |
|---|---|
| 数据怎么走 | K10 把图片 base64 后作为一条 MQTT 消息 publish 到某个 topic；Mac 上的 broker + 订阅者收下、解码、落盘 |
| 固件/工具链 | 三选一：Mind+ 的 WiFi+MQTT 积木（文本消息）；MicroPython `k10_base.MqttClient.publish(content=...)`（文本）；ArduinoC PubSubClient（需 `setBufferSize`）。前两者没有图片/二进制 API |
| 图片格式 | base64 文本，解码后是 JPEG 或 BMP |
| 分辨率 | 320×240 |
| 板端 JPEG 编码 | 若用摄像头帧，有；若用 TF 的 BMP，没有 |
| 体积 | JPEG：约 13–40KB 字符；BMP：204,888 字符（精确） |
| broker 限制 | Mosquitto 2.1+ 默认整包上限 2,000,000 字节，205KB 的消息能过；协议上限 256MB。PubSubClient 默认 256 字节，必须调大 |
| Mac 要跑什么 | MQTT broker（Mosquitto 或 SIoT）+ 订阅脚本。SIoT 是 DFRobot 的开源本地 MQTT 服务器，有 macOS 版：<https://mindplus.dfrobot.com.cn/siot> |
| 现场活动部件 | K10、热点、Mac、broker、订阅者；四个活动部件 |
| 失败表现 / 恢复 | 连接失败、消息被 broker 拒、订阅端解码失败；照片仍在 TF 卡 |
| 风险 | base64 的额外拷贝与 `String` 扩容峰值；一条 200KB 的消息对客户端和 broker 都是一次性大分配；Mind+ 积木的底层缓冲未知；QoS/retain 配错会留下旧图；K10 端 publish 可能阻塞，影响摄像头 |
| 未验证 | Mind+ MQTT 单条消息实际能发多大；MicroPython `publish` 传 200KB 字符串是否可行；Mac 上 broker 的默认配置是否允许非本机连接（Mosquitto 默认只监听本机，需要显式 `listener`） |

### (e) 板端 HTTP 服务器读 TF 卡 BMP 再发给 Mac

| 项 | 内容 |
|---|---|
| 数据怎么走 | K10 先按 A 存 `S:/photo.bmp`；板上的 HTTP 服务器在另一个 URI（如 `/photo.bmp`）打开该文件，分块把原始字节发给 Mac |
| 固件/工具链 | **ArduinoC 自定义程序**。需要：(1) 读 TF 文件——官方 `initSDFile()` 初始化后，用 LVGL 的 `lv_fs_open/read`（SDK 自己就这么写 BMP）或 `SD` 库；(2) 注册 URI handler 并用 `httpd_resp_send_chunk` 发送——`esp_http_server` 文档：<https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/protocols/esp_http_server.html> |
| 端口冲突 | K10webCam 已经在 80 端口起了一个 httpd。要么改库、在同一个 server 上多注册一个 URI，要么另起一个 httpd 到别的端口（如 8081）。两套服务器 + 摄像头 + WiFi 的任务与内存要重新评估 |
| 图片格式 | **BMP，16 位，原样**；板上没有把 BMP 再压 JPEG 的 API |
| 分辨率 | 320×240；文件 153,666 字节 |
| 板端 JPEG 编码 | 没有（对文件而言）；`frame2jpg` 只接受 `camera_fb_t` |
| 板端内存 | 最优：1–4KB 环形缓冲分块发送，不需要整文件入内存 |
| Mac 要跑什么 | 只需 `curl -o photo.bmp`；之后用 Pillow 转换（注意 1.2 的头部偏移缺陷） |
| 现场活动部件 | K10、热点、Mac；和 (a) 一样少 |
| 失败表现 / 恢复 | 文件还没写完就请求 → 拿到截断的 BMP；重试要等指示灯灭 |
| 风险 | 全是自写代码；`lv_fs_read` 与 LVGL/显示共用 SPI，需要按 SDK 的做法拿 `xSPIlMutex`（该锁在 SDK 里是全局的，但不在公开 API 文档里）；拍照是逐像素写卡，可能几秒才完成，没有原子完成标记；BMP 头部偏移缺陷会让 Mac 端解码错位；端口冲突 |
| 未验证 | `lv_fs_read` 与显示/摄像头并发是否安全；第二个 httpd 是否稳定；如何在不看指示灯的情况下判断文件写完；Mac 端 Pillow 对该 BMP 的实际解析结果 |

## 3. 机制对比表

| | (a) `/capture` | (b) `/stream` 抓帧 | (c) K10 POST | (d) MQTT | (e) 板端读 TF 发 BMP |
|---|---|---|---|---|---|
| 谁发起 | Mac 拉 | Mac 拉 | K10 推 | K10 推 | Mac 拉 |
| 需要的板端工具链 | Mind+ 积木 + 用户库；或 Mac 上 ArduinoC 编译同一库 | 同 (a) | ArduinoC 自写 | Mind+ 积木 / MicroPython / ArduinoC | ArduinoC 自写 |
| Mac 端要跑 | `curl` | OpenCV/ffmpeg | 本地 HTTP 服务（必须先起） | broker + 订阅者 | `curl` |
| 图片格式 | JPEG q80 | JPEG q80 | JPEG 或 BMP | base64(JPEG/BMP) | BMP 16 位 |
| 分辨率 | 320×240 | 320×240 | 320×240 | 320×240 | 320×240 |
| 典型体积 | 约 10–30KB（估） | 同左 | 10–30KB 或 153,666B | 13–40KB 字符，或 204,888 字符 | 153,666B |
| 板端 JPEG 编码 | 有 | 有 | 有（仅摄像头帧） | 有（仅摄像头帧） | 无 |
| 板端内存风险 | 低—中 | 中（长连接 + 潜在泄漏） | 中 | 中—高（大字符串 + 客户端缓冲） | 低（分块） |
| 现场活动部件 | 3 | 3 | 4 | 5 | 3 |
| 失败可恢复 | 高（重试） | 中（重连可能泄漏） | 中（看板上重试逻辑） | 中低 | 中（要等文件写完） |
| 与板上 BMP 是否同一张 | 否，相邻帧 | 否，相邻帧 | ①否；②是 | ①否；②是 | **是** |
| 文档化程度 | 源码有、README 没写 | README 有 | 无（积木只有 GET） | 消息有、图片无 | 无 |
| 主要未验证点 | 清晰度、与存卡/预览共存 | 客户端兼容、长连接稳定性 | 自写程序的稳定性 | 积木的 payload 上限 | 文件读并发、端口、BMP 头 |

## 4. 哪个看起来最不脆弱（不选路）

只按「现场活动部件最少、失败可恢复、Mac-only 工具链能跑通」这三条看：

1. **(a) `GET /capture` 看起来最不脆弱。** 板端只多一个用户库和一块「开启网络摄像头」积木；Mac 端只有一条 HTTP GET，不需要 broker、不需要常驻服务、不需要 OpenCV。失败是可见的（404/超时/空文件），重试成本最低。它的脆弱点集中在库里：与预览抢帧、无鉴权、关摄像头时的重复归还隐患、以及「必须先 `initBgCamerImage()`」。这些都是「避开某些操作」就能绕开的，而不是每次都要写对的一段新代码。
2. **(b) `/stream`** 是 (a) 的同源备用，但长连接会占满单任务 HTTP 服务器，断开还可能泄漏缓冲；它更适合当 (a) 失败时的兜底，而不是首选。
3. **(e) 板端发 BMP** 的内存最省、拿到的还是板上原图，但要多写一套 HTTP handler 和文件读取，且要处理「文件写完没有」与 80 端口冲突；代码量与失败面都比 (a) 大。
4. **(c) POST** 要求 Mac 上先有一个活着的服务，把「照片能不能到」与「服务在不在」绑在一起；现场多一个必须先启动、且可能被防火墙拦下的进程。
5. **(d) MQTT** 活动部件最多，还要 base64；文档化的积木只保证文本消息，最容易撞上固定缓冲或编码上限。

**但这不是选路结论**：如果 QVGA 的清晰度不够，五条路都会卡在同一件事上——照片本身读不清题面。选路要把「传输是否稳」和「照片是否够清楚」一起看，#66 决定。

## 5. 共同的未验证点（按影响排序）

1. **清晰度**：320×240 的 JPEG/BMP 能否读清一道初中数学题的题面小字和手写错解。这是所有接口的共同上限，不是某条路的问题。
2. **共存稳定性**：`/capture`（或 `/stream`）与「A 键存 BMP + 屏幕显示照片」能否在同一个上传程序里连续跑 10 分钟、拍 20 张而不重启。官方示例是分开的。
3. **BMP 头部**：真机文件的 `bfOffBits` 是否真的为 54 而像素从 66 开始；Pillow / 预览能否直接打开。若不能，Mac 端要修头或按 66 解析。
4. **Mind+ MQTT 的实际 payload 上限**：是沿用 PubSubClient 的 256 字节，还是已经调大；这决定 (d) 是否完全不可行。
5. **Mac-only 工具链**：在 macOS 上用 PlatformIO 编译 K10webCam 用户库能否一次通过（SDK 与头文件都在，但没有编译记录）。
6. **`/capture` 与 `/stream` 的互斥**：单任务 HTTP 服务器下，两者不能同时用；现场只能开一个取图客户端。
7. **PSRAM 的实际可用量**：SDK 开了 `SPIRAM_USE_MALLOC`，但 WiFi/摄像头/显示同时运行时还剩多少连续块，没有实测。

## 6. 对既有 `docs/capture-pipeline-plan.md` 的事实修正

那篇方案稿写于本票之前，以下几条应更新（不改它的结论，只更正事实）：

- **分辨率**：原文说「官方没有写 `/capture` 的分辨率，也没有写拍照 BMP 的分辨率」。现在可以从 SDK 源码确认两者都是 **320×240**（QVGA、RGB565）。这不是「未验证」，是「已核实、但官方文档没写」。
- **内存判断**：原文说「一张 320×240 的 BMP 约 150KB，base64 后约 200KB……把大文件上传放在板子上，是把最不稳定的部分放到资源最少的设备上」。体积数字对，但 K10 有 8MB PSRAM 且 SDK 允许大分配落 PSRAM；**容量不是主要障碍**，真正的障碍是库的固定缓冲、自写代码的稳定性和活动部件数量。这句话的理由要改写。
- **工具链**：原文把「Windows + Mind+」当成前置门槛。就 (a) 而言，K10webCam 是普通 Arduino 库，官方 SDK 也在 GitHub 上；Mac 上用 PlatformIO 编译是**可能**的，只是**未验证**。这不等于已经跑通，但「必须 Windows」对 (a) 不是硬结论。
- **BMP 解码**：原文说「用 Pillow 读 16 位 BMP 再转 JPEG」。按 SDK 源码，BMP 的 `bfOffBits` 写成 54、实际头部 66 字节；Pillow 可能错位 12 字节。真机文件要先验证，不能假设直接可读。
- **`/capture` 与 `/stream` 的关系**：原文把它们当「主用/备用」。源码与 ESP-IDF 文档显示二者共用帧队列，且 HTTP 服务器单任务处理，**不能同时开**；切换前要断开另一个。

## 7. 依据

### K10 与 K10webCam

- K10webCam 源码（GitHub）：<https://github.com/YeezB/K10webCam/blob/master/arduinoC/libraries/unihiker_k10_webcam-main/unihiker_k10_webcam.cpp>
- K10webCam 源码（Gitee，与 GitHub 同一份）：<https://gitee.com/yeezb/k10web-cam>
- K10webCam README（只写 `/stream`）：<https://github.com/YeezB/K10webCam/blob/master/README.md>
- 官方 K10 Arduino 框架源码（摄像头注册、BMP 写入）：<https://github.com/DFRobot/framework-arduinounihiker/blob/master/libraries/unihiker_k10/src/unihiker_k10.cpp>
- 官方 K10 PlatformIO 平台（SDK 入口）：<https://github.com/DFRobot/platform-unihiker>
- 官方 SDK 的 PSRAM 配置：<https://github.com/DFRobot/framework-arduinounihiker/blob/master/tools/sdk/esp32s3/sdkconfig#L1348-L1355>
- K10 规格（N16R8、512KB SRAM、8MB PSRAM）：<https://www.unihiker.com/wiki/K10/HardwareReference/hardwarereference_specs/>
- K10 积木参考（拍照只支持 BMP、16 位、指示灯 0.5 秒）：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>
- K10 屏幕积木中文页（同上，中文原文）：<https://www.unihiker.com.cn/wiki/k10/mindplus-screen>
- K10 Arduino/PlatformIO API（`initSDFile`、`photoSaveToTFCard`）：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_arduinoide/>
- K10 Arduino 示例（`S:/photo.bmp`）：<https://www.unihiker.com/wiki/K10/Examples/examples_arduinoide/>
- K10 MicroPython 示例（WiFi、MQTT、TF 卡列目录，无拍照存文件）：<https://www.unihiker.com/wiki/K10/Examples/examples_mpy/>
- K10 MicroPython 中文库说明（`k10_base` 的 WiFi/MQTT/TF 卡 API）：<https://www.unihiker.com.cn/wiki/k10/micropython_unihiker_k10>
- K10 MicroPython 入门（0.9.8 下 AI 与 WiFi 不能同时用）：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_mpy/>
- K10 FAQ（MQTT/中断/子线程里的屏幕积木、TF 卡与 AI、卡顿）：<https://www.unihiker.com/wiki/K10/faq/>
- K10 PlatformIO 入门：<https://www.unihiker.com/wiki/K10/GettingStarted/gettingstarted_platformio/>

### Mind+ 网络能力

- Mind+ 上传模式网络功能（MQTT/WiFi/NTP/UDP/HTTP 积木清单，HTTP 只有 GET）：<https://mindplus.dfrobot.com.cn/sc-mk-wangluo>
- K10 官方兼容表（网络服务 = WiFi、MQTT、NTP、UDP、HTTP、天气、TinyWebDB）：<https://www.unihiker.com.cn/wiki/k10/compatibility2>
- SIoT 本地 MQTT 服务器（含 macOS 版）：<https://mindplus.dfrobot.com.cn/siot>

### 传输与协议

- MQTT 3.1.1 规范（Control Packet 上限 268,435,455 字节）：<https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html>
- Mosquitto 配置手册（`max_packet_size` 默认 2,000,000；`message_size_limit` 默认 0）：<https://mosquitto.org/man/mosquitto-conf-5.html>
- PubSubClient 默认缓冲 256 字节：<https://github.com/knolleary/pubsubclient/blob/master/src/PubSubClient.h>
- ESP32 Arduino `HTTPClient`（`POST(uint8_t*, size)`、`sendRequest(..., Stream*, size)`）：<https://github.com/espressif/arduino-esp32/blob/master/libraries/HTTPClient/src/HTTPClient.h>
- ESP-IDF `esp_http_server`（单任务顺序处理；异步 handler 才可并发）：<https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/protocols/esp_http_server.html>
- RFC 4648 §4（base64 膨胀 4/3）：<https://www.rfc-editor.org/rfc/rfc4648#section-4>
