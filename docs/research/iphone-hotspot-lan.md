# iPhone 个人热点下，Mac 和行空板 K10 能不能互相访问

调查日期：2026-11-16。对应工单：[#64](https://github.com/ceragon/dragon18/issues/64)。
只把 Apple 官方文档、UNIHIKER / DFRobot 官方文档与 Espressif 官方文档当作事实依据；社区实测、抓包和论坛回答单独标注，不当成官方承诺。

## 0. 结论

- **物理与加密层可以连上**：K10 是 ESP32-S3，官方规格只支持 **2.4GHz、IEEE 802.11b/g/n**；iPhone 打开「最大兼容性」后官方明确只广播 **2.4GHz**，并把热点加密固定为 **WPA2 Personal**。这两条正好对上。
- **应用层能不能互访，Apple 没有官方承诺**。iPhone 个人热点不是文档里的「路由器」，Apple 没有公开说明客户端之间是否隔离。现代 iOS 的社区实测（iOS 15.1.1、iOS 18.1.1）倾向于「同一热点下的设备可以互访」，但旧帖也有相反说法。**必须现场用 60 秒测试确认**，不能把「能互访」写成已定事实。
- **「必须打开最大兼容性」这个说法方向正确，但理由要补全**：不只是为了 2.4GHz，也是为了让热点从默认的 WPA2/WPA3 混合模式降到 **纯 WPA2**。K10 官方 FAQ 明确要求热点侧用 WPA2，K10 才能连上。
- **K10 的 IP 最可靠的来源是 K10 自己的屏幕**（程序里用 `wifi.info()` 或 Mind+ WiFi 扩展的 IP 报告积木显示）。iPhone 没有公开的 DHCP 租约/客户端列表；Mac 侧可以用 `arp -a` 和 /28 网段 ping 扫描兜底。
- **固定 IP 不作为推荐路径**：文档化的 K10 WiFi API 只接受 SSID / 密码 / 超时，没有静态 IP 参数；Arduino 层虽然能 `WiFi.config()`，但 iPhone 热点只有 13 个可用地址（172.20.10.2–14），静态 IP 容易撞车。

## 1. iPhone 个人热点怎么切到 2.4GHz，切了之后发生什么

### 1.1 官方事实

Apple《Apple Platform Security》的 “Maximize Compatibility Mode” 一节写明，iPhone 12 及以后可以打开个人热点的「最大兼容性」；打开后它会做三件事：

> - Turns off 5GHz (and, if applicable, 6GHz)
> - Restricts the device to the use of only 2.4GHz
> - Enforces a WPA2 Personal Security Mode

同一份文档的 “Personal Hotspot and Internet Sharing security” 一节写明，iOS / iPadOS 个人热点默认支持 **WPA2/WPA3 Personal**，只有打开最大兼容性时才变成 **WPA2 Personal**。
来源：<https://support.apple.com/en-ge/guide/security/secfd166f620/web>

Apple 的 iPhone 使用手册也写了：设置 > 个人热点里打开「最大兼容性」；并提示「Maximize Compatibility may reduce performance for devices connected to your Personal Hotspot when turned on.」
来源：<https://support.apple.com/guide/iphone/share-your-internet-connection-iph45447ca6/ios>

### 1.2 操作步骤

1. iPhone：设置 > 个人热点 > 打开「允许其他人加入」。
2. 同一页打开「最大兼容性 / Maximize Compatibility」。iPhone 12 以前没有这个开关，那些机型本来也只广播 2.4GHz。
3. 记下热点名和 Wi-Fi 密码。热点名默认等于设备名；建议把设备名临时改成**纯 ASCII 英文**（例如 `K10-LAB`），避免 K10 的 WiFi 库对中文 SSID 处理不一致（这一点官方没写，属于保守建议）。
4. 设置一个至少 8 位的 WPA2 密码，建议只用英文字母和数字。
5. 让 K10 和 Mac 都连这个热点。**Mac 也用 Wi-Fi 连**，不要一边 Wi-Fi、一边 USB/蓝牙，避免两个接口拿到不同网段。

### 1.3 打开后有什么变化

| 项目 | 关闭最大兼容性（默认） | 打开最大兼容性 |
|---|---|---|
| 频段 | 可能 5GHz / 6GHz，Apple 未说明是否同时广播 2.4GHz | **只有 2.4GHz**（官方明确） |
| 加密 | WPA2/WPA3 Personal 混合 | **WPA2 Personal**（官方明确） |
| 性能 | 较高 | 官方提示可能下降 |
| SSID | 广播，名称=设备名 | 不变，仍广播 |
| 客户端互访 | Apple 未说明 | Apple 未说明，不因这个开关而改变 |

结论：对 K10 这条链路，**应当打开最大兼容性**。它是 Apple 官方文档里唯一能保证「2.4GHz + 纯 WPA2」的开关。

## 2. 同一热点下，Mac 与 K10 能否互访（客户端隔离）

### 2.1 官方怎么说

**Apple 没有公开说明个人热点是否做客户端隔离。** 查到的 Apple 文档只讲频段、加密、连接方式和排障，没有一句承诺「同一热点下的两台客户端可以互相访问」，也没有提供关闭/打开隔离的开关。
来源（均未提及客户端互访）：<https://support.apple.com/en-us/111785>、<https://support.apple.com/en-us/119837>、<https://support.apple.com/en-ge/guide/security/secfd166f620/web>

因此这一条必须标为**未验证**。不能因为「物理上在同一个子网」就推断一定能互访。

### 2.2 社区证据（非官方，仅作倾向性参考）

Apple StackExchange 同一问题下，回答随时间变化：

- 2015 年回答：称个人热点只用于共享蜂窝数据，多个客户端之间不能互连；但回答者自己承认「找不到 Apple 文档确认」。
- 2021 年回答：iPhone 13、iOS 15.1.1 下，Mac 能通过 `ssh pi@raspberrypi.local` 登录同一热点下的树莓派，说明客户端可见。
- 2024 年回答：iPhone 15、iOS 18.1.1 下，Android 客户端与 macOS（跑 WireGuard）可以互通，明确说「cross-connectivity is enabled」。

来源：<https://apple.stackexchange.com/questions/194842/iphone-is-the-hotspot-isolated-can-you-see-other-devices>

**倾向性结论**：近几年的 iOS 大概率允许同一热点客户端互访；但这不是 Apple 承诺，可能随 iOS 版本、运营商、机型变化。现场必须实测。

### 2.3 60 秒最小测试

前提：Mac 和 K10 都已连上同一个 iPhone 热点，K10 屏幕已显示自己的 IP。

1. Mac 上确认自己的地址：
   ```bash
   ipconfig getifaddr en0
   ```
   期望看到 `172.20.10.x`。若为空，说明 Mac 的 Wi-Fi 接口不是 en0，用 `networksetup -listallhardwareports` 找 Wi-Fi 对应的接口。
2. 记下 K10 屏幕 IP（例如 `172.20.10.3`），从 Mac 测：
   ```bash
   ping -c 3 172.20.10.3
   nc -vz -w 3 172.20.10.3 80
   ```
   - `ping` 通、`nc` 通：链路可用。
   - `ping` 不通但 `nc` 通：ICMP 被拦，不影响 HTTP，按可用处理。
   - 两个都不通，但两边都能上网：高度怀疑客户端隔离。
3. 反向确认（可选）：Mac 上开一个临时 HTTP 服务，让 K10 去取：
   ```bash
   python3 -m http.server 8000
   ```
   若 K10 能 GET `http://<Mac-IP>:8000/`，说明双向都通；若只有 Mac→K10 通，也够本方案用。
4. 判定：
   - 两边都是 `172.20.10.x`、网关都是 `172.20.10.1`，但互相不通 → 按「客户端隔离」处理。
   - 两边不在同一网段 → 先解决网段问题（例如 Mac 走了 USB/蓝牙，或其中一台连了别的 Wi-Fi）。

### 2.4 如果确实被隔离

iPhone 设置里**没有**关闭客户端隔离的开关。这条链路的兜底策略不属于本票范围，见「局域网链路失败时怎么办」（#70）。本票只确认事实与测试方法。

## 3. K10 的 WiFi 要求

### 3.1 频段与协议（官方）

UNIHIKER K10 官方规格表：

> Wi-Fi Specification：IEEE 802.11b/g/n
> Frequency：2.4G
> Band width：20MHz、40MHz

来源：<https://www.unihiker.com/wiki/K10/HardwareReference/hardwarereference_specs/>

所以：

- **只支持 2.4GHz**，5GHz 根本扫不到，不是「连不上」而是「看不见」。
- 支持 802.11n，20/40MHz 带宽；iPhone 热点用哪个信道由 iPhone 决定，K10 不需要设置。
- 芯片是 ESP32-S3 N16R8（同一页），WiFi 能力来自 ESP32-S3。

### 3.2 加密方式：WPA2 是硬要求

K10 官方 FAQ 的 WiFi 一节有一条：

> Q: K10 unable to connect to the hotspot on the UNIHIKER M10.
> A: UNIHIKER M10 must have the OS of version 0.3.7 or above, and then switch the mode to WPA2 in "5-Switch Wireless Hotspot Mode".

来源：<https://www.unihiker.com/wiki/K10/faq/>

这条虽然讲的是 M10 的热点，但它是 UNIHIKER 官方对「K10 连什么样的热点」给出的唯一明确加密要求：**热点侧要用 WPA2**。因此：

- iPhone 默认的 **WPA2/WPA3 Personal 混合模式对 K10 有风险**。
- 打开「最大兼容性」把热点强制成 **WPA2 Personal**，正好消除这个风险。
- 这也是本项目「必须打开兼容模式」的真正理由：**频段 + 加密，两条都要**。

补充：ESP32-S3 本身支持 WPA2、WPA3 和 PMF，WPA3 只在 Station 模式；如果 AP 是 WPA3 Transition（同时广播 WPA2/WPA3），ESP32-S3 在启用 WPA3 时会优先选 WPA3。但 K10 的固件/WiFi 库是否启用了 WPA3、是否配置了 PMF，官方没有写。**不要赌 K10 能走 WPA3，直接让热点用 WPA2 最稳。**
来源：<https://docs.espressif.com/projects/esp-idf/en/v5.0/esp32s3/api-guides/wifi-security.html>

### 3.3 SSID 隐藏、特殊字符

- UNIHIKER 文档没有说 K10 支持连接隐藏 SSID。iPhone 个人热点默认广播 SSID，**不需要隐藏**，也不建议隐藏。
- 官方没有给 SSID/密码的字符集限制。保守做法：SSID 用纯 ASCII、密码用 8 位以上字母数字，避免中文、空格、emoji 带来的兼容问题（这一条是工程建议，不是官方事实）。

### 3.4 K10 怎么拿到并显示 IP

官方 MicroPython 示例（Communication - Wifi）：

```python
from k10_base import WiFi
wifi = WiFi()
wifi.connect(ssid="DFRobot-guest", psd="dfrobot@2017", timeout=50000)
wifi.status()   # True=已连接
wifi.info()     # 返回当前 IP、子网掩码、网关等信息的字符串
```

来源：<https://www.unihiker.com/wiki/K10/Examples/examples_mpy/>

要点：

- K10 通过 **DHCP** 从 iPhone 拿地址；API 只有 `ssid`、`psd`、`timeout`，**没有静态 IP 参数**。
- `wifi.info()` 能拿到 IP；把它的返回值用屏幕文字积木显示出来，就是现场最可靠的 IP 来源。
- Mind+ 图形化路径：官方「网络服务」兼容表列出 WiFi 支持，但 K10 的 Mind+ 积木参考页没有单独列 WiFi 积木（WiFi 是扩展库）。用 Mind+ WiFi 扩展的连接积木 + 读取 IP 的报告积木即可；**具体积木名称本票未逐一核对，标为未验证**。
  来源：<https://www.unihiker.com.cn/wiki/k10/compatibility2>、<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>

## 4. 在 Mac 上怎么发现 K10 的 IP

按可靠性从高到低：

### 4.1 首选：看 K10 屏幕

K10 程序里把 `wifi.info()` 的 IP 显示在 240×320 屏幕上，字号用 24。现场抄一次，写进 Mac 的配置。这是唯一不依赖 iPhone 隐藏信息的办法。

### 4.2 看 Mac 自己的地址，确认在同一网段

```bash
ipconfig getifaddr en0
route -n get default | grep gateway
```

若 Mac 是 `172.20.10.x`、网关 `172.20.10.1`，说明在 iPhone 热点网段。iPhone 热点的网段 Apple 没有公开文档，但抓包与长期观察显示是 `172.20.10.0/28`、网关 `172.20.10.1`、可用地址 `172.20.10.2–14`。**这是观察值，不是 Apple 官方承诺**；不同 iOS/运营商可能不同。
来源（非官方，含 DHCP 抓包）：<https://www.redelijkheid.com/blog/2015/7/30/apple-ios-personal-hotspot-annoyances>

### 4.3 `arp -a` 碰运气

```bash
arp -a -n | grep '172\.20\.10\.'
```

只有 K10 和 Mac 之间已经发生过流量（或 K10 发过广播）时，ARP 表里才会有它。刚连上时经常是空的，不能作为唯一手段。

### 4.4 /28 网段 ping 扫描（推荐兜底）

iPhone 热点只有 13 个可用地址，扫一遍很快：

```bash
for i in $(seq 2 14); do
  ping -c1 -W1 172.20.10.$i >/dev/null 2>&1 && echo "alive: 172.20.10.$i"
done
arp -a -n | grep '172\.20\.10\.'
```

- 若网段不是 `172.20.10.x`，先按 4.2 确认实际网段再改循环范围。
- 扫完再看 `arp -a`，通常能看到 K10 的 MAC 与 IP 对应关系。
- 有 `nmap` 的话更省事：`nmap -sn 172.20.10.0/28`（macOS 默认没装，非必需）。

### 4.5 mDNS（大概率不可用）

ESP32 默认不启动 mDNS；K10 的 WiFi/WebCamera 库是否调用 `MDNS.begin()` 官方没有写。可以试，但不要依赖：

```bash
dns-sd -B _http._tcp local     # 浏览局域网 HTTP 服务，Ctrl-C 退出
ping k10.local                 # 主机名未知时不会成功
```

若 K10 程序里显式加了 mDNS，`<hostname>.local` 可能可用；否则跳过。

### 4.6 DHCP 租约 / 客户端列表

**iPhone 设置里没有公开的 DHCP 租约列表或客户端列表**，iOS 也没有给用户查看的入口。不要指望在 iPhone 上查到 K10 的 IP。这一点标为「无官方能力」。

### 4.7 固定 IP 可行吗

- **文档化的 K10 API 不可行**：`wifi.connect(ssid, psd, timeout)` 没有静态 IP 参数。
- **Arduino/PlatformIO 层技术上可行**：ESP32 的 `WiFi.config(ip, gateway, subnet)` 可以设静态地址；但 K10 官方 Mind+ 路径不暴露这个能力，且需要自己写 Arduino 程序。
- **不推荐**：iPhone 热点只有 13 个可用地址，静态 IP 若落在 DHCP 池里容易冲突；换一台 iPhone、换一个系统版本，网段也可能变。**用 DHCP + K10 屏幕显示 IP 更稳。**

## 5. 现场连接与排障清单

### 5.1 连接步骤（按顺序）

1. **确认蜂窝套餐允许个人热点**：设置里能看到「个人热点」入口；看不到就联系运营商（Apple 官方说明）。
2. **iPhone 打开个人热点**，打开「最大兼容性」，记下 SSID 和密码；保持「设置 > 个人热点」页面不要退出，直到两台设备都连上。
3. **K10 上电**，运行已烧录的程序；确认屏幕最终显示 IP。
4. **K10 连热点**：WiFi 扩展/`wifi.connect()` 填 iPhone 的 SSID 和密码；等待连接成功。
5. **Mac 连同一个热点**（Wi-Fi，不用 USB/蓝牙），确认 `ipconfig getifaddr en0` 有 `172.20.10.x`。
6. **Mac 测 K10**：
   ```bash
   ping -c 3 <K10-IP>
   nc -vz -w 3 <K10-IP> 80
   curl -m 5 -v http://<K10-IP>/capture -o test.jpg
   file test.jpg
   ```
   期望 `test.jpg` 是 JPEG。若 `/capture` 404，改用 `/stream` 抓一帧（见 `docs/capture-pipeline-plan.md`）。
7. **记录 IP**：把 K10 屏幕 IP 抄进 Mac 配置；下次上电 IP 可能变，重新抄。

### 5.2 排障表

| 现象 | 最可能原因 | 处理 |
|---|---|---|
| K10 扫不到热点 SSID | 热点在 5GHz；或 SSID 含特殊字符 | 打开「最大兼容性」；SSID 改纯 ASCII；靠近到 10 米内 |
| K10 能看到 SSID，但认证失败/反复重连 | 热点是 WPA2/WPA3 混合，K10 只认 WPA2；或密码错 | 打开「最大兼容性」强制 WPA2；确认密码 |
| K10 拿到 `169.254.x.x` | DHCP 没给到地址；热点客户端已满；热点休眠 | 断开重连；关掉不用的客户端；保持热点设置页前台 |
| K10 有 `172.20.10.x`，Mac ping 不通 | 客户端隔离；或不在同一网段 | 先确认两边网段；再按 §2.3 测 TCP；确属隔离则走兜底票 #70 |
| ping 通但 `curl` 超时 | K10 的 HTTP 服务没起/端口不对/只支持 `/stream` | 先在 K10 浏览器侧确认服务；试 `/`、`/stream`；`nc -vz` 探端口 |
| Mac 拿到的是 IPv6 或别的网段 | Mac 走了 USB/蓝牙，或连了别的 Wi-Fi | 关掉 USB/蓝牙网络共享，Mac 只用 Wi-Fi 连热点 |
| 过了一会儿就断 | iPhone 热点空闲休眠；K10 省电 | 保持有流量；K10 关闭省电；必要时重连 |
| 第二天 IP 变了 | DHCP 租约变化/重新分配 | 以 K10 屏幕为准；脚本每次先读屏或先扫描 |
| 多台设备时 K10 连不上 | iPhone 热点地址池很小（观察值 13 个可用） | 断开不用的客户端；重启热点 |

### 5.3 现场前的最小验收

- [ ] iPhone 已打开「最大兼容性」，热点加密为 WPA2。
- [ ] K10 能连上热点，屏幕显示 `172.20.10.x`。
- [ ] Mac 连同一热点，`ipconfig getifaddr en0` 也是 `172.20.10.x`。
- [ ] `ping` 或 `nc -vz <K10-IP> 80` 至少一个通。
- [ ] `curl http://<K10-IP>/capture` 能拿到 JPEG，`file` 识别为 JPEG。
- [ ] 连续重连 3 次，IP 变化时能通过屏幕重新抄到。

## 6. 事实、来源与未验证点

### 6.1 已由官方来源确认

| 事实 | 来源 |
|---|---|
| 最大兼容性关闭 5GHz（及 6GHz）、只保留 2.4GHz、强制 WPA2 Personal | Apple Platform Security，<https://support.apple.com/en-ge/guide/security/secfd166f620/web> |
| iPhone 个人热点默认 WPA2/WPA3 Personal | 同上 |
| 最大兼容性可能降低热点性能；iPhone 12 起才有该开关 | Apple iPhone 手册，<https://support.apple.com/guide/iphone/share-your-internet-connection-iph45447ca6/ios> |
| 热点连接步骤、10 米距离、热点自动断开省电 | 同上 |
| K10 WiFi 为 IEEE 802.11b/g/n、2.4GHz、20/40MHz | UNIHIKER K10 规格，<https://www.unihiker.com/wiki/K10/HardwareReference/hardwarereference_specs/> |
| K10 连热点要求热点侧 WPA2（M10 热点案例） | UNIHIKER K10 FAQ，<https://www.unihiker.com/wiki/K10/faq/> |
| K10 WiFi API 为 `connect(ssid, psd, timeout)`，`info()` 返回 IP/掩码/网关 | UNIHIKER K10 MicroPython 示例，<https://www.unihiker.com/wiki/K10/Examples/examples_mpy/> |
| ESP32-S3 支持 WPA2/WPA3/PMF；WPA3 仅 Station；Transition 模式优先 WPA3 | Espressif ESP-IDF，<https://docs.espressif.com/projects/esp-idf/en/v5.0/esp32s3/api-guides/wifi-security.html> |

### 6.2 观察值 / 社区证据（非官方）

| 事实 | 来源 | 可信度 |
|---|---|---|
| iPhone 热点网段 `172.20.10.0/28`、网关 `.1`、可用 `.2–.14`、租约约 1 天 | 2015 年 DHCP 抓包博客，<https://www.redelijkheid.com/blog/2015/7/30/apple-ios-personal-hotspot-annoyances> | 中；年份早，可能在较新 iOS 上变化 |
| 现代 iOS（15.1.1、18.1.1）同热点客户端可互访 | Apple StackExchange，<https://apple.stackexchange.com/questions/194842/iphone-is-the-hotspot-isolated-can-you-see-other-devices> | 中；用户实测，非 Apple 承诺 |
| 2015 年有用户称热点客户端不能互连 | 同上 | 低；回答者自述无官方文档 |

### 6.3 未验证点（不要当成已定事实）

1. **iPhone 个人热点是否做客户端隔离**：Apple 无文档、无开关；社区证据偏向「不隔离」，但可能随 iOS/运营商/机型变化。**这是本链路最大的不确定性**，必须现场用 §2.3 验证。
2. **K10 的 Mind+ WiFi 扩展具体积木名称、IP 报告积木是否可直接显示**：官方 MicroPython 有 `wifi.info()`，Mind+ 积木参考页未单列 WiFi；需要真机确认。
3. **K10 固件/WiFi 库对 WPA2/WPA3 混合模式的实际行为**：ESP32-S3 芯片支持 WPA3，但 K10 固件是否启用、是否处理 PMF，官方未写；因此才建议强制 WPA2。
4. **iPhone 热点在未开最大兼容性时是否同时广播 2.4GHz**：Apple 未说明；开最大兼容性是唯一有官方依据的 2.4GHz 保证。
5. **较新 iOS 的网段是否仍是 `172.20.10.0/28`**：抓包证据是 2015 年的；现场以 `ipconfig` 实际结果为准。
6. **中文 SSID、特殊字符密码对 K10 的影响**：官方无说明；保守建议纯 ASCII。

## 7. 来源

- Apple Platform Security — Wi-Fi security with Apple devices（Personal Hotspot 安全、Maximize Compatibility Mode）：<https://support.apple.com/en-ge/guide/security/secfd166f620/web>
- Apple iPhone 用户手册 — Share your internet connection from your iPhone：<https://support.apple.com/guide/iphone/share-your-internet-connection-iph45447ca6/ios>
- Apple 支持 — Connect to the Personal Hotspot of an iPhone or iPad：<https://support.apple.com/en-us/111785>
- Apple 支持 — If Personal Hotspot is not working on your iPhone or iPad：<https://support.apple.com/en-us/119837>
- UNIHIKER K10 — Specification：<https://www.unihiker.com/wiki/K10/HardwareReference/hardwarereference_specs/>
- UNIHIKER K10 — FAQ（WiFi / WPA2）：<https://www.unihiker.com/wiki/K10/faq/>
- UNIHIKER K10 — MicroPython Examples（WiFi / `wifi.info()`）：<https://www.unihiker.com/wiki/K10/Examples/examples_mpy/>
- UNIHIKER K10 — 传感器/网络服务兼容性（WiFi 支持）：<https://www.unihiker.com.cn/wiki/k10/compatibility2>
- UNIHIKER K10 — Mind+ 积木参考：<https://www.unihiker.com/wiki/K10/CodeReference/CodeReference_blocksReference/>
- Espressif ESP-IDF — Wi-Fi Security (ESP32-S3)：<https://docs.espressif.com/projects/esp-idf/en/v5.0/esp32s3/api-guides/wifi-security.html>
- 非官方观察 — iPhone Personal Hotspot DHCP 抓包：<https://www.redelijkheid.com/blog/2015/7/30/apple-ios-personal-hotspot-annoyances>
- 非官方社区 — iPhone 热点是否隔离客户端：<https://apple.stackexchange.com/questions/194842/iphone-is-the-hotspot-isolated-can-you-see-other-devices>
