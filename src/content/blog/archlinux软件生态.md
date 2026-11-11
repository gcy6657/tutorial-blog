---
title: Arch Linux 装软件保姆级教程：pacman、AUR、Flatpak 怎么选，QQ 微信 WPS、Steam 游戏、独显切换和 Claude 桌面端
description: Arch 系列第四篇。讲清楚官方仓库、archlinuxcn、AUR、Flatpak 各适合装什么；QQ、微信、WPS、网易云等国产软件的现状和装法；Steam + Proton 玩 Windows 游戏；Intel + NVIDIA 混合显卡怎么让程序跑在独显上、怎么省电；最后在 Arch 上装好 Claude 桌面端。每一步都附上可能遇到的问题和解决办法。
pubDate: 2026-11-11
tags: [Linux, ArchLinux, 软件, 游戏]
---

> 本文是 Arch 系列的第四篇，前三篇是[《没有 U 盘也能装：Arch Linux + Windows 11 双系统保姆级教程》](/blog/archlinux双系统安装/)、[《Arch Linux 美化保姆级教程》](/blog/archlinux美化/)和[《Linux 命令行基础保姆级教程》](/blog/linux基础教程/)。默认你的系统和第一篇装完时一样：**KDE Plasma 6.8（Wayland）+ fcitx5 + archlinuxcn 源和 paru + multilib 仓库 + `nvidia-open` + `nvidia-prime` + Btrfs 快照（snapper + snap-pac）**。本文基于 2026 年 11 月的软件版本编写，包名和版本号以后可能变化，以 `pacman -Si` / `paru -Si` 的查询结果为准。

系统装好、美化完、命令行也会用了，接下来就是装软件。这一步劝退了不少新人：同一个 QQ，搜出来有 `linuxqq`、`linuxqq-nt-bwrap`、`linuxqq-appimage`、Flatpak 版好几个；装完微信打不了中文；WPS 打开全是英文还提示缺字体；Steam 游戏跑在核显上只有十几帧……

这篇文章的目标是：**先讲清楚 Arch 上装软件的几种渠道各自是什么、该怎么选，再把日常最常用的软件一个个装好**。每个软件都会写清楚选哪个包、为什么选它、装完可能遇到什么问题、怎么解决。

> 说明：我写这篇时还没有在自己的电脑上逐个实际装过，下面的步骤和"可能遇到的问题"整理自 ArchWiki、AUR 页面和各软件的官方文档。如果你按步骤操作遇到了文中没写到的情况，欢迎反馈。

## 零、开始之前

### 1. 本文的实操环境

| 项目 | 情况 |
| --- | --- |
| 电脑 | i5-12450H + Intel UHD 核显 + RTX 4060 Laptop（混合显卡） |
| 系统 | Arch Linux，KDE Plasma 6.8，**Wayland 会话** |
| 显卡驱动 | `nvidia-open` 615 + `nvidia-prime`（第一篇装好的） |
| 软件源 | 官方仓库（含 multilib）+ archlinuxcn，AUR 助手 `paru` |
| 输入法 | fcitx5，`/etc/environment` 里只设置了 `XMODIFIERS=@im=fcitx` |
| 快照 | snapper + snap-pac，每次 pacman 操作前后自动拍快照 |

> 关于 X11：**KDE Plasma 6.8 已经去掉了 X11 会话**，登录界面里只剩 Wayland。很多老教程里"切到 X11 会话就好了"的办法已经用不了。不过老的 X11 程序依然可以通过 **XWayland** 运行，本文后面会反复提到这一点。

### 2. 本文路线图

| 章节 | 内容 |
| --- | --- |
| 一 | 装软件的几种渠道：官方仓库、archlinuxcn、AUR、Flatpak、AppImage，以及怎么选 |
| 二 | 国产软件：先搞懂 Wayland 下的三类常见问题 |
| 三 | QQ、微信、WPS、网易云音乐，以及百度网盘、腾讯会议、钉钉、飞书 |
| 四 | 玩游戏：Steam + Proton、GE-Proton、MangoHud、GameMode、Epic/GOG |
| 五 | 混合显卡：让程序跑在独显上、独显省电、外接显示器、切换工具 |
| 六 | Claude 桌面端 |
| 七 | 日常维护：更新、清理、卸载干净 |
| 八 | 常见问题汇总 |

每一章基本互相独立，可以只看需要的部分。但**第一章和第二章建议先看**，后面所有软件的安装和排错都会用到这两章的知识。

### 3. 拍一张快照

snap-pac 会在每次 pacman / paru 安装软件前后自动拍快照，所以装软件本身很安全。但后面有几步会手动改配置文件（比如显卡的模块参数），这类操作不会触发自动快照。开工前手动拍一张：

```bash
sudo snapper -c root create -d "装软件之前"
snapper -c root list
```

万一后面把系统弄坏了，按第一篇第十章的方法回滚即可。

## 一、Arch 装软件的几种渠道

### 1. 官方仓库：首选

官方仓库由 Arch 的开发者和打包者维护，每个包都经过审核和签名。用 `pacman` 安装：

```bash
pacman -Ss 关键词          # 搜索
pacman -Si 包名            # 查看详细信息（版本、依赖、大小）
sudo pacman -S 包名        # 安装
```

官方仓库分为几个部分：

| 仓库 | 内容 |
| --- | --- |
| `core` | 系统最核心的包：内核、glibc、systemd、pacman 等 |
| `extra` | 其他所有常用软件：KDE、Firefox、LibreOffice、Lutris…… |
| `multilib` | 32 位库和需要 32 位库的软件，比如 Steam、`lib32-nvidia-utils` |

**优点**：最安全、最稳定，和系统其他部分一起测试，`sudo pacman -Syu` 一条命令全部更新。

**缺点**：只收录开源软件和少量允许分发的闭源软件。QQ、微信、WPS 这类国产闭源软件**不在官方仓库里**。

### 2. archlinuxcn：国内社区的预编译仓库

archlinuxcn 是国内 Arch 社区维护的第三方仓库，第一篇已经添加好了。它的作用是**把一些 AUR 里的热门软件提前编译好**，让你直接用 pacman 下载安装，不用自己编译。

```bash
pacman -Sl archlinuxcn | less    # 列出 archlinuxcn 里的所有包
```

**需要注意几点**：

- 它是**第三方仓库**，你信任的是 archlinuxcn 的维护者，而不是 Arch 官方。
- 它和官方仓库用同一个 `pacman -Syu` 更新，用法上感觉不到区别。
- **很多人以为国产软件都在 archlinuxcn 里，其实不是。**截至本文写作时，QQ、微信、WPS 都**不在** archlinuxcn 里，要从 AUR 装。archlinuxcn 里比较实用的有 `paru`、`proton-ge-custom-bin`、`envycontrol`、`onlyoffice-bin`、`splayer-next` 等。一个包到底在不在，用 `pacman -Si 包名` 查一下就知道。

### 3. AUR：最全，但要自己把关

AUR（Arch User Repository）是 Arch **用户**上传软件打包脚本的地方。注意，AUR 里放的**不是软件本身**，而是一个叫 **PKGBUILD** 的脚本，告诉你的电脑"去哪里下载软件、怎么把它打包成 pacman 能装的格式"。

用 paru 安装 AUR 软件时，它会自动完成：下载 PKGBUILD → 下载源码或安装包 → 本地打包 → 用 pacman 安装。

```bash
paru 关键词          # 搜索并交互选择（同时搜官方仓库和 AUR）
paru -Si 包名        # 查看详细信息
paru -S 包名         # 安装
```

> 再强调一次：**不要用 `sudo` 运行 paru**，它需要权限时会自己调用 sudo。

**AUR 包名的后缀**：同一个软件经常有好几个包，区别看后缀：

| 后缀 | 含义 | 举例 |
| --- | --- | --- |
| 无后缀 | 通常从源码编译；闭源软件则是官方安装包重新打包 | `linuxqq`、`netease-cloud-music-gtk4` |
| `-bin` | 直接用官方编译好的二进制，**安装快** | `wechat-bin`、`baidunetdisk-bin` |
| `-git` | 从 Git 仓库最新代码编译，**最新但可能不稳定** | `go-musicfox-git` |
| `-appimage` | 把 AppImage 包装成 pacman 包 | `linuxqq-appimage` |
| `-bwrap` | 套了一层 bubblewrap 沙盒，限制程序能访问的文件 | `wechat-universal-bwrap` |

**AUR 的风险**：任何人都能上传 PKGBUILD，理论上可以在里面写恶意命令。所以装之前要做两件事：

1. **看投票数、更新时间、有没有被标记过期**：在 [AUR 网站](https://aur.archlinux.org/) 搜索包名，投票多、最近有更新、没有 "Flagged out-of-date" 的包更可靠。用 `paru -Si 包名` 也能看到 `Votes`、`Last Modified` 和 `Out-of-date`。
2. **看一眼 PKGBUILD**：paru 在安装前会把 PKGBUILD 显示出来让你检查（按 `q` 退出查看后会问你是否继续）。不用每行都看懂，重点看两处：
   - `source=` 里的下载地址，是不是软件的官方网站或官方 CDN（比如 QQ 应该来自 `qq.com` 相关的域名）；
   - `package()` 函数里有没有莫名其妙的 `curl ... | bash` 之类的命令。

**AUR 包的另一个缺点**：它依赖维护者手动更新。维护者没空，你就只能等。软件官方更新了下载链接、而 PKGBUILD 还没跟上时，就会出现下载失败（见第八章）。

### 4. Flatpak：沙盒化、跨发行版

Flatpak 是一种**不依赖发行版**的软件分发方式。每个 Flatpak 软件自带它需要的运行库，运行在沙盒里，和系统隔离。最大的软件商店是 [Flathub](https://flathub.org/)。

第一篇装 KDE 时已经装好了 Flatpak（KDE 的"发现"软件中心依赖它），确认一下：

```bash
sudo pacman -S --needed flatpak
flatpak remotes
```

输出里有 `flathub` 就行。没有的话添加：

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

常用命令：

```bash
flatpak search 关键词
flatpak install flathub 应用ID      # 比如 com.qq.QQ
flatpak run 应用ID
flatpak update
flatpak uninstall 应用ID
flatpak uninstall --unused           # 清理不再需要的运行库
```

**优点**：

- 自带运行库，**不受系统更新影响**。Arch 滚动更新偶尔会让某个闭源软件因为库版本变化而打不开，Flatpak 版基本没这个问题。
- 沙盒隔离，闭源软件默认看不到你家目录里的全部文件。

**缺点**：

- **体积大**：第一次装 Flatpak 软件要连带下载几百 MB 的运行库（之后的软件可以共用）。
- **和系统融合差**：主题、光标、输入法、字体可能和系统不一致（美化篇第十六章讲过主题和光标的处理）。
- **Flathub 上很多国产软件不是官方上传的**，而是社区志愿者重新打包的。Flathub 页面上，开发者名字旁边有"已验证"（Verified）标记的才是官方发布。

**沙盒权限管理**：装一个图形化的权限管理工具 Flatseal，可以方便地给 Flatpak 程序开关文件夹访问、设备访问等权限：

```bash
sudo pacman -S flatseal
```

> Flathub 在国内访问可能比较慢。可以换成上海交大的镜像：`sudo flatpak remote-modify flathub --url=https://mirror.sjtu.edu.cn/flathub`。如果镜像出问题，用 `sudo flatpak remote-modify flathub --url=https://dl.flathub.org/repo/` 改回来。

### 5. AppImage：单文件，能不用就不用

AppImage 是一个单独的可执行文件，下载下来加上执行权限就能运行：

```bash
chmod +x 某软件.AppImage
./某软件.AppImage
```

它不用安装，但也**不会自动更新、不会出现在应用菜单里、不受包管理器管理**。在 Arch 上，绝大多数软件都能在前面几个渠道里找到，所以**只在实在找不到的时候才用 AppImage**。另外，很多 AppImage 依赖 `fuse2`，运行报错 `dlopen(): error loading libfuse.so.2` 时装上它：`sudo pacman -S fuse2`。

### 6. 到底该选哪个

| 优先级 | 渠道 | 适合装什么 |
| --- | --- | --- |
| 1 | 官方仓库 | 能在这里找到的一律从这里装：浏览器、办公、开发工具、Steam、驱动 |
| 2 | archlinuxcn | 官方仓库没有、archlinuxcn 有预编译版的 |
| 3 | AUR | 国产闭源软件（QQ、微信、WPS、网盘……）以及各种小众工具 |
| 4 | Flatpak | AUR 版有问题、想要沙盒隔离、或者想让闭源软件不受系统更新影响 |
| 5 | AppImage | 以上都没有 |

**几条原则**：

1. **同一个软件只从一个渠道装。**比如 QQ 既装 AUR 版又装 Flatpak 版，菜单里会出现两个 QQ 图标，配置目录也不一样，很容易搞混。
2. **系统组件（驱动、内核、桌面环境、输入法）只用官方仓库。**
3. **不要用 `pip install --break-system-packages`、`sudo npm install -g` 或者 `sudo make install` 往系统目录里装东西**，这些文件 pacman 管不到，以后会和系统包冲突。

### 7. 常用操作速查表

| 操作 | pacman / paru | Flatpak |
| --- | --- | --- |
| 搜索 | `paru 关键词` | `flatpak search 关键词` |
| 安装 | `sudo pacman -S 包名` / `paru -S 包名` | `flatpak install flathub 应用ID` |
| 全部更新 | `paru`（不带参数，等于 `paru -Syu`，官方和 AUR 一起更新） | `flatpak update` |
| 卸载 | `sudo pacman -Rns 包名` | `flatpak uninstall 应用ID` |
| 列出已装的 | `pacman -Qe`（自己装的）/ `pacman -Qm`（AUR 装的） | `flatpak list --app` |
| 查某个文件属于哪个包 | `pacman -Qo /usr/bin/文件名` | — |
| 查哪个包提供某个文件 | `pacman -F 文件名`（先 `sudo pacman -Fy` 更新文件数据库） | — |

卸载时用 `-Rns` 而不是 `-R`：`-s` 会顺带删掉只被这个软件依赖的包，`-n` 会删掉它的配置备份文件。

## 二、国产软件：先搞懂三类常见问题

### 1. 现状一览

| 软件 | 官方 Linux 版 | 推荐装法 | 状态 |
| --- | --- | --- | --- |
| QQ | 有，基于 Electron，跟随 Windows 版持续更新 | AUR `linuxqq` | 好用，功能基本齐全 |
| 微信 | 有，4.x 版，和 Windows 版界面一致 | AUR `wechat-bin` | 好用，部分功能（如视频号）可能缺失 |
| WPS | 有，个人版免费 | AUR `wps-office-cn` | 好用，需要补字体 |
| 网易云音乐 | 官方 Linux 版**早已停更** | 用第三方客户端 | 见第三章第 4 节 |
| 百度网盘 | 有 | AUR `baidunetdisk-bin` | 能用 |
| 腾讯会议 | 有 | AUR `wemeet-bin` | 能用，Wayland 下屏幕共享有问题 |
| 钉钉 | 有 | AUR `dingtalk-bin` | 能用 |
| 飞书 | 有 | AUR `feishu-bin` | 能用 |

总体来说，2026 年的国产软件在 Linux 上已经比几年前好太多了，主流的聊天、办公软件都有官方 Linux 版。但它们几乎都是**为 Ubuntu / 统信 UOS 这类系统打包的 `.deb`**，在 Arch 上是 AUR 维护者重新打包的，而且很多软件对 **Wayland** 的支持不完善。

装之前先了解 Wayland 下最常见的三类问题，后面每个软件出问题时，基本都能归到这三类里。

### 2. 先搞懂：这个程序是"原生 Wayland"还是"XWayland"

Wayland 会话里，程序有两种运行方式：

- **原生 Wayland**：程序直接和 KDE 的 Wayland 合成器沟通。KDE 自家程序、Firefox、新版 Chrome 都是这样。
- **XWayland**：程序只会说 X11 的"语言"，KDE 在中间放了一个 XWayland 翻译层。很多国产软件默认是这样。

查看某个窗口属于哪一种：按 `Alt + 空格` 打开 KRunner，输入 `KWin`，打开"**KWin 调试控制台**"（KWin Debug Console）。在"窗口"标签页里，程序列在 **Wayland 窗口**还是 **X11 窗口**下面，一眼就能看出来。

另一个更简单的办法：装 `xorg-xeyes`（`sudo pacman -S xorg-xeyes`），运行 `xeyes`。鼠标移到某个窗口上时，如果小眼睛跟着转，这个窗口就是 XWayland 的；眼睛不动，就是原生 Wayland 的。

### 3. 问题一：输入法打不了中文

**原因**：程序和 fcitx5 之间没有"接上线"。

- **原生 Wayland 程序**：通过 Wayland 的 text-input 协议使用输入法。前提是 KDE 里已经把虚拟键盘设成 Fcitx 5（第一篇做过：**系统设置 → 键盘 → 虚拟键盘 → Fcitx 5**）。
- **XWayland 程序**：通过 XIM 协议，依赖 `/etc/environment` 里的 `XMODIFIERS=@im=fcitx`（第一篇已经设置）。部分 Qt / GTK 写的 XWayland 程序用 XIM 效果不好，需要**单独给这个程序**设置 `QT_IM_MODULE=fcitx` 或 `GTK_IM_MODULE=fcitx`。
- **Electron 程序**（QQ、钉钉、VS Code……）：默认跑在 XWayland 上，可以加启动参数让它切换到原生 Wayland 并启用输入法（见第 6 节）。

> 第一篇特意说过：**不要把 `QT_IM_MODULE` 和 `GTK_IM_MODULE` 写进 `/etc/environment` 全局生效**，那样会影响所有原生 Wayland 程序。需要的时候**只给出问题的那个程序单独设置**，方法见下面第 7 节。

### 4. 问题二：界面模糊

**原因**：屏幕开了缩放（比如 125%），XWayland 程序不认识 Wayland 的缩放方式，KDE 只好把它的窗口画成小图再拉伸，于是就糊了。

**解决办法**：

1. 能让程序跑原生 Wayland 的，优先让它跑原生 Wayland（Electron 程序见第 6 节）。
2. 改 KDE 的 XWayland 缩放方式：**系统设置 → 显示和监视器 → 显示器配置 → 旧式应用程序（X11）→ 由应用程序自行缩放**。这样 XWayland 程序不再被拉伸，变清晰了，但有些程序可能会显得**字很小**，需要在程序自己的设置里调大字体或缩放。
3. 两个都试一下，选你看着更舒服的。

### 5. 问题三：截图、屏幕共享、托盘图标

- **截图**：Wayland 出于安全考虑，不允许程序随意读取整个屏幕。QQ、微信自带的截图在 Wayland 下可能只能截到自己的窗口或者干脆黑屏。**最稳的办法是用 KDE 自带的 Spectacle 截图**（默认快捷键 `Print`，或者 `Meta + Shift + Print` 框选），截完自动复制到剪贴板，回到聊天窗口 `Ctrl + V` 粘贴。
- **屏幕共享**：Wayland 下要通过 xdg-desktop-portal + PipeWire 申请权限。老版本的会议软件不支持这套机制，所以经常共享出去是黑屏。下面各软件小节里会给出对应的补丁包。先确认这两个包已经装好：

```bash
sudo pacman -S --needed xdg-desktop-portal-kde pipewire
```

- **托盘图标**：KDE 原生支持托盘（StatusNotifierItem 协议），但部分 Electron / GTK 程序需要额外的库才能把图标放到托盘里：

```bash
sudo pacman -S --needed libappindicator-gtk3 libayatana-appindicator
```

### 6. 让 Electron 程序跑原生 Wayland

Electron 是用网页技术写桌面程序的框架，QQ、钉钉、飞书、百度网盘、Claude 桌面端都是 Electron 程序。较新版本的 Electron 支持原生 Wayland，但默认不开启，需要加启动参数：

```text
--ozone-platform-hint=auto
--enable-wayland-ime
--wayland-text-input-version=3
```

| 参数 | 作用 |
| --- | --- |
| `--ozone-platform-hint=auto` | 在 Wayland 会话里自动使用原生 Wayland，解决模糊 |
| `--enable-wayland-ime` | 启用 Wayland 输入法支持，解决打不了字 |
| `--wayland-text-input-version=3` | 使用 text-input-v3 协议。KDE 同时支持 v1 和 v3，**如果加了这一行输入法反而有问题，就删掉它** |

很多 AUR 包的启动脚本支持从一个配置文件读取参数，文件名各不相同，比如 QQ 是 `~/.config/qq-flags.conf`，Claude 是 `~/.config/claude-desktop-flags.conf`。没有这种配置文件的，可以用下一节的方法改启动命令。

**注意**：切到原生 Wayland 之后，个别程序会出现新问题，比如窗口无法拖动、右键菜单位置不对、截图功能失效。**遇到这些问题就把参数删掉，退回 XWayland**，用第 4 节的办法解决模糊。

### 7. 给单个程序设置环境变量或启动参数

KDE 自带一个菜单编辑器，可以改任何程序在应用菜单里的启动方式，**不用动系统文件**，软件更新也不会把改动覆盖掉：

1. 右键点左下角的应用启动器 → **编辑应用程序**（或者运行 `kmenuedit`）。
2. 在左边找到要改的程序，比如 WPS 文字。
3. 在右边的"**命令**"一栏，原命令前面加上环境变量，后面加上参数。比如：

```text
env QT_IM_MODULE=fcitx /usr/bin/wps %U
```

4. 点"保存"。

KMenuEdit 会在 `~/.local/share/applications/` 下生成一份修改过的副本，优先级高于系统里的原版。想恢复原样，在菜单编辑器里右键这个程序选"**恢复为系统默认**"，或者直接删掉那个副本文件。

> 改完之后，**要从应用菜单启动**才会生效。从终端直接运行 `wps` 不会读这些设置。

## 三、国产软件逐个安装

### 1. QQ

QQ 的 Linux 版（QQNT）基于 Electron，和 Windows 版共用一套代码，更新很及时，聊天、文件、群、语音视频通话都能用。

**安装**：

```bash
paru -S linuxqq
```

paru 会显示 PKGBUILD，确认 `source` 里的下载地址来自 `qq.com` 的域名（比如 `qqdl.gtimg.cn`，这是腾讯的 CDN）后继续。装好后在应用菜单里找"QQ"，扫码登录。

**让 QQ 跑原生 Wayland**（解决模糊和输入法）：

```bash
cat > ~/.config/qq-flags.conf << 'EOF'
--ozone-platform-hint=auto
--enable-wayland-ime
--wayland-text-input-version=3
EOF
```

完全退出 QQ（托盘图标右键退出，不是关窗口），重新打开。

**可能遇到的问题**：

| 问题 | 解决办法 |
| --- | --- |
| 打不了中文 | 先确认上面的 `qq-flags.conf` 已创建并重启 QQ；还不行，删掉 `--wayland-text-input-version=3` 这一行再试 |
| 切到 Wayland 后截图、屏幕共享、剪贴板出问题 | 装 AUR 的 `linuxqq-wayland-fix-git`，它专门修这几个问题；或者删掉 `qq-flags.conf` 退回 XWayland，截图用 Spectacle |
| 托盘没有 QQ 图标，关掉窗口后找不回来 | 装 `libappindicator-gtk3`（见第二章第 5 节），重启 QQ |
| 打开就闪退、或者一直卡在加载 | 先在终端运行 `linuxqq` 看报错。常见原因是更新后旧数据不兼容：把 `~/.config/QQ` 改名备份（`mv ~/.config/QQ ~/.config/QQ.bak`）再打开，重新登录。聊天记录在这个目录里，确认新的能用之后再决定删不删备份 |
| 系统更新后 QQ 打不开 | 重新安装一次：`paru -S linuxqq --rebuild`。还不行就去 AUR 页面看评论区，通常有人已经报告了同样的问题 |

**备选**：Flathub 上的 `com.qq.QQ`（`flatpak install flathub com.qq.QQ`）。AUR 版出问题时可以试试，但**不要两个同时装**。

### 2. 微信

微信 Linux 版从 4.0 开始和 Windows 版统一了界面和功能，聊天、文件传输、朋友圈、小程序都能用。

**安装**：

```bash
paru -S wechat-bin
```

> AUR 上还有 `wechat-universal-bwrap` 和 `wechat` 两个包，它们是在 `wechat-bin` 的基础上**套一层沙盒**，限制微信只能访问指定的文件夹。如果你介意微信能看到整个家目录，可以装 `wechat`（它会自动把 `wechat-bin` 作为依赖装上）。第一次用建议先装 `wechat-bin`，没问题之后再考虑沙盒。

装好后从应用菜单打开"微信"，用手机扫码登录。

**可能遇到的问题**：

| 问题 | 解决办法 |
| --- | --- |
| 打不了中文 | 微信跑在 XWayland 上，靠 `XMODIFIERS=@im=fcitx`。先运行 `grep XMODIFIERS /etc/environment` 确认这行在，**注销重新登录**后再试。还不行，用第二章第 7 节的方法把启动命令改成 `env QT_IM_MODULE=fcitx` 加上原命令 |
| 界面模糊 | 按第二章第 4 节，把 XWayland 缩放改成"由应用程序自行缩放"。改完如果字太小，在微信的"设置 → 通用"里找字体大小 |
| 部分表情显示成方块 | 装一个彩色表情字体：`paru -S ttf-twemoji` |
| 截图功能截不到或黑屏 | 用 Spectacle 截图后粘贴（`Meta + Shift + Print`） |
| 不能同时登录两台"电脑" | 这是微信的规则：同一时间只能登录一个电脑端（Windows、Mac、Linux 都算电脑端），在 Linux 上登录会把 Windows 上的挤下线 |
| 收到的文件找不到 | 在微信的"设置 → 文件管理"里可以看到并修改文件保存位置 |

**备选**：Flathub 上的 `com.tencent.WeChat`。

### 3. WPS Office

WPS 的 Linux 个人版免费，界面和 Windows 版的 WPS 很像，对 `.docx`、`.xlsx`、`.pptx` 的兼容性比 LibreOffice 好。

**安装**：

```bash
paru -S wps-office-cn wps-office-mui-zh-cn ttf-wps-fonts
```

| 包 | 作用 |
| --- | --- |
| `wps-office-cn` | WPS 本体（国内版） |
| `wps-office-mui-zh-cn` | 简体中文界面语言包，**不装的话界面是英文** |
| `ttf-wps-fonts` | WPS 需要的数学公式、符号字体，不装的话打开时会提示"缺少字体" |

**安装时可能遇到的问题**：

- **下载失败（403 错误）**：WPS 的下载链接带有时间戳签名，过期就会失败。先 `paru -Sc` 清掉 paru 的缓存再重试；还不行，说明 WPS 官方换了下载地址而 PKGBUILD 还没更新，等维护者更新，或者去 AUR 页面评论区看有没有临时办法。
- **安装包很大**：WPS 本体有几百 MB，下载慢的话要有耐心。

**装好后的设置**：

1. **界面还是英文**：打开 WPS，点右上角的设置图标 → **Switch Language（切换语言）** → 选简体中文，重启 WPS。
2. **中文字体**：WPS 默认文档字体是"宋体"，系统里没有的话会用别的字体替代，排版和 Windows 上看到的不一样。第一篇装的 `noto-fonts-cjk` 能解决"显示成方块"的问题，但字形和宋体不同。如果你需要和 Windows 用户来回传文档、对排版要求高，可以从 Windows 分区复制字体（**注意字体的版权，只给自己用**）：

```bash
mkdir -p ~/.local/share/fonts/windows
cp /mnt/F/路径/到/Windows字体/{simsun.ttc,simhei.ttf,msyh.ttc,msyhbd.ttc} ~/.local/share/fonts/windows/
fc-cache -fv
```

Windows 的字体在 `C:\Windows\Fonts` 里。第一篇只自动挂载了 F 盘，C 盘需要临时挂载，或者在 Windows 下先把这几个字体文件复制到 F 盘。

3. **加粗字体显示不出加粗效果**：这是 WPS 和新版 freetype 字体渲染库的兼容问题。AUR 有一个修复版 `freetype2-wps`，但它会**替换系统的 freetype2**，影响所有程序的字体渲染，而且需要跟着系统更新手动维护。**不建议新手装**，能接受就先不管它。

**可能遇到的问题**：

| 问题 | 解决办法 |
| --- | --- |
| 打不了中文 | WPS 是 Qt5 程序，跑在 XWayland 上。用第二章第 7 节的方法，把 WPS 文字、表格、演示、PDF 几个菜单项的命令前面都加上 `env QT_IM_MODULE=fcitx` |
| 界面模糊或者字特别小 | 按第二章第 4 节调整；WPS 自己没有缩放设置，选"由系统缩放"可能更合适 |
| 打开文档时提示"系统缺失字体" | 确认装了 `ttf-wps-fonts`；提示里列出的具体字体（比如"方正小标宋"）可以按上面的方法从 Windows 复制 |
| 每次打开都弹登录 | WPS 个人版不登录也能用，关掉登录窗口即可。部分云文档功能需要登录 |

**备选**：

- **LibreOffice**：官方仓库里的开源办公套件，`sudo pacman -S libreoffice-fresh libreoffice-fresh-zh-cn`。界面不如 WPS 像 Office，但完全开源、和系统集成好。
- **OnlyOffice**：界面接近新版 Office，对 Office 格式兼容性也不错，archlinuxcn 里有预编译版：`sudo pacman -S onlyoffice-bin`。

### 4. 网易云音乐

**现状**：网易云音乐官方的 Linux 版停在 1.2.1 版本，很多年没更新了。AUR 里的 `netease-cloud-music` 就是这个老版本，在新系统上经常打不开、登录不了、中文显示异常，**不推荐**。

现在的主流做法是用**第三方客户端**。它们调用网易云的接口，登录你自己的账号，能听歌单、每日推荐、私人 FM。

| 客户端 | 特点 | 安装 |
| --- | --- | --- |
| **netease-cloud-music-gtk** | Rust + GTK4 写的原生客户端，轻量、和 Linux 桌面融合好 | `paru -S netease-cloud-music-gtk4`（从源码编译，需要几分钟） |
| **SPlayer** | Electron 写的，界面好看，功能多（逐字歌词、评论区、云盘） | archlinuxcn 有预编译版：`sudo pacman -S splayer-next` |
| **go-musicfox** | 在终端里运行的网易云客户端，适合喜欢命令行的人 | `paru -S go-musicfox-bin` |
| **网页版** | 浏览器打开 [music.163.com](https://music.163.com/) | 无需安装 |

**需要了解的风险**：

- 第三方客户端用的是**非官方接口**，网易云改接口后可能突然用不了，要等开发者更新。
- 用第三方客户端登录，理论上存在账号被风控的可能。介意的话就用网页版。
- VIP 歌曲需要你的账号本身有会员；部分版权受限的歌曲在第三方客户端里可能放不了。

**其他音乐软件**：QQ 音乐有官方 Linux 版（`paru -S qqmusic-bin`），但版本较老，更新不频繁；Spotify 在 Flathub 上有官方版（`com.spotify.Client`）。

### 5. 百度网盘、腾讯会议、钉钉、飞书

这几个软件的装法类似，统一放在这里：

```bash
paru -S baidunetdisk-bin    # 百度网盘
paru -S wemeet-bin          # 腾讯会议
paru -S dingtalk-bin        # 钉钉
paru -S feishu-bin          # 飞书
```

**可能遇到的问题**：

| 软件 | 问题 | 解决办法 |
| --- | --- | --- |
| 百度网盘 | 下载速度慢 | 和 Windows 一样，非会员限速，Linux 版没有额外限制，也没有额外的办法 |
| 百度网盘 | 托盘图标不显示 | 它依赖 `libappindicator-gtk3`，AUR 包已经自动装上；还是不显示就注销重新登录 |
| 腾讯会议 | 打开后界面模糊或不显示 | 装 `qt5-wayland`（`sudo pacman -S qt5-wayland`）；还不行试试用菜单编辑器在命令前加 `env QT_QPA_PLATFORM=xcb`，强制它走 XWayland |
| 腾讯会议 | **Wayland 下屏幕共享是黑屏** | 这是腾讯会议 Linux 版的老问题。AUR 上曾有 `wemeet-wayland-screenshare-git` 补丁，但已经很久没更新、被标记过期，不一定能用。实在要共享屏幕，用**浏览器打开腾讯会议网页版**入会，浏览器（Chrome、Firefox）在 Wayland 下的屏幕共享是正常的 |
| 钉钉 | Wayland 下屏幕共享黑屏 | 装 AUR 的 `dingtalk-wayland-screenshare-git` |
| 飞书 | 输入法、模糊 | 飞书是 Electron 程序，用第二章第 6、7 节的方法加启动参数 |

> 这类会议软件在 Linux 上的体验整体不如 Windows。如果你要开重要的会、要共享屏幕演示，**提前测试**，或者干脆重启进 Windows 开会，这正是装双系统的好处。

### 6. 其他常用软件

顺带列一下其他常见软件的推荐装法：

| 软件 | 推荐装法 | 说明 |
| --- | --- | --- |
| Firefox | `sudo pacman -S firefox firefox-i18n-zh-cn` | 官方仓库，原生 Wayland |
| Chrome | `paru -S google-chrome` | AUR，重新打包官方 `.deb`；不需要 Google 服务的也可以用官方仓库的 `chromium` |
| Microsoft Edge | `paru -S microsoft-edge-stable-bin` | AUR |
| VS Code | `paru -S visual-studio-code-bin` | AUR 的微软官方版，能用微软的插件市场；官方仓库的 `code` 是开源版，插件市场不同 |
| Telegram | `sudo pacman -S telegram-desktop` | 官方仓库 |
| OBS | `sudo pacman -S obs-studio` | 官方仓库 |
| VLC / mpv | `sudo pacman -S vlc` / `sudo pacman -S mpv` | 官方仓库 |
| GIMP / Krita | `sudo pacman -S gimp` / `sudo pacman -S krita` | 官方仓库 |

## 四、玩游戏：Steam + Proton

### 1. 原理：Linux 怎么运行 Windows 游戏

绝大多数游戏只有 Windows 版。Steam 内置了一个叫 **Proton** 的兼容层，它基于 Wine（把 Windows 的系统调用翻译成 Linux 的）和 DXVK / VKD3D（把 DirectX 翻译成 Vulkan），**让 Windows 游戏不用改就能在 Linux 上运行**。Steam Deck 就是靠它运行几乎整个 Steam 游戏库的。

**能玩什么、不能玩什么**：

- **大部分单机游戏**：能玩，很多游戏性能和 Windows 差不多。
- **带反作弊的网游**：看游戏厂商有没有开启 Linux 支持。Easy Anti-Cheat、BattlEye 这两个反作弊本身支持 Proton，但需要游戏开发者手动开启。**国内很多网游的反作弊不支持 Linux**，装了也进不去，甚至可能被误判封号。
- 查兼容性：
  - [ProtonDB](https://www.protondb.com/)：玩家报告的游戏兼容性评级，**白金（Platinum）**和**金（Gold）**基本开箱即用，**银（Silver）**需要折腾，**铜（Bronze）**和**无法运行（Borked）**就别指望了。
  - [Are We Anti-Cheat Yet?](https://areweanticheatyet.com/)：专门查网游反作弊对 Linux 的支持情况。

> 如果你要玩的游戏在 Linux 上跑不了，就重启进 Windows 玩，这也是双系统的意义。

### 2. 装 Steam 之前检查

第一篇已经开启了 multilib 仓库、装好了 `lib32-nvidia-utils`，这里再确认一下：

```bash
grep -A1 '^\[multilib\]' /etc/pacman.conf          # 能看到两行，且开头没有 #
pacman -Q lib32-nvidia-utils nvidia-utils          # 两个版本号必须一样
pacman -Q vulkan-intel lib32-vulkan-intel          # Intel 核显的 Vulkan 驱动
locale -a | grep -i en_us                          # 能看到 en_US.utf8
```

`lib32-vulkan-intel` 没装的话补上：`sudo pacman -S lib32-vulkan-intel lib32-mesa`。

> **为什么要确认 `lib32-nvidia-utils` 和 `nvidia-utils` 版本一致**：两者版本不一致时，32 位游戏和 Steam 本身可能启动失败。正常 `sudo pacman -Syu` 时它们会一起更新，但如果你曾经单独更新过某一个就可能不一致。

### 3. 安装 Steam

```bash
sudo pacman -S steam
```

如果 pacman 让你选择 `lib32-vulkan-driver` 的提供者，**选 `lib32-nvidia-utils` 对应的序号**（如果已装就不会问）。ArchWiki 特别提醒：不注意的话 pacman 可能按字母顺序默认选一个跟你显卡不匹配的驱动。

再装 Steam 需要的中文字体。**Steam 不遵循系统的字体配置**，即使系统里有 Noto CJK，Steam 界面里的中文也可能显示成方块：

```bash
sudo pacman -S --needed wqy-zenhei ttf-liberation lib32-fontconfig
```

从应用菜单打开 Steam。第一次启动会下载几百 MB 的更新，然后显示登录界面。

**首次设置**：

1. **改成中文**：Steam → 设置 → 界面 → 语言 → 简体中文，重启 Steam。
2. **下载服务器**：设置 → 下载 → 下载地区，选一个离你近的国内地区，下载速度会快很多。
3. **启用 Proton**：设置 → 兼容性 → 打开"**为所有其他产品启用 Steam Play**"，下面的版本选最新的 Proton（或者 Proton Experimental），重启 Steam。

开了第 3 步之后，Windows 游戏的"安装"按钮就能点了，Steam 会自动下载需要的 Proton 版本。

### 4. 让游戏跑在独显上（重要）

**这一步是混合显卡笔记本最容易漏掉的。**默认情况下，Steam 和所有游戏都跑在 **Intel 核显**上，帧数会非常低。

给每个游戏设置启动选项：在游戏库里右键游戏 → **属性** → **通用** → **启动选项**，填入：

```text
prime-run %command%
```

`%command%` 代表 Steam 原本要执行的游戏启动命令，`prime-run` 是 `nvidia-prime` 包提供的脚本，它设置几个环境变量，让程序用 NVIDIA 独显渲染。

**确认游戏真的跑在独显上**：游戏运行时，打开终端运行 `nvidia-smi`，下面的进程列表里能看到游戏的进程（名字通常是游戏的 `.exe`）就对了。更直观的方法是用下面第 6 节的 MangoHud，在游戏画面上直接显示正在用的显卡。

### 5. GE-Proton：官方 Proton 搞不定时试试

GE-Proton 是社区维护的 Proton 版本，加入了一些官方版还没收录的补丁，**对部分游戏的过场动画、视频播放、新游戏的兼容性更好**。

**安装方式一（推荐）**：archlinuxcn 里有预编译版，跟着系统一起更新：

```bash
sudo pacman -S proton-ge-custom-bin
```

**安装方式二**：用图形化工具 ProtonUp-Qt 或 ProtonPlus 下载管理，它们还能给 Lutris、Heroic 装兼容层：

```bash
paru -S protonup-qt
```

装好后**重启 Steam**，在游戏的 **属性 → 兼容性** 里勾选"**强制使用特定 Steam Play 兼容性工具**"，就能在列表里选 GE-Proton 了。

**什么时候换 Proton 版本**：一个游戏打不开或有问题时，先去 ProtonDB 看别人用的是哪个版本，然后依次试：最新 Proton → Proton Experimental → GE-Proton → 更老的 Proton 版本。

### 6. MangoHud 和 GameMode

**MangoHud**：在游戏画面上显示帧数、CPU / GPU 占用、温度、显存等信息，类似 Windows 上的 MSI Afterburner。

**GameMode**：游戏运行时临时把 CPU 调到性能模式、提高游戏进程的优先级，结束后自动恢复。

```bash
sudo pacman -S mangohud lib32-mangohud gamemode lib32-gamemode
sudo usermod -aG gamemode $USER
```

加入 `gamemode` 用户组后需要**注销重新登录**，否则 GameMode 没有权限调整 CPU 设置。

三者一起用，游戏启动选项改成：

```text
prime-run gamemoderun mangohud %command%
```

游戏里按 **右 Shift + F12** 可以显示 / 隐藏 MangoHud。想自定义显示哪些信息，可以装图形化配置工具 `goverlay`（`sudo pacman -S goverlay`），或者直接编辑 `~/.config/MangoHud/MangoHud.conf`，比如：

```ini
gpu_name
gpu_temp
cpu_temp
ram
vram
fps
frametime
```

在 MangoHud 显示的 GPU 名字是 `RTX 4060` 而不是 `Intel UHD`，就说明 `prime-run` 生效了。

检查 GameMode 是否生效：游戏运行时在终端执行 `gamemoded -s`，显示 `gamemode is active` 就对了。

### 7. 游戏装在哪里：别装在 NTFS 分区

你可能想把游戏装在 F 盘，和 Windows 共用一份游戏文件，省空间。**不推荐这样做**，原因：

- Proton 需要在游戏目录旁边创建大量带特殊字符（比如 `:`）的文件和符号链接，NTFS 对这些支持不好，游戏可能直接打不开。
- 如果 Windows 没有完全关机（比如开了快速启动，或者 Windows 更新后处于休眠状态），Linux 会把 NTFS 分区挂载成只读，Steam 写不进去。
- 读写性能比 Btrfs 差。

第一篇给 Arch 分了 300G，装几个大型游戏足够。Steam 默认把游戏装在 `~/.local/share/Steam/steamapps/`，就在 `/home` 里。

> 如果你一定要用 F 盘上的游戏库，ArchWiki 的方法是：确认 F 盘用 `ntfs3` 驱动挂载（第一篇的 fstab 已经是这样），然后把 `steamapps/compatdata` 这个目录移到 Linux 分区，在原位置建一个符号链接。具体见参考资料里的 ArchWiki Steam 排错页面。另外，Btrfs 快照只覆盖根目录，`/home` 里的游戏不会被拍进快照，不用担心占用快照空间。

### 8. 非 Steam 游戏：Epic、GOG 和其他

| 工具 | 用途 | 安装 |
| --- | --- | --- |
| **Heroic Games Launcher** | 玩 Epic、GOG、Amazon 上买的游戏，界面友好 | `paru -S heroic-games-launcher-bin` |
| **Lutris** | 万能游戏管理器，可以装各种来源的游戏，包括国内平台的 Windows 客户端 | `sudo pacman -S lutris` |
| **umu-launcher** | 在 Steam 之外使用 Proton 的后端，Heroic 和 Lutris 新版本默认就用它 | 一般不用单独装，`sudo pacman -S umu-launcher` |

在 Heroic 和 Lutris 里同样要让游戏跑在独显上：在游戏的设置里找"**环境变量**"或"**启动参数前缀**"，填入 `prime-run`。

> 小技巧：一些小型 Windows 程序（不是游戏）也可以通过 Lutris 或者 Flathub 上的 Bottles（`com.usebottles.bottles`）运行。

### 9. 游戏相关的常见问题

| 问题 | 解决办法 |
| --- | --- |
| Steam 打不开，或者点了没反应 | 在终端里运行 `steam` 看报错。最常见的是 32 位库缺失或版本不一致：检查第 2 节的几项。还不行试试 `steam --reset` |
| Steam 界面里中文是方块 | 装 `wqy-zenhei`，完全退出 Steam 后重开 |
| 游戏打开黑屏或直接退出 | 依次换 Proton 版本（第 5 节）；去 ProtonDB 搜这个游戏，看别人填的启动选项 |
| 老游戏打不开 | 启动选项加 `PROTON_USE_WINED3D=1 %command%`，用 OpenGL 代替 Vulkan |
| 帧数很低 | 先确认 `prime-run` 生效（MangoHud 显示的是 RTX 4060）；确认笔记本插着电源 |
| 刚进游戏时卡顿，玩一会儿就好 | 正常现象：Proton 在第一次运行时编译着色器。Steam 设置 → 着色器预缓存，保持开启，Steam 会提前下载预编译好的着色器 |
| 游戏没有声音 | 装 `lib32-pipewire`（`sudo pacman -S lib32-pipewire`），重启游戏 |
| 手柄不识别 | Steam → 设置 → 控制器，打开对应手柄类型的支持（比如 Xbox、PlayStation） |
| 网游进不去、提示反作弊 | 去 Are We Anti-Cheat Yet 查这个游戏。显示 Denied 或 Broken 的就放弃，回 Windows 玩 |

## 五、NVIDIA 混合显卡：怎么让程序跑在独显上

### 1. 原理：PRIME 渲染卸载

这台电脑的屏幕连接在 **Intel 核显**上。平时桌面、浏览器、聊天软件都由核显画，省电；需要高性能的时候，程序让 NVIDIA 独显帮忙渲染，画好之后把画面交给核显显示出来。这个机制在 Linux 上叫 **PRIME 渲染卸载**（PRIME render offload），NVIDIA 叫它 Optimus。

所以混合显卡下的关键问题有两个：

1. **怎么让需要的程序用上独显**（游戏、建模、视频剪辑）；
2. **怎么让独显在不用的时候彻底休眠**，不白白耗电。

### 2. 先找到独显的 PCI 地址

后面好几个命令要用到独显的 PCI 地址：

```bash
lspci -D | grep -iE 'vga|3d'
```

输出类似：

```text
0000:00:02.0 VGA compatible controller: Intel Corporation Alder Lake-P GT1 [UHD Graphics]
0000:01:00.0 VGA compatible controller: NVIDIA Corporation AD107M [GeForce RTX 4060 Max-Q / Mobile]
```

NVIDIA 那行开头的 `0000:01:00.0` 就是独显的地址。下文都以这个地址为例，你的如果不一样，替换掉就行。

### 3. 看独显现在是醒着还是睡着

```bash
cat /sys/bus/pci/devices/0000:01:00.0/power/runtime_status
```

- `suspended`：独显已经休眠，功耗接近 0。
- `active`：独显正在工作。

**注意**：`nvidia-smi` 这个命令本身会**唤醒独显**，所以别用它来检查独显有没有休眠。想知道是哪个程序让独显醒着，用这个命令，它不会唤醒显卡：

```bash
sudo lsof +c0 /dev/nvidia*
```

输出里列出的进程就是正在使用独显的程序。什么都没输出，说明没有程序在用独显，正常情况下它过几秒就会自动休眠。

### 4. 独显省电：RTD3 动态电源管理

让独显不用时彻底断电的功能叫 **RTD3**（运行时 D3 电源管理）。

**好消息**：RTX 40 系属于 Ampere 之后的架构，`nvidia-open` 从 610 版本起**默认就完整支持 RTD3**，我们装的是 615 版，**通常什么都不用配置**。

检查一下是否支持：

```bash
cat /proc/driver/nvidia/gpus/0000:01:00.0/power
```

输出里 `Runtime D3 status` 显示 `Enabled (fine-grained)` 之类的字样就是支持的。

再开启 NVIDIA 的持久化服务。ArchWiki 建议开启它，避免内核在独显空闲时反复销毁、重建显卡的状态：

```bash
sudo systemctl enable --now nvidia-persistenced.service
```

然后**重启电脑**，什么程序都不开，等半分钟，用第 3 节的方法看独显状态，应该是 `suspended`。

**如果一直是 `active`，按顺序排查**：

1. 运行 `sudo lsof +c0 /dev/nvidia*`，看是哪个程序在占用独显，关掉它再看。
2. **是否接了外接显示器**：很多游戏本的 HDMI 口直接连在独显上，接了显示器独显就必须一直工作，无法休眠（见第 6 节）。
3. **BIOS 里是不是开了"独显直连"**（有的笔记本叫 dGPU Only、Discrete 模式）：这种模式下屏幕直接连在独显上，独显不可能休眠。改回"混合模式"（Hybrid / MSHybrid / Optimus）。
4. 以上都不是，可能需要手动配置 udev 规则和模块参数，参考 ArchWiki 的 PRIME 页面"PCI-Express Runtime D3 (RTD3) Power Management"一节。改之前先拍快照。

### 5. 让程序用独显运行

**方法一：命令前加 `prime-run`**（第一篇讲过）

```bash
prime-run blender
prime-run glxinfo | grep "OpenGL renderer"     # 应该显示 NVIDIA GeForce RTX 4060
prime-run vulkaninfo --summary                  # 需要先装 vulkan-tools
```

**方法二：让 KDE 应用菜单里的程序默认用独显启动**

KDE 支持一个叫 `PrefersNonDefaultGPU` 的设置，标记了它的程序从应用菜单启动时会自动用独显。这个功能需要 `switcheroo-control` 服务告诉 KDE 电脑上有哪几块显卡：

```bash
sudo pacman -S switcheroo-control
sudo systemctl enable --now switcheroo-control.service
```

然后打开菜单编辑器（`kmenuedit`），找到要用独显的程序，勾选"**使用独立显卡运行**"（Run using dedicated graphics card，通常在"高级"标签页），保存。

以后从应用菜单、Dock、桌面图标启动这个程序，都会自动用独显。

**方法三：Steam 游戏**：启动选项填 `prime-run %command%`（见第四章第 4 节）。

**哪些程序需要用独显**：

| 需要 | 不需要 |
| --- | --- |
| 游戏 | 浏览器、聊天软件、办公软件 |
| Blender 等 3D 软件 | 桌面本身（KDE） |
| 视频剪辑（Kdenlive / DaVinci Resolve）的渲染预览 | 看视频（核显的硬件解码足够，而且更省电） |
| 用 CUDA 的程序（PyTorch 等） | 终端、编辑器 |

> **CUDA 程序不需要 `prime-run`**。`prime-run` 只影响图形渲染（OpenGL / Vulkan），PyTorch 之类的 CUDA 程序会直接找到 NVIDIA 显卡。

### 6. 外接显示器

先搞清楚你的笔记本各个视频接口接在哪块显卡上。插上显示器后运行：

```bash
for p in /sys/class/drm/card*-*; do echo "$p: $(cat $p/status)"; done
```

找到状态是 `connected` 的接口，它前面的 `cardX` 是哪块显卡：

```bash
ls -l /sys/class/drm/card*/device/driver
```

指向 `i915` 或 `xe` 的是 Intel 核显，指向 `nvidia` 的是独显。

- 接口**在核显上**：外接显示器不影响独显休眠，一切照常。
- 接口**在独显上**（很多游戏本的 HDMI 口是这样）：接上显示器后**独显会一直工作**，耗电增加、风扇可能更响，这是硬件决定的，属于正常现象。拔掉显示器后独显恢复休眠。

**外接显示器常见问题**：

| 问题 | 解决办法 |
| --- | --- |
| 接了显示器没画面 | 确认第一篇的 NVIDIA 驱动正常（`nvidia-smi` 能看到显卡）；到 **系统设置 → 显示和监视器** 里看外接显示器是不是被禁用了 |
| 外接显示器上鼠标卡顿、掉帧 | 在 KDE Wayland + NVIDIA 下偶尔会出现。先确认系统是最新的（`paru`），NVIDIA 驱动和 KWin 的修复通常会跟着更新到来；还不行就去 KDE 的 Bug 跟踪系统搜索有没有已知问题 |
| 合盖接外接显示器后睡眠 | **系统设置 → 电源管理 → 合上笔记本盖时**，选"不执行操作"，并勾选"即使连接了外接显示器" |

### 7. 切换工具：EnvyControl 和 BIOS 独显直连

除了混合模式，还可以把电脑切到"只用核显"或"只用独显"：

| 模式 | 效果 | 适合 |
| --- | --- | --- |
| 混合（默认） | 平时核显，需要时独显 | **绝大多数情况，推荐一直用这个** |
| 只用核显 | 独显被完全禁用 | 外出想最大化续航 |
| 只用独显 | 所有画面都由独显渲染 | 长时间打游戏，减少一点渲染卸载的性能损耗 |

**EnvyControl** 是一个命令行切换工具，archlinuxcn 里有：

```bash
sudo pacman -S envycontrol
envycontrol --query                 # 查看当前模式
sudo envycontrol -s integrated      # 切到只用核显
sudo envycontrol -s hybrid          # 切回混合
sudo envycontrol --reset            # 撤销 EnvyControl 做的所有修改
```

切换后要重启才生效。

**但我不太推荐新手用它**，原因：

- 它通过修改系统配置文件（屏蔽驱动模块、写 Xorg 配置、改 initramfs）实现切换，**切错了可能进不去桌面**。
- 我们的混合模式下 RTD3 已经能让独显完全休眠，"只用核显"模式带来的续航提升非常有限。
- 它的"只用独显"模式主要针对 X11，而 Plasma 6.8 已经只有 Wayland 了，这个模式下更容易出问题。

**如果真的想要"只用独显"**，更稳妥的办法是看你的笔记本 BIOS 里有没有"**独显直连**"选项（有的叫 MUX Switch、dGPU Only、Discrete Graphics）。它是在硬件层面切换屏幕连接到哪块显卡，系统里不用改任何配置，NVIDIA 驱动会自动接管。切回混合模式后也能正常使用。**注意**：独显直连模式下，美化篇第十八章提到的 Plymouth 开机动画可能不显示，按那里的方法处理即可。

**用 EnvyControl 前一定要先拍快照**，切换后进不去桌面的话：

1. 在 GRUB 菜单里选 snapper 的快照启动（第一篇第十章），或者
2. 按 `Ctrl + Alt + F3` 切到命令行登录，运行 `sudo envycontrol --reset`，然后 `reboot`。

## 六、Claude 桌面端

### 1. 现状：官方有 Linux 版，但不支持 Arch

Anthropic 在 2026 年年中推出了**官方的 Claude 桌面端 Linux 版**，目前还是 **Beta（测试版）**，包含 Chat（聊天）、Cowork 和 Claude Code 三部分功能。但它**官方只支持 Ubuntu 22.04+ 和 Debian 12+**，通过 apt 仓库安装。官方文档对 Arch、Fedora 这类发行版的建议是：**用 Claude Code 命令行版（CLI）**，桌面端以后会支持更多发行版。

不过，AUR 上有人把官方的 `.deb` 安装包**重新打包**成了 Arch 能装的格式：

| AUR 包 | 内容 | 推荐 |
| --- | --- | --- |
| `claude-desktop` | 下载 Anthropic 官方的 `.deb`，只解包、不修改程序本体；额外加了一个启动脚本，让它在 Wayland 下自动跑原生 Wayland；还加了几个路径兼容链接，让 Cowork 能在 Arch 上找到虚拟机组件 | **推荐** |
| `claude-desktop-extra` | 在官方程序的基础上**打了社区补丁**，加入了官方 Linux 版还没有的功能（Computer Use、自定义主题、多账号等） | 不推荐，改动了官方程序，出问题没人负责 |

> **风险提示**：AUR 的 `claude-desktop` 虽然用的是官方安装包，但 **Anthropic 官方不支持在 Arch 上运行桌面端**，遇到问题官方客服不会处理。另外，关于 Claude 账号注册和订阅的注意事项，可以看我之前的[《Claude 注册订阅相关经验分享》](/blog/claude订阅与防封经验/)。

**功能限制**（官方 Linux Beta 版本身的限制，和 Arch 无关）：

| 功能 | 状态 |
| --- | --- |
| Chat 聊天 | 可用，所有套餐（包括免费版） |
| Claude Code | 可用，需要 Pro 及以上套餐 |
| Cowork | 可用，需要 Pro 及以上套餐，且电脑要支持硬件虚拟化（见第 4 节） |
| Computer Use（让 Claude 操作电脑） | **Linux 版暂不支持** |
| 语音输入 | **Linux 版暂不支持**，可以用 CLI 的语音输入 |
| Quick Entry 全局快捷键 | X11 下可用；Wayland 下需要桌面环境支持 GlobalShortcuts 门户，KDE 是支持的 |

### 2. 安装

```bash
paru -S claude-desktop
```

**检查 PKGBUILD**：paru 显示 PKGBUILD 时，确认 `source` 里的下载地址是 `https://downloads.claude.ai/claude-desktop/...`，这是 Anthropic 官方的下载服务器。

**依赖说明**：这个包会把 Cowork 需要的虚拟机组件 `qemu-system-x86` 和 `edk2-ovmf` 作为依赖一起装上，大概几百 MB。

再确认一下 KDE 的密码管理器 KWallet 和桌面门户在：

```bash
sudo pacman -S --needed kwallet xdg-desktop-portal-kde libayatana-appindicator
```

| 包 | 作用 |
| --- | --- |
| `kwallet` | KDE 钱包，Claude 用它**保存登录状态**，没有的话每次打开都要重新登录 |
| `xdg-desktop-portal-kde` | 文件选择对话框、全局快捷键等功能需要它 |
| `libayatana-appindicator` | 托盘图标 |

### 3. 启动和登录

从应用菜单打开"**Claude**"，或者在终端运行 `claude-desktop`。点登录后会**打开浏览器**完成登录，登录成功后浏览器会跳回 Claude 桌面端。

**需要代理才能访问的网络环境**：桌面端是 Electron 程序，可以通过启动参数指定代理。在 `~/.config/claude-desktop-flags.conf` 里加一行（地址和端口换成你自己代理软件的）：

```text
--proxy-server=http://127.0.0.1:7890
```

这个文件是 AUR 包的启动脚本提供的功能，一行写一个或多个参数，`#` 开头的是注释。改完完全退出 Claude 再打开。

**Wayland**：AUR 包的启动脚本检测到 Wayland 会话时，会自动加上 `--ozone-platform=wayland`，所以在 125% 之类的缩放下也是清晰的，不用自己配置。

### 4. 启用 Cowork（可选）

Cowork 会在一个本地虚拟机里执行较长的自动化任务，需要满足三个条件：

**第一，BIOS 里开启硬件虚拟化**。检查：

```bash
lscpu | grep -i virtualization
```

显示 `VT-x` 就是开着的。什么都不显示，需要重启进 BIOS，找到 **Intel Virtualization Technology**（或者 VT-x、Intel VT）设置为 Enabled。如果你在 Windows 上用过 WSL2 或 Docker，这个选项很可能已经开着了。

**第二，把自己加进 `kvm` 用户组**：

```bash
sudo usermod -aG kvm $USER
```

然后**注销重新登录**（或者重启）。官方文档特别说明：即使你现在已经能访问 `/dev/kvm`，也要加这个组，因为 Cowork 还需要访问 `/dev/vhost-vsock`，只有 `kvm` 组的成员才能打开。

**第三，`vhost_vsock` 内核模块**：通常会自动加载，不用管。如果 Cowork 提示需要这个模块：

```bash
sudo modprobe vhost_vsock
echo vhost_vsock | sudo tee /etc/modules-load.d/vhost_vsock.conf    # 开机自动加载
```

Cowork 只在 Claude **启动时**检查这些条件，所以改完之后要完全退出 Claude 再打开。

### 5. 配置 MCP 服务器

MCP 可以让 Claude 连接外部工具和数据源。桌面端的 MCP 配置文件在：

```text
~/.config/Claude/claude_desktop_config.json
```

最方便的打开方式是在 Claude 里：**设置 → 开发者 → 编辑配置**，文件不存在时会自动创建。配置格式和 Windows、Mac 版一样，比如：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/你的用户名/Documents"]
    }
  }
}
```

很多 MCP 服务器用 `npx` 或 `uvx` 运行，需要先装好 Node.js 或 uv：`sudo pacman -S nodejs npm` / `sudo pacman -S uv`。改完配置要完全退出 Claude 再打开。连接出错时，日志在 `~/.config/Claude/logs/` 目录下。

### 6. Claude Code 命令行版

桌面端里的 Claude Code 会自动下载匹配版本的 CLI，不用单独装。如果你还想在终端里直接用 `claude` 命令，官方 CLI 在 Arch 上是**正式支持**的，用官方安装脚本安装：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

这个脚本会把 `claude` 装到你的家目录里（不需要 sudo），之后它会自己检查更新。装好后运行 `claude` 登录即可。

> 第一章说过，网上的 `curl ... | bash` 命令要先看懂再执行。这里的地址是 Anthropic 官方的 `claude.ai`，可以放心；但如果你在别处看到类似的命令，先确认域名是不是官方的。

### 7. 更新和卸载

- **更新**：官方文档说明 Linux 版**不会自己更新**，在 Ubuntu 上是靠 apt 更新的。在 Arch 上就是 AUR 包更新：日常运行 `paru` 时会一起检查。AUR 维护者更新包通常比官方发布晚一点。
- **卸载**：`sudo pacman -Rns claude-desktop`。登录信息和设置在 `~/.config/Claude/`，确认不再需要的话可以手动删掉。

### 8. Claude 桌面端常见问题

| 问题 | 解决办法 |
| --- | --- |
| 每次打开都要重新登录，或者提示"你的登录不会被保存" | Claude 用 KWallet 保存登录状态。确认 KWallet 已安装并解锁（系统设置 → KDE 钱包）。**如果你同时装了 `gnome-keyring`**，两个钥匙环会冲突，官方文档建议在 KDE 上删掉 `gnome-keyring` 后重启：先用 `pacman -Qi gnome-keyring` 看看是哪个软件依赖它，确认可以删再删 |
| 浏览器里登录成功了，但没有跳回桌面端 | 登录回调依赖 `claude://` 协议关联。在终端运行 `xdg-mime query default x-scheme-handler/claude`，应该输出 Claude 的 `.desktop` 文件名；没有的话重装一次 `claude-desktop`，然后注销重新登录 |
| 窗口白屏或黑屏 | 先在终端运行 `claude-desktop` 看报错。可以试试在 `~/.config/claude-desktop-flags.conf` 里加 `--disable-gpu`；或者加 `--ozone-platform=x11` 退回 XWayland |
| 提示 "Cowork requires hardware virtualization (KVM)" | BIOS 里没开 VT-x，见第 4 节 |
| 提示 "Claude doesn't have permission to use virtualization (/dev/kvm)" | 没加入 `kvm` 组，或者加了还没注销重新登录 |
| 提示 "Cowork requires QEMU" | 运行 `sudo pacman -S qemu-system-x86 edk2-ovmf`，重启 Claude |
| 不能用 root 运行 | 提示 "Running as root without --no-sandbox is not supported" 是因为你用了 sudo 启动。用普通用户启动即可 |
| 系统更新后打不开 | 重新安装：`paru -S claude-desktop --rebuild`；再去 AUR 页面看评论区有没有人报告同样的问题 |

## 七、日常维护：更新、清理、卸载干净

### 1. 更新

```bash
paru                       # 官方仓库 + archlinuxcn + AUR 一起更新
flatpak update             # Flatpak 软件单独更新
```

第一篇建议过**每周更新一次**。更新前花半分钟看一眼 [Arch 官方新闻](https://archlinux.org/news/)，如果有需要手动处理的重大变化，新闻里会写清楚怎么做。

更新时注意 pacman 的输出里有没有 `warning: ... installed as ....pacnew`，这表示某个配置文件有新版本，pacman 没有直接覆盖你改过的那份。可以用 `pacdiff`（在 `pacman-contrib` 包里）对比和合并：

```bash
sudo pacman -S pacman-contrib
sudo DIFFPROG=vimdiff pacdiff
```

### 2. 清理

```bash
sudo paccache -rk2                         # pacman 缓存只保留每个包最近 2 个版本
paru -Sc                                   # 清理 paru 的编译缓存
sudo pacman -Rns $(pacman -Qdtq)           # 删除孤儿包（作为依赖装上、但现在没人依赖的包）
flatpak uninstall --unused                 # 删除不用的 Flatpak 运行库
```

> 删除孤儿包之前，先单独运行 `pacman -Qdtq` 看看列表，确认里面没有你想保留的东西。`pacman -Qdtq` 没有输出时，第三条命令会报错 "no targets specified"，这是正常的，说明没有孤儿包。

想让 pacman 缓存自动清理，可以开启 `paccache` 的定时器，每周自动执行一次：

```bash
sudo systemctl enable --now paccache.timer
```

### 3. 卸载干净

`pacman -Rns` 只删除软件本身，**你家目录里的配置和数据不会删**。比如卸载 QQ 后，`~/.config/QQ`（包括聊天记录）还在。确认不要了，可以手动删掉：

| 软件 | 家目录里的数据 |
| --- | --- |
| QQ | `~/.config/QQ` |
| 微信 | `~/.xwechat`、`~/Documents/xwechat_files`（具体以微信设置里显示的为准） |
| WPS | `~/.config/Kingsoft`、`~/.local/share/Kingsoft` |
| Steam | `~/.local/share/Steam`（**包括所有游戏**，很大） |
| Claude 桌面端 | `~/.config/Claude` |
| Flatpak 软件 | `~/.var/app/应用ID` |

删之前先用 `du -sh 目录` 看看大小，用 `ls` 确认里面没有你想保留的东西。

## 八、常见问题汇总

### 1. paru 报错 "failed to download source" 或者下载很慢

- **下载失败**：通常是软件官方换了下载地址，PKGBUILD 还没跟上。去 AUR 页面看评论区和最后更新时间，等维护者更新。
- **下载很慢**：很多 AUR 包从 GitHub 下载源码，国内访问 GitHub 可能很慢。这属于网络问题，可以在终端里设置代理后再运行 paru：

```bash
export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890
paru -S 包名
```

### 2. pacman 报错 "signature is unknown trust" 或 "invalid or corrupted package"

通常是密钥过期。先更新密钥包再更新系统：

```bash
sudo pacman -Sy archlinux-keyring archlinuxcn-keyring
sudo pacman -Su
```

### 3. pacman 报错 "failed to commit transaction (conflicting files)"

说明有文件已经存在、但不属于任何包，或者属于另一个包。最常见的原因是你曾经用 `sudo make install`、`sudo pip install` 之类的方式往系统目录里写过文件。用 `pacman -Qo 冲突的文件路径` 查一下这个文件属于哪个包：

- 属于另一个包：说明两个包冲突，一般只能留一个。
- 不属于任何包：确认是你自己手动装的东西，删掉或者移走再重试。

**不要用 `--overwrite '*'` 强行覆盖**，除非 Arch 官方新闻明确让你这么做。

### 4. 编译 AUR 包时内存不足、电脑卡死

从源码编译大型软件（比如 `netease-cloud-music-gtk4` 这种 Rust 程序）时，会用满所有 CPU 核心，内存可能不够。可以优先选 `-bin` 版本，或者编辑 `/etc/makepkg.conf`，把 `MAKEFLAGS` 改成用一半的核心：

```text
MAKEFLAGS="-j6"
```

### 5. 某个软件在系统更新后打不开了

这是滚动发行版最常见的问题：系统的某个库升级了，而闭源软件还在用旧版本的库。按顺序处理：

1. 在终端运行这个软件，看报错信息。常见的类似 `error while loading shared libraries: libxxx.so.N`，说明缺某个旧版本的库。
2. 重新打包安装一次：`paru -S 包名 --rebuild`。
3. 去 AUR 页面看评论区，通常已经有人报告并给出了临时办法。
4. 实在不行，换成这个软件的 Flatpak 版，它自带运行库，不受系统更新影响。
5. 如果是系统更新后**很多东西都坏了**，用 snapper 回滚到更新前的快照（第一篇第十章），等几天再更新。

### 6. 应用菜单里出现了重复的图标

多半是同一个软件从两个渠道装了（比如 AUR 版和 Flatpak 版），或者用菜单编辑器改过启动命令。运行 `flatpak list --app` 和 `pacman -Qm` 对照一下，删掉其中一个；或者看看 `~/.local/share/applications/` 里有没有多余的 `.desktop` 文件。

## 结语

到这里，你的 Arch 已经能应付日常的大部分需求了：

1. 知道了**官方仓库、archlinuxcn、AUR、Flatpak 各是什么、该怎么选**，看到一个陌生的包名，也知道该怎么判断能不能装；
2. **QQ、微信、WPS** 都能用了，知道输入法、模糊、截图这几类问题的原因和处理方法；
3. 能用 **Steam + Proton** 玩大部分单机游戏，游戏跑在 RTX 4060 上，还能看到帧数；
4. 独显**需要时工作、不用时休眠**，续航不受影响；
5. 装好了 **Claude 桌面端**，Chat、Claude Code、Cowork 都能用。

Linux 上的软件生态还在快速变化：几年前 QQ 还是一个停更十年的老版本，现在已经和 Windows 版同步更新；Claude 桌面端也从无到有，出了官方 Linux 版。本文里提到的很多"可能遇到的问题"，说不定过几个月就被修好了。遇到问题时，**先看报错、再查 ArchWiki 和 AUR 评论区**，这是解决 Arch 问题最快的路径。

## 参考资料

- [ArchWiki：pacman](https://wiki.archlinux.org/title/Pacman)
- [ArchWiki：Arch User Repository](https://wiki.archlinux.org/title/Arch_User_Repository)
- [ArchWiki：Flatpak](https://wiki.archlinux.org/title/Flatpak)
- [ArchWiki：Fcitx5](https://wiki.archlinux.org/title/Fcitx5)
- [ArchWiki：Steam](https://wiki.archlinux.org/title/Steam) 和 [Steam/Troubleshooting](https://wiki.archlinux.org/title/Steam/Troubleshooting)
- [ArchWiki：GameMode](https://wiki.archlinux.org/title/GameMode)、[MangoHud](https://wiki.archlinux.org/title/MangoHud)
- [ArchWiki：PRIME](https://wiki.archlinux.org/title/PRIME) 和 [NVIDIA Optimus](https://wiki.archlinux.org/title/NVIDIA_Optimus)
- [Arch Linux 中文社区仓库（archlinuxcn）](https://www.archlinuxcn.org/archlinux-cn-repo-and-mirror/)
- [Flathub](https://flathub.org/)
- [ProtonDB](https://www.protondb.com/)、[Are We Anti-Cheat Yet?](https://areweanticheatyet.com/)
- [Claude 官方下载页](https://claude.com/download)
- [Claude Desktop on Linux (beta) 官方文档](https://code.claude.com/docs/en/desktop-linux)
- [Claude Code 安装文档](https://code.claude.com/docs/en/setup)
- AUR 包页面：[linuxqq](https://aur.archlinux.org/packages/linuxqq)、[wechat-bin](https://aur.archlinux.org/packages/wechat-bin)、[wps-office-cn](https://aur.archlinux.org/packages/wps-office-cn)、[claude-desktop](https://aur.archlinux.org/packages/claude-desktop)
