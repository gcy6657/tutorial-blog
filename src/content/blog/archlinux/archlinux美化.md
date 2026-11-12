---
title: Arch Linux 美化保姆级教程：从开机画面到终端，KDE Plasma 全链路统一配色
description: 双系统教程的续篇。在装好 KDE Plasma 的 Arch Linux 上，从 GRUB、开机动画、登录界面，到桌面主题、图标、光标、字体、面板 Dock、窗口特效，再到终端、输入法皮肤、GTK 和 Flatpak 程序，一步步美化成一套风格统一的系统。
pubDate: 2026-11-11
chapter: 2
tags: [Linux, ArchLinux, KDE, 美化]
---

> 本文是[《没有 U 盘也能装：Arch Linux + Windows 11 双系统保姆级教程》](/series/archlinux/archlinux双系统安装/)的续篇，默认你的系统和上一篇装完时一样：**KDE Plasma（Wayland 会话）+ Plasma Login Manager + GRUB + Btrfs 快照（snapper）+ fcitx5 + archlinuxcn 源和 paru**。本文基于 2026 年 11 月的 KDE Plasma 6.8 编写，界面文字和菜单位置在后续版本中可能有细微变化。

刚装好的 KDE 其实已经挺好看了，但"好看"和"顺眼"之间还差很多细节：开机先是一闪而过的 GRUB 黑底白字，然后滚一屏内核日志；中文字体偶尔冒出日文字形；终端是默认的黑底白字；输入法候选框和桌面不是一个颜色；装个 GTK 程序又是另一种风格……

这篇文章的目标是：**从按下电源键到打开终端，每一个看得到的环节都换成同一套配色和风格**。每一步都会说明改的是什么、为什么这么改、改坏了怎么恢复。

## 零、先看看最终效果和整体思路

### 1. 统一配色：Catppuccin Mocha

美化最容易犯的错误是"每个地方都挑自己最喜欢的主题"，结果桌面是蓝的、终端是绿的、输入法是粉的，拼在一起反而很乱。所以我们先定一套**配色方案**，然后所有组件都用它。

本文选用 [Catppuccin](https://catppuccin.com/) 的 **Mocha（深色）** 风味，强调色用 **Mauve（淡紫）**。选它的原因很实际：

- 它是目前**覆盖面最广**的配色方案之一，KDE、Konsole、fcitx5、GRUB、Starship、VS Code、浏览器……几乎都有官方移植，不用自己调色。
- 颜色柔和、对比度适中，长时间看不累眼。
- 有四种风味（Latte 浅色、Frappé、Macchiato、Mocha 深色），以后想换浅色，换同一系列就行，各组件依然统一。

> 不喜欢紫色？Catppuccin 有 14 种强调色可选（蓝、粉、绿、橙……），本文所有出现 `mauve` 的地方换成你喜欢的颜色名即可。不喜欢 Catppuccin 也没关系，本文会在每一节同时给出**只用 KDE 自带 Breeze 主题**的做法，同样能做到统一。

### 2. 美化路线图

| 环节 | 改什么 | 本文章节 |
| --- | --- | --- |
| 准备 | 快照、备份、了解 KDE 的外观设置层级 | 一 |
| 显示 | 缩放、刷新率、夜间颜色 | 二 |
| 字体 | 中文字体、等宽字体、渲染方式 | 三 |
| 桌面主题 | 全局主题、配色、强调色、深浅色自动切换 | 四 |
| 控件风格 | Breeze / Kvantum | 五 |
| 图标、光标 | Papirus 图标 + 文件夹配色、Bibata 光标 | 六、七 |
| 窗口 | 窗口装饰、标题栏按钮、桌面特效、动画 | 八 |
| 面板 | 顶栏 + 底部浮动 Dock、时钟农历、天气 | 九 |
| 桌面 | 壁纸、小部件、KRunner、Alt+Tab 样式 | 十 |
| 登录 | 锁屏、登录界面、欢迎屏幕 | 十一 |
| 开机 | Plymouth 开机动画 | 十二 |
| 引导 | GRUB 主题 | 十三 |
| 终端 | Konsole 配色、zsh、Starship、fastfetch | 十四 |
| 输入法 | fcitx5 皮肤 | 十五 |
| 其他程序 | GTK、Flatpak、浏览器统一外观 | 十六 |
| 收尾 | 备份美化配置、常见问题 | 十七、十八 |

每一章基本互相独立，可以只挑感兴趣的做。但**建议按顺序来**，因为后面的章节（比如登录界面同步、GTK 统一）会用到前面设置好的主题、图标和光标。

### 3. 几条原则

1. **优先用官方仓库里的包**，其次是 archlinuxcn，再次是 AUR，最后才是 GitHub 上的安装脚本。越靠后，越容易在系统更新后失效。
2. **少装第三方 KWin 特效和窗口装饰插件**。它们和 KDE 的内部接口绑定，Plasma 一升级就可能编译失败、桌面崩溃。本文会明确标出哪些属于这一类。
3. **运行别人的脚本之前先看一眼内容**，尤其是要 `sudo` 运行的脚本。

## 一、准备工作

### 1. 拍一张系统快照

后面会改到 GRUB、mkinitcpio 这类系统文件。虽然 snap-pac 会在每次 pacman 操作前后自动拍快照，但手动改配置文件不会触发，所以开工前手动拍一张：

```bash
sudo snapper -c root create -d "美化之前"
snapper -c root list
```

列表最后一行能看到"美化之前"就行了。万一后面改坏了系统、进不去桌面，按上一篇第十章的方法回滚即可。

### 2. 备份家目录里的桌面配置

**注意一个容易忽略的点**：上一篇的 snapper 只给根目录 `/` 拍快照，`/home` 是单独的 `@home` 子卷，**不在快照范围内**。而 KDE 的所有外观设置都存在家目录里，所以快照回滚救不了"面板被我弄乱了"这种问题。

开工前把桌面相关的配置打个包：

```bash
mkdir -p ~/backup
tar czf ~/backup/kde-config-$(date +%Y%m%d).tar.gz \
  -C ~ .config/kdeglobals .config/kwinrc .config/plasmarc \
  .config/plasma-org.kde.plasma.desktop-appletsrc .config/plasmashellrc \
  .config/kscreenlockerrc .config/ksplashrc .config/kcminputrc \
  .config/konsolerc .config/fcitx5 2>/dev/null
ls -lh ~/backup
```

> 有几个文件可能还不存在（比如你从没改过锁屏，就没有 `kscreenlockerrc`），tar 会提示找不到，没关系，`2>/dev/null` 已经把这些提示隐藏了，只要最后生成了压缩包就行。

想恢复到这个状态时：注销登录，按 `Ctrl + Alt + F3` 进入命令行界面登录，运行 `tar xzf ~/backup/kde-config-日期.tar.gz -C ~`，然后 `sudo systemctl restart plasmalogin` 回到图形登录界面。

### 3. 安装后面要用到的基础工具

```bash
sudo pacman -S --needed git unzip wget
```

`--needed` 表示已经装过的就跳过。`git` 一般装 paru 时已经顺带装上了，这里只是保险。

### 4. 先搞懂 KDE 的"外观设置"分几层

KDE 的外观设置项很多，新手最常见的困惑是："我明明换了主题，为什么有的地方没变？"原因是 KDE 的外观是**分层**的，每一层管不同的东西：

| 设置项 | 管什么 | 例子 |
| --- | --- | --- |
| 全局主题 | **一键套装**，同时设置下面的若干项 | Breeze 深色、Catppuccin Mocha |
| 颜色（配色方案） | 所有窗口、按钮、文字的颜色 | 背景深灰、选中高亮紫色 |
| 应用程序风格 | 按钮、滚动条、复选框等**控件的形状** | Breeze、Kvantum、Fusion |
| Plasma 视觉风格 | 面板、弹出菜单、桌面小部件的外观 | Breeze、Breeze 深色 |
| 窗口装饰 | 窗口**标题栏**和边框 | Breeze、Aurorae 主题 |
| 图标 | 程序图标、文件夹图标 | Breeze、Papirus |
| 光标 | 鼠标指针 | Breeze、Bibata |
| 欢迎屏幕 | 登录后、桌面出现前的那几秒加载动画 | Breeze、无 |

这些都在 **系统设置 → 颜色和主题**（Colors & Themes）下面。全局主题只是帮你把其他几项一起切换，之后你仍然可以单独改其中某一项，比如全局主题用 Catppuccin，图标单独换成 Papirus。

> 本文写的菜单路径以 Plasma 6.8 的中文界面为准。KDE 每个版本都可能微调菜单位置，**找不到某个设置时，直接在系统设置左上角的搜索框里搜关键词**（比如"光标""特效""字体"），比按路径找快得多。

### 5. 关于"获取新…"按钮

系统设置里几乎每个外观页面右下角都有一个"获取新…"（Get New…）按钮，点开是 KDE 商店（store.kde.org）里用户上传的主题，一键下载安装，非常方便。

但要知道：**商店里的内容没有经过官方审核**。主题包本质上可以包含脚本（尤其是全局主题和 Plasma 小部件），历史上出现过有人上传带破坏性命令的主题的事件。所以：

- 优先选**下载量高、评分高、最近更新过**的主题。
- 全局主题、小部件这类可能包含代码的东西，尽量从官方仓库、archlinuxcn 或者知名项目的 GitHub 获取。
- 纯图片类的东西（壁纸、配色方案、光标）风险很小，可以放心用商店。

## 二、显示基础：缩放、刷新率、夜间颜色

美化之前先把屏幕本身调对，否则字体和图标再好看，糊了、太小了也白搭。

打开 **系统设置 → 显示和监视器 → 显示配置**（Display Configuration）：

| 选项 | 建议 | 说明 |
| --- | --- | --- |
| 分辨率 | 屏幕原生分辨率（带"推荐"字样的那个） | 非原生分辨率一定会糊 |
| 刷新率 | 选最高的（比如 144 Hz） | 笔记本屏幕多数是高刷屏，默认可能只开了 60 Hz。Plasma 6.6 起高刷屏上的动画明显更顺滑 |
| 缩放 | 15.6 寸 1080p：100% 或 125%；2K 及以上：150%～200% | Wayland 下分数缩放（125%、150%）是清晰的，不会像以前 X11 那样糊 |
| 自适应同步 | "自动"或"总是" | 屏幕支持 FreeSync/G-Sync 时打开，游戏和视频不撕裂 |

改完点"应用"，会弹出确认窗口，确认显示正常后点"保留"。如果画面出问题没法点，等 15 秒会自动恢复原设置。

**夜间颜色**：系统设置 → 显示和监视器 → 夜间颜色（Night Light），选"日落到日出"并允许定位，或者手动设置时间。晚上屏幕会自动变暖色，减轻眼睛疲劳。顺便说一句，这个设置和后面"深浅色主题自动切换"可以配合使用：天黑后同时切深色主题 + 暖色屏幕。

## 三、字体：观感提升最大的一步

字体是美化里**投入最少、收益最大**的一项。上一篇我们只装了 `noto-fonts` 系列，能显示中文，但还有两个问题：

1. 中文有时会显示成**日文字形**（比如"门""关""直""骨"这几个字，笔画和大陆写法不一样）。
2. 终端和代码用的等宽字体是默认的，没有图标字形，后面 Starship 提示符里的图标会显示成方块。

### 1. 安装字体

```bash
sudo pacman -S --needed noto-fonts noto-fonts-cjk noto-fonts-emoji noto-fonts-extra \
  ttf-jetbrains-mono-nerd ttf-nerd-fonts-symbols
```

| 软件包 | 作用 |
| --- | --- |
| `noto-fonts` | 西文界面字体（Noto Sans / Noto Serif） |
| `noto-fonts-cjk` | 中日韩字体，包含思源黑体（Noto Sans CJK）和思源宋体（Noto Serif CJK） |
| `noto-fonts-emoji` | 彩色 emoji |
| `noto-fonts-extra` | Noto 的更多字重和变体，部分程序会用到 |
| `ttf-jetbrains-mono-nerd` | **JetBrains Mono 的 Nerd Font 版本**：等宽、适合写代码，还打包了几千个图标字形 |
| `ttf-nerd-fonts-symbols` | 单独的 Nerd 图标字体，给其他字体当后备 |

> **什么是 Nerd Font？** 就是在普通编程字体里额外塞进 Font Awesome、Material Design 等图标集的版本。终端里那些漂亮的 Git 分支图标、文件夹图标、Arch 图标，全靠它显示。只要终端字体设成 Nerd Font，这些图标就能正常显示。

**（可选）霞鹜文楷**：一款很受欢迎的开源楷体，适合当阅读字体或者整个界面的字体，看起来很文艺。在 AUR 里：

```bash
paru -S ttf-lxgw-wenkai
```

另外还有 `ttf-lxgw-wenkai-mono-nerd`（霞鹜文楷等宽 + Nerd 图标），喜欢的话可以拿来当终端字体。

### 2. 配置字体优先级，解决"日文字形"

为什么会出现日文字形？`noto-fonts-cjk` 是一个"超级字体"，同一个字同时包含简体中文、繁体中文、日文、韩文几种写法。程序在没有明确指定语言时，fontconfig 可能按字母顺序先选到 `Noto Sans CJK JP`，于是"门"就变成了日文写法。

解决办法是写一个用户级的 fontconfig 配置，**明确告诉系统：中文优先用简体中文版本**。

```bash
mkdir -p ~/.config/fontconfig
vim ~/.config/fontconfig/fonts.conf
```

写入下面的内容（vim 里按 `i` 进入插入模式，粘贴用 `Ctrl + Shift + V`，最后 `Esc` 再 `:wq`）：

```xml
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <!-- 无衬线（界面默认）：西文用 Noto Sans，中文用简体版思源黑体 -->
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Noto Sans</family>
      <family>Noto Sans CJK SC</family>
      <family>Noto Color Emoji</family>
    </prefer>
  </alias>

  <!-- 衬线（网页正文等）：中文用简体版思源宋体 -->
  <alias>
    <family>serif</family>
    <prefer>
      <family>Noto Serif</family>
      <family>Noto Serif CJK SC</family>
      <family>Noto Color Emoji</family>
    </prefer>
  </alias>

  <!-- 等宽（终端、代码）：西文和图标用 JetBrains Mono Nerd，中文用思源黑体等宽版 -->
  <alias>
    <family>monospace</family>
    <prefer>
      <family>JetBrainsMono Nerd Font</family>
      <family>Noto Sans Mono CJK SC</family>
      <family>Noto Color Emoji</family>
    </prefer>
  </alias>

  <!-- 网页或程序直接点名要日文/繁体字体时，也换成简体中文版本 -->
  <match target="pattern">
    <test name="lang" compare="contains">
      <string>zh</string>
    </test>
    <test name="family">
      <string>Noto Sans CJK JP</string>
    </test>
    <edit name="family" mode="assign" binding="strong">
      <string>Noto Sans CJK SC</string>
    </edit>
  </match>
</fontconfig>
```

刷新字体缓存并检查结果：

```bash
fc-cache -fv
fc-match sans-serif
fc-match "sans-serif:lang=zh-cn"
fc-match monospace
```

预期输出大致是：

```text
NotoSans-Regular.ttf: "Noto Sans" "Regular"
NotoSansCJK-Regular.ttc: "Noto Sans CJK SC" "Regular"
JetBrainsMonoNerdFont-Regular.ttf: "JetBrainsMono Nerd Font" "Regular"
```

关键是第二行显示的是 **`Noto Sans CJK SC`**（SC = Simplified Chinese），而不是 JP。

> **字体名字不对？** 不同版本的 Nerd Font 命名可能略有不同。用 `fc-list : family | grep -i jetbrains` 查看系统里实际的字体名，把配置里的 `JetBrainsMono Nerd Font` 换成查到的名字。注意 `JetBrainsMono Nerd Font Mono` 是"图标也严格等宽"的版本，图标会变小，一般终端用不带 `Mono` 后缀的就行。

### 3. 在 KDE 里设置界面字体

打开 **系统设置 → 文字和字体 → 字体**（Text & Fonts → Fonts）：

| 项目 | 建议设置 |
| --- | --- |
| 常规 | Noto Sans 10pt（想要文艺风可以换成霞鹜文楷 11pt） |
| 等宽 | JetBrainsMono Nerd Font 10pt |
| 小号 | Noto Sans 8pt |
| 工具栏 / 菜单 | Noto Sans 10pt |
| 窗口标题 | Noto Sans 10pt，可以设为粗体（Bold） |

> 这里写的是 Noto Sans 而不是 Noto Sans CJK SC，是因为西文部分用 Noto Sans 更好看，中文会自动按刚才的 fontconfig 配置回落到 Noto Sans CJK SC。如果你喜欢中西文都用思源黑体的统一观感，也可以直接选 Noto Sans CJK SC。

下方的**抗锯齿**设置：

| 选项 | 建议 | 说明 |
| --- | --- | --- |
| 抗锯齿 | 启用 | |
| 次像素渲染 | RGB | 绝大多数笔记本屏幕是 RGB 排列。如果字的边缘有彩色毛边，改成"无" |
| 微调 | 轻微（Slight） | 在保留字形和清晰度之间取平衡，中文字体用"完全"反而会变形 |

点"应用"。已经打开的程序可能要重启后才完全生效。

## 四、全局主题与配色

这一章是整套美化的"底色"，有两条路线，**二选一**：

- **路线 A：Breeze 深色 + 强调色**。KDE 官方自带，零安装、最稳定，Plasma 升级永远不会出问题。
- **路线 B：Catppuccin Mocha**。本文主推，颜色更柔和、和后面的终端、输入法、GRUB 能完全统一。

### 1. 路线 A：Breeze 深色

1. 系统设置 → 颜色和主题 → **全局主题**，选 **Breeze 深色**（Breeze Dark），点"应用"。
2. 系统设置 → 颜色和主题 → **颜色**，下方"强调色"处可以选：
   - **来自配色方案**：用主题默认的蓝色。
   - **来自壁纸**：根据当前壁纸自动提取主色调，换壁纸时整个系统的高亮色跟着变。这个功能很有意思，推荐试试。
   - **自定义**：手动挑一个颜色。

Breeze 路线到这里就完成了，可以直接跳到第五章。

### 2. 路线 B：安装 Catppuccin 全局主题

Catppuccin 官方提供了 KDE 的安装脚本，会安装：配色方案、全局主题、Aurorae 窗口装饰（标题栏）、欢迎屏幕，以及（可选的）配套光标。

先把仓库克隆下来，**看一眼脚本内容**：

```bash
cd ~
git clone --depth=1 https://github.com/catppuccin/kde catppuccin-kde
cd catppuccin-kde
less install.sh
```

`less` 里用方向键翻页，按 `q` 退出。脚本主要是把主题文件复制到 `~/.local/share/` 下的各个目录，不需要 sudo。

然后运行。可以直接 `./install.sh` 按提示交互选择，也可以用自动模式一次指定好：

```bash
./install.sh -n 1 4 1 auto
```

参数含义：

| 参数 | 含义 | 可选值 |
| --- | --- | --- |
| `-n` | 不安装配套光标 | 我们第七章单独装 Bibata 光标。想用 Catppuccin 光标就去掉 `-n` |
| `1` | 风味 | 1 = Mocha（最深）、2 = Macchiato、3 = Frappé、4 = Latte（浅色） |
| `4` | 强调色 | 1 Rosewater、2 Flamingo、3 Pink、**4 Mauve**、5 Red、6 Maroon、7 Peach、8 Yellow、9 Green、10 Teal、11 Sky、12 Sapphire、13 Blue、14 Lavender |
| `1` | 窗口装饰样式 | 1 = Modern（现代，按钮是彩色圆点）、2 = Classic（经典） |
| `auto` | 不再询问，直接安装 | |

> 风味和强调色的编号顺序以脚本实际提示为准。不确定就去掉参数直接运行 `./install.sh`，它会一项项列出来让你选。

脚本运行时会从 KDE 商店下载部分资源，如果报 `connection refused`，一般是商店暂时打不开或网络问题，过一会儿重试即可。

安装完成后，打开 **系统设置 → 颜色和主题 → 全局主题**，选中 **Catppuccin Mocha-Mauve**，点"应用"。

**非常重要**：点应用时如果弹出对话框，里面有一项"**桌面和窗口布局**"（Desktop and window layout），**不要勾选它**。勾上会把你的面板、桌面小部件全部重置成主题作者的布局。我们只要外观，不要布局。

> 安装脚本会往 `~/.config/kwinrc` 里写一行 `BorderSizeAuto=false`（为了让窗口无边框），这是它唯一修改的主题目录以外的设置，不影响别的东西。

应用后，窗口颜色、面板、标题栏应该都变成了 Catppuccin 的深紫灰色调。

### 3.（可选）深浅色自动切换

Plasma 6.5 起支持**根据时间自动切换浅色和深色全局主题**。在 **全局主题** 页面里找到深浅色切换相关的选项，分别指定一个"浅色主题"（比如 Breeze 或 Catppuccin Latte）和一个"深色主题"（比如 Catppuccin Mocha），再选择按日出日落还是固定时间切换。

> 用 Catppuccin 路线时，如果要开自动切换，记得浅色主题也用 Catppuccin 系列（Latte），否则白天切过去风格会跳变。可以重新运行一次 `./install.sh` 选风味 4（Latte）把浅色版也装上。

## 五、应用程序风格：Breeze 还是 Kvantum

"应用程序风格"决定的是按钮、滚动条、下拉框、复选框这些**控件的形状**（颜色由上一章的配色方案决定）。

### 1. 默认的 Breeze 就很好

KDE 自带的 Breeze 风格会自动套用你选的配色方案，Catppuccin 的颜色已经会体现在所有 KDE 程序里。**绝大多数人到这里就够了，推荐保持 Breeze。**

可以微调的地方：系统设置 → 颜色和主题 → 应用程序风格，点 Breeze 右边的"配置"（齿轮图标），常用选项：

- **菜单透明度**：拉到 80～90%，配合模糊特效，右键菜单会有毛玻璃效果。
- **在工具栏中绘制分隔线**、**绘制焦点指示**：按个人喜好。

> Plasma 6.8 里还有一个叫 **Union** 的新主题引擎（已经包含在 `plasma-meta` 里），它是 KDE 正在开发的下一代统一主题系统，目前还在测试阶段。你不需要手动设置它，正常使用 Breeze 即可。

### 2.（可选）Kvantum：更自由的控件风格

Kvantum 是一个基于 SVG 的主题引擎，能做出 Breeze 做不到的效果，比如半透明窗口背景、更圆的按钮、仿 macOS 风格等。

```bash
sudo pacman -S kvantum
```

装好后打开开始菜单里的 **Kvantum Manager**：

1. "变更/删除主题"（Change/Delete Theme）里可以选内置主题（如 KvArc、KvGnome 系列），或者在"安装/更新主题"里安装从网上下载的 Kvantum 主题文件夹。
2. 选好后点"使用此主题"。
3. 回到系统设置 → 应用程序风格，选择 **kvantum**（如果选 `kvantum-dark`，会强制使用深色变体），点应用。

**Kvantum 的缺点也要知道**：

- 它只管 Qt 程序（KDE 程序），GTK 程序不受影响，Catppuccin 等配色和它组合时需要找配套的 Kvantum 主题，否则颜色会和配色方案打架。
- 透明背景效果在部分程序里会导致文字看不清。
- 和 Breeze 相比，某些新版 KDE 控件（尤其是 Kirigami 界面的程序，比如系统设置本身）的显示可能会有小毛病。

**建议**：先用 Breeze 一段时间，确实有特定需求再上 Kvantum。想撤销，在应用程序风格里选回 Breeze 即可，`sudo pacman -Rns kvantum` 卸载。

## 六、图标：Papirus

KDE 默认的 Breeze 图标偏扁平简约，很多人更喜欢 **Papirus**：覆盖的程序非常全（几千个应用图标），风格圆润统一，还能改文件夹颜色。

### 1. 安装 Papirus

它在官方仓库里：

```bash
sudo pacman -S papirus-icon-theme
```

打开 **系统设置 → 颜色和主题 → 图标**，选 **Papirus-Dark**（深色主题配深色版，面板上的图标是浅色的），点应用。

> Papirus 有三个变体：`Papirus`（自动）、`Papirus-Dark`（适合深色面板）、`Papirus-Light`（适合浅色面板）。深色主题选 Papirus-Dark，否则托盘图标可能是黑色的、在深色面板上看不清。

### 2. 把文件夹颜色改成和强调色一致

Papirus 默认文件夹是蓝色的，和我们的紫色强调色不搭。用 `papirus-folders` 工具改：

```bash
paru -S papirus-folders
papirus-folders -l --theme Papirus-Dark
```

第二条命令会列出所有可用颜色（`black`、`blue`、`violet`、`magenta`、`nordic`……），当前颜色前面有 `>` 标记。改成紫色：

```bash
papirus-folders -C violet --theme Papirus-Dark
```

命令会自动请求 sudo 权限。完成后打开 Dolphin 文件管理器，文件夹应该都变成紫色了。如果没变，注销重新登录一次。

> 想要和 Catppuccin 配色完全一致的文件夹颜色，可以看 Catppuccin 官方的 [papirus-folders](https://github.com/catppuccin/papirus-folders) 移植，它提供了 `cat-mocha-mauve` 这样的精确配色，按其 README 把额外的文件夹图标复制进 Papirus 目录后，用 `papirus-folders -C cat-mocha-mauve --theme Papirus-Dark` 切换。

### 3. 其他值得一试的图标

| 图标主题 | 软件包 | 风格 |
| --- | --- | --- |
| Tela Circle | `tela-circle-icon-theme-purple`（官方仓库，有多种颜色） | 圆形图标，和紫色强调色很搭 |
| Breeze | 系统自带 | KDE 原生，最稳定 |

## 七、光标：Bibata

鼠标指针是一个很小但随时都看得见的地方。默认的 Breeze 光标中规中矩，**Bibata** 是目前最受欢迎的光标主题之一：圆润、有平滑的加载动画。

### 1. 安装

```bash
paru -S bibata-cursor-theme-bin
```

> `-bin` 版本直接下载作者编译好的文件，安装很快。不带 `-bin` 的 `bibata-cursor-theme` 需要本地从源文件生成，比较慢。

### 2. 应用

打开 **系统设置 → 颜色和主题 → 光标**，会看到几个 Bibata 变体：

| 名称 | 样式 |
| --- | --- |
| Bibata-Modern-Ice | 现代圆角，**白色**（深色主题推荐，在深色背景上最显眼） |
| Bibata-Modern-Classic | 现代圆角，黑色 |
| Bibata-Modern-Amber | 现代圆角，琥珀色 |
| Bibata-Original-* | 尖角版本 |

选 **Bibata-Modern-Ice**，下方"大小"选 24（1080p 屏幕）或 32（高分屏），点应用。

> 用了 Catppuccin 的安装脚本而没加 `-n` 的话，这里还会有 Catppuccin 的光标（比如 `catppuccin-mocha-mauve-cursors`），也是一个和配色完全统一的选择。

**光标不一致问题**：有时候在某些程序窗口里，光标会变回默认样式或者大小不一样。这个问题我们在第十一章（登录界面）和第十六章（GTK、Flatpak）里统一解决。

## 八、窗口：装饰、按钮和特效

### 1. 窗口装饰（标题栏）

打开 **系统设置 → 颜色和主题 → 窗口装饰**。

- 用 Catppuccin 路线的话，这里应该已经选中了 **Catppuccin Mocha-Mauve Modern**（Aurorae 主题），标题栏按钮是三个彩色圆点。
- 用 Breeze 路线的话，保持 **Breeze**，点右侧齿轮可以调：
  - **按钮大小**：中等或大。
  - **边框大小**：选"无侧边框"或"无边框"，窗口看起来更简洁（调整窗口大小仍然可以在窗口边缘拖动，只是看不见边框）。
  - **在活动窗口的标题栏下方绘制分隔线**：可以关掉，更干净。

**调整标题栏按钮位置**：窗口装饰页面底部点"配置标题栏按钮…"（Configure Titlebar Buttons），可以直接拖动按钮：

- 想要 macOS 风格：把"关闭、最小化、最大化"拖到左侧，顺序依次是关闭、最小化、最大化。
- 不常用的按钮（比如"在所有桌面上"、"上下文帮助"）可以拖到下方的按钮库里移除。

> **关于 Klassy 等第三方窗口装饰**：AUR 里有 Klassy 这类高度可定制的窗口装饰插件，效果很漂亮，但它们是编译插件，需要和 Plasma 版本完全匹配。写这篇文章时 Plasma 已经是 6.8，而 AUR 里的 Klassy 还是基于 6.7 的版本。这类插件很可能在 Plasma 升级后失效，所以本文不推荐，Aurorae 主题（Catppuccin 装的就是这种）是纯主题文件，没有这个问题。

### 2. 桌面特效

KDE 的窗口特效由窗口管理器 KWin 提供，打开 **系统设置 → 窗口管理 → 桌面特效**（Desktop Effects）。这里列出了几十个特效，勾上就生效，部分特效右边有齿轮可以调参数。

推荐的特效组合：

| 特效 | 建议 | 效果 |
| --- | --- | --- |
| 模糊（Blur） | **开启**，强度调到中等偏高，噪点调低 | 面板、菜单、半透明窗口背后的毛玻璃效果，美化的灵魂 |
| 背景对比度（Background Contrast） | 开启 | 让毛玻璃上的文字更清晰 |
| 窗口晃动（Wobbly Windows） | 可选 | 拖动窗口时像果冻一样晃，参数里把"晃动程度"调低一点更优雅 |
| 魔灯（Magic Lamp） | 可选，替换默认的"最小化动画" | 最小化时窗口像 macOS 一样被"吸"进任务栏 |
| 缩放 / 滑翔（Scale / Glide） | 二选一 | 窗口打开、关闭时的动画 |
| 滑动（Slide） | 开启 | 切换虚拟桌面时的滑动动画 |
| 桌面立方体（Desktop Cube） | 可选 | 经典的 3D 立方体桌面切换，开启后用 `Meta + C` 呼出 |
| 摇动光标定位（Shake Cursor） | 推荐开启 | 快速晃鼠标时光标会放大，找不到鼠标时很有用 |
| 鼠标点击动画（Mouse Click Animation） | 录屏时开启 | 点击时出现波纹 |
| 概览（Overview） | 默认开启 | `Meta + W` 查看所有窗口和虚拟桌面，`Meta + G` 显示桌面网格 |

> `Meta` 键就是键盘上的 Windows 键。

**动画速度**：系统设置 → 常规行为（General Behavior）→ 动画速度。默认值偏慢的话往"即时"方向拉一两格，系统会显得更灵敏。

### 3. 窗口透明度

想让某些窗口（比如 Dolphin、Kate）半透明，KDE 用的是"窗口规则"：

1. 打开要设置的程序，右键标题栏 → 更多操作 → **配置特殊应用程序设置**（Configure Special Application Settings）。
2. 点"添加属性"，搜索"活动窗口不透明度"和"非活动窗口不透明度"，添加。
3. 两项都改成"强制"，活动窗口设 90%，非活动窗口设 85%。
4. 点"应用"。

配合模糊特效，就有毛玻璃效果了。

> **不要给所有程序都加透明**：浏览器、视频播放器、代码编辑器透明了反而影响使用。终端的透明我们在第十四章用 Konsole 自己的设置实现，效果比窗口规则更好（只有背景透明，文字不透明）。

### 4. 关于第三方 KWin 特效

AUR 里有一些非常热门的第三方特效，比如"更好的模糊"（可以给任意窗口加模糊，`kwin-effects-better-blur-dx`）、"圆角窗口"等。和第三方窗口装饰一样，**它们是编译进 KWin 的插件，Plasma 每次升级都可能导致失效甚至 KWin 崩溃**（表现为登录后黑屏、窗口没有标题栏）。

如果你一定要用：

1. 确认 AUR 页面上的版本已经支持当前的 Plasma 版本，评论区没有大量报错。
2. 每次 `sudo pacman -Syu` 升级了 `kwin` 之后，记得用 `paru -S 包名` 重新编译一次。
3. 真的出问题了，在命令行界面（`Ctrl + Alt + F3`）里 `paru -Rns 包名` 卸载即可恢复。

## 九、面板与 Dock：顶栏 + 底部浮动 Dock

KDE 默认是 Windows 风格：底部一条长面板，左边开始菜单，中间任务栏，右边托盘和时钟。我们把它改成更流行的布局：

- **顶栏**：左边是开始菜单，中间是时钟，右边是系统托盘。
- **底部 Dock**：居中、浮动、只显示程序图标，窗口靠近时自动让开。

### 1. 先认识面板编辑模式

在 Plasma 6 里，右键面板空白处 → **显示面板配置**（Show Panel Configuration），或者右键桌面 → **进入编辑模式**（Enter Edit Mode）。进入编辑模式后：

- 面板上的每个部件都可以**直接拖动**换位置，鼠标悬停在部件上会出现删除按钮。
- 面板会弹出一个设置窗口，可以改位置、对齐、宽度、可见性等。
- 完成后点屏幕顶部的"退出编辑模式"（或者按 `Esc`）。

### 2. 建一个顶栏

1. 右键桌面 → 进入编辑模式 → 顶部工具栏点 **添加面板** → **空面板**（Empty Panel）。
2. 新面板出现后，在面板设置里把**位置**改成"顶部"，**高度**设为 32 左右。
3. 点面板上的 **添加部件**（Add Widgets），从左侧弹出的部件列表里依次把下面这些拖到顶栏上：

| 位置 | 部件 | 说明 |
| --- | --- | --- |
| 左侧 | 应用程序启动器（Application Launcher） | 开始菜单 |
| 左侧（可选） | 全局菜单（Global Menu） | 像 macOS 一样把程序的菜单栏显示在顶栏上 |
| 中间 | 弹性空白（Spacer） | 拖一个放在时钟左边 |
| 中间 | 数字时钟（Digital Clock） | |
| 中间 | 弹性空白 | 再拖一个放在时钟右边，时钟就居中了 |
| 右侧（可选） | 系统监视传感器（System Monitor Sensor） | 显示 CPU、内存、网速 |
| 右侧 | 系统托盘（System Tray） | 网络、音量、电池、输入法等 |

> 弹性空白放好后，在编辑模式下点它，确认"可伸缩"（Flexible）是开着的，这样两个弹性空白会平分剩余空间，时钟正好在中间。

### 3. 把原来的底部面板改成 Dock

1. 进入编辑模式，在**原来的底部面板**上，把"应用程序启动器""系统托盘""数字时钟""显示桌面"等部件删掉（顶栏已经有了），**只保留"图标任务管理器"**（Icons-only Task Manager）。如果默认的是"任务管理器"（带文字的那种），删掉它，换一个"仅图标任务管理器"。
2. 在底部面板的设置窗口里改：

| 设置项 | 改成 | 说明 |
| --- | --- | --- |
| 对齐 | 居中 | |
| 宽度 | **适应内容**（Fit content） | 面板只有图标那么宽 |
| 高度 | 48～56 | Dock 图标大一点好看 |
| 可见性 | **避开窗口**（Dodge windows） | 窗口挡住 Dock 时它自动隐藏，鼠标移到底边再出现 |
| 不透明度 | 自适应（Adaptive） | 有窗口最大化时变成不透明，平时半透明 |
| 浮动 | **开启** | 面板和屏幕边缘留出空隙，悬浮在桌面上 |

3. 顶栏也可以按需要开启"浮动"和"自适应不透明度"，风格就统一了。

### 4. 调整任务管理器（Dock 图标）

右键 Dock 里的任意图标旁空白处 → **配置图标任务管理器**：

- **外观**：取消"高亮窗口"之类的选项让它更干净；"图标大小"可以调大一档。
- **行为**：分组选"按程序名称"；勾选"在任务管理器按钮上显示进度和状态信息"（下载进度、未读消息数会显示在图标上）。

**固定常用程序**：在开始菜单里右键某个程序 → **固定到任务管理器**（Pin to Task Manager），或者在程序运行时右键 Dock 上的图标 → 固定。

### 5. 时钟：显示日期、秒和农历

右键顶栏的时钟 → **配置数字时钟**：

- **外观**：
  - 勾选"显示日期"，日期格式选"自定义"，可以输入 `M月d日 ddd`，显示成"11月11日 周三"。
  - 想显示秒就勾"显示秒"。
  - 字体可以单独设置，比如粗体。
- **日历**：
  - 勾选"显示周数"。
  - "可用插件"里勾选 **替代日历**（Alternate Calendar），然后在左侧多出来的"替代日历"页面里选 **中国农历**。之后点开时钟弹出的日历里，每个日期下面就会显示农历日期。
  - 再勾选"节假日"插件，选"中国"，就能显示法定节假日。

### 6. 其他推荐的面板小部件

| 部件 | 作用 |
| --- | --- |
| 天气报告（Weather Report） | 设置里搜索你的城市（用拼音或英文，数据源选 wetter.com 对国内城市支持较好），面板上显示天气图标和温度 |
| 应用程序面板（Application Dashboard） | 全屏的开始菜单，类似 macOS 的启动台，可以替换左上角的"应用程序启动器" |
| 系统监视传感器 | 在面板上显示 CPU 占用、温度、网速，放几个在顶栏右侧，很有极客感 |
| 颜色选择器（Color Picker） | 屏幕取色，做设计时很方便 |
| 输入法面板（Input Method Panel） | **不推荐**添加，原因见第十五章 |

> 面板如果被你折腾乱了，最省事的恢复方法是：右键桌面 → 进入编辑模式 → 删除面板，然后重新添加。或者用第一章备份的 `plasma-org.kde.plasma.desktop-appletsrc` 恢复。

## 十、壁纸、桌面小部件和小细节

### 1. 壁纸

右键桌面 → **配置桌面和壁纸**（Configure Desktop and Wallpaper）。"壁纸类型"有几种：

| 类型 | 说明 |
| --- | --- |
| 图片（Image） | 固定一张图片。点"添加图片…"选择本地文件 |
| 幻灯片（Slideshow） | 指定一个文件夹，按设定的时间间隔轮换 |
| 每日一图（Picture of the Day） | 每天自动下载一张，来源可选 Bing、NASA 每日天文图、Wikimedia 等 |
| 纯色 / 渐变 | 极简风 |

**壁纸从哪里找**：

- 官方额外壁纸包：`sudo pacman -S plasma-workspace-wallpapers`，装好后在"图片"类型里就能看到 KDE 历年的官方壁纸。
- 壁纸页面右下角的"获取新壁纸…"（KDE 商店，纯图片，可以放心用）。在商店里搜 `catppuccin` 能找到不少配色统一的壁纸。

> **选壁纸的小技巧**：如果第四章强调色选了"来自壁纸"，换壁纸时整个系统的高亮色都会跟着变。用 Catppuccin 路线的话，选紫色、蓝紫色调的壁纸最协调；色彩很杂、饱和度很高的壁纸，会让面板和窗口的毛玻璃效果显得脏。

另外，KDE 支持"**深浅色壁纸**"：一个壁纸包里同时有浅色版和深色版，配合第四章的深浅色自动切换，白天晚上壁纸也会跟着变。KDE 自带的几张官方壁纸大多支持这个功能。

### 2. 桌面小部件

右键桌面 → 进入编辑模式 → 添加部件，可以直接往桌面上拖小部件：

- **数字时钟 / 模拟时钟**：桌面大时钟。
- **便笺**（Sticky Note）：桌面便利贴。
- **系统监视器**：把 CPU、内存曲线放在桌面一角。
- **媒体播放器**：显示正在播放的音乐，带控制按钮。

建议**桌面上少放东西**，两三个就够了，桌面干净比塞满了好看。

### 3. KRunner：比开始菜单更快的启动器

按 `Alt + 空格`（或者在桌面上直接打字）会弹出 KRunner，可以搜程序、文件、计算数学式、换算单位。

系统设置里搜索 **KRunner**，可以：

- 把位置从"屏幕顶部"改成"**屏幕中央**"（浮动窗口），更像 macOS 的 Spotlight。
- 在插件列表里关掉用不到的搜索来源，让结果更干净、速度更快。

### 4. 任务切换器（Alt + Tab）

系统设置 → 窗口管理 → **任务切换器**（Task Switcher），"视觉效果"里可以选不同样式：

| 样式 | 效果 |
| --- | --- |
| 缩略图网格（Thumbnail Grid） | 显示每个窗口的实时缩略图，最实用 |
| 大图标（Large Icons） | 只显示程序图标 |
| 封面切换（Cover Switch） / 翻转切换（Flip Switch） | 3D 效果，好看但略慢 |

### 5. 系统声音

系统设置 → 颜色和主题 → **系统声音**（System Sounds），可以把提示音换成 Ocean（Plasma 6 默认）或 Oxygen，也可以直接关掉所有提示音。

## 十一、锁屏、登录界面和欢迎屏幕

开机后看到的第一个图形界面是登录界面，然后是欢迎屏幕（加载动画），然后才是桌面；离开电脑时看到的是锁屏。这三个地方都要和桌面统一。

### 1. 锁屏

系统设置 → 安全与隐私 → **屏幕锁定**（Screen Locking），点"外观"旁的"配置…"：

- **壁纸**：可以选图片、幻灯片、每日一图，建议和桌面壁纸一样或者同一色系。
- **显示媒体控制**：锁屏时可以切歌。

锁屏界面的整体样式由全局主题决定，第四章换了 Catppuccin 后它会自动跟着变。

### 2. 登录界面（Plasma Login Manager）

上一篇讲过，KDE 现在的默认登录管理器是 **Plasma Login Manager**（服务名 `plasmalogin.service`），它是 Plasma 6.6 新推出的，用来替代以前的 SDDM。

> **网上很多美化教程讲的是 SDDM 主题，对我们不适用。** Plasma Login Manager 不是 SDDM 的主题引擎，SDDM 主题装了也不会显示。它目前**不支持第三方主题**，但支持"把当前桌面的外观同步过去"，对我们来说这正好够用。

打开登录界面设置：在系统设置搜索框里搜"**登录屏幕**"（Login Screen），或者在终端运行：

```bash
kcmshell6 kcm_plasmalogin
```

可以设置的东西：

1. **背景壁纸**：选一张图片当登录界面背景。
2. **应用 Plasma 设置**（Apply Plasma Settings）：页面右上角的按钮。点它会把你当前桌面的**配色、光标、字体、键盘布局**等外观设置复制给登录界面。**每次你改了桌面主题、光标或字体之后，都记得回来点一次这个按钮**，登录界面才会跟着变。

点"应用"时会要求输入密码，因为登录界面的配置是系统级的，保存在 `/etc/plasmalogin.conf`。

改完后可以注销一次（开始菜单 → 注销）看看效果。登录界面的光标应该变成 Bibata，颜色变成 Catppuccin。

> 如果登录界面的键盘布局不对，可以运行 `sudo localectl set-x11-keymap us` 设置系统级布局（登录界面读取的是这个设置）。

### 3. 欢迎屏幕（Splash Screen）

登录后、桌面出现前，会有几秒钟的加载动画，这就是欢迎屏幕。

系统设置 → 颜色和主题 → **欢迎屏幕**（Splash Screen）：

- Catppuccin 路线：选 **Catppuccin Mocha-Mauve**（安装脚本已经装好了），加载画面是配套的深色背景加 Logo。
- 想要开机更快、更干净：选"**无**"（None），登录后直接出桌面。

## 十二、开机动画：Plymouth

现在的开机过程是：GRUB 菜单 → 一屏黑底白字的启动日志 → 登录界面。中间那屏日志就是我们要美化的地方。

**Plymouth** 是 Linux 的开机动画程序，它在系统启动的最早期接管屏幕，显示一个图形动画，把启动日志藏起来，一直持续到登录界面出现。效果就像 Windows 开机时的转圈圈。

### 1. 安装

```bash
sudo pacman -S plymouth breeze-plymouth plymouth-kcm
```

| 软件包 | 作用 |
| --- | --- |
| `plymouth` | 开机动画程序本体，自带几个基础主题 |
| `breeze-plymouth` | KDE 官方的 Breeze 开机动画主题 |
| `plymouth-kcm` | 在系统设置里图形化切换开机动画的模块 |

> 这三个包是 `plasma-meta` 的**可选依赖**，上一篇装桌面时 pacman 默认不会装可选依赖，所以要手动装。

### 2. 把 plymouth 加进启动镜像

Plymouth 要在系统启动最早期就运行，所以必须放进 initramfs（启动镜像）里。编辑 mkinitcpio 配置：

```bash
sudo vim /etc/mkinitcpio.conf
```

找到 `HOOKS=(...)` 这一行。上一篇配置 grub-btrfs 时我们已经把它改成了 `udev` 写法：

```text
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block filesystems fsck grub-btrfs-overlayfs)
```

在 `udev` 后面加上 `plymouth`，改成：

```text
HOOKS=(base udev plymouth autodetect microcode modconf kms keyboard keymap consolefont block filesystems fsck grub-btrfs-overlayfs)
```

vim 操作：输入 `/^HOOKS` 回车跳到这一行，再输入 `/udev` 回车，按 `e` 跳到单词末尾，按 `a` 进入插入模式，输入一个空格和 `plymouth`，按 `Esc`，`:wq` 保存退出。

不想用 vim 的话，也可以一条命令完成，然后检查结果：

```bash
sudo sed -i 's/^HOOKS=(base udev /HOOKS=(base udev plymouth /' /etc/mkinitcpio.conf
grep '^HOOKS' /etc/mkinitcpio.conf
```

几点说明：

- `plymouth` 必须在 `udev`（或 `systemd`）之后，这样它才能找到显卡。
- `kms` 钩子要保留，它让 Intel 核显的驱动提前加载，Plymouth 才能在高分辨率下显示。
- 最后的 `grub-btrfs-overlayfs` 不要动，它是快照启动用的。

### 3. 添加内核参数 splash

Plymouth 需要内核参数 `splash` 才会显示动画，`quiet` 则让内核少输出日志。编辑 GRUB 配置：

```bash
sudo vim /etc/default/grub
```

找到 `GRUB_CMDLINE_LINUX_DEFAULT` 这一行，Arch 默认是：

```text
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet"
```

在引号里加上 `splash`：

```text
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet splash"
```

先别急着保存退出，第十三章还要改这个文件，可以一起改。如果你打算跳过 GRUB 美化，现在就 `:wq` 保存，然后运行：

```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

### 4. 选择开机动画主题

先看看有哪些主题：

```bash
plymouth-set-default-theme -l
```

常见的几个：

| 主题 | 效果 |
| --- | --- |
| `bgrt` | **显示电脑厂商的 Logo**（比如雷神的 Logo）加转圈动画，和 Windows 开机画面几乎一样，双系统切换时最自然 |
| `breeze` | KDE 官方风格，Plasma Logo 加进度动画，和桌面最搭 |
| `spinner` | 简洁的转圈 |
| `text` / `details` | 纯文字，`details` 就是显示完整日志，排查问题时用 |

设置主题并重新生成启动镜像：

```bash
sudo plymouth-set-default-theme bgrt
sudo mkinitcpio -P
```

`mkinitcpio -P` 会给所有内核重新生成启动镜像，没有 ERROR 就成功了。

> **图形化设置**：装了 `plymouth-kcm` 之后，也可以在 **系统设置 → 颜色和主题 → 开机画面**（Boot Splash）里选主题、点应用，它会自动重新生成启动镜像（需要输入密码，要等十几秒）。

**更多主题**：AUR 里有大量 Plymouth 主题，比如 `plymouth-theme-arch-charge`（Arch Logo 充电动画）。装好后同样用 `sudo plymouth-set-default-theme 主题名` 切换，然后 `sudo mkinitcpio -P`。

重启看看效果：选完 GRUB 菜单后，应该直接出现开机动画，然后过渡到登录界面，中间不再有滚动的日志。

> 在开机动画期间按 `Esc` 可以随时切换到文字日志，再按一次切回动画。开机卡住时用这个方法看卡在哪一步。

## 十三、GRUB 主题

GRUB 菜单是开机后第一个看到的画面，双系统每次开机都要在这里选系统，值得好好美化。

### 1. 方案选择

| 方案 | 来源 | 风格 |
| --- | --- | --- |
| Catppuccin GRUB | GitHub（catppuccin/grub） | **和本文配色统一**，推荐 |
| Breeze GRUB | 官方仓库 `breeze-grub` | KDE 官方风格，最省事 |
| grub2-themes | GitHub（vinceliuice/grub2-themes） | 带系统图标的卡片式菜单，很华丽 |

三种方案任选一种。核心原理都一样：**把主题文件放到某个目录，然后在 `/etc/default/grub` 里用 `GRUB_THEME` 指向主题的 `theme.txt`**。

> 主题文件我们放在 `/usr/share/grub/themes/`。因为我们的 `/boot/grub` 和 `/usr` 都在同一个 Btrfs 根分区里，GRUB 能直接读到。生成配置时 `grub-mkconfig` 会自动处理 Btrfs 子卷的路径，不用手动写 `@`。

### 2. 方案一：Catppuccin GRUB（推荐）

```bash
cd ~
git clone --depth=1 https://github.com/catppuccin/grub.git catppuccin-grub
sudo cp -r catppuccin-grub/src/catppuccin-mocha-grub-theme /usr/share/grub/themes/
ls /usr/share/grub/themes/catppuccin-mocha-grub-theme
```

能看到 `theme.txt`、`background.png`、`font.pf2`、`icons` 等文件就对了。

### 3. 方案二：Breeze GRUB

```bash
sudo pacman -S breeze-grub
ls /usr/share/grub/themes/breeze
```

### 4. 方案三：grub2-themes

这个项目用脚本根据你的屏幕分辨率生成主题。**脚本会自动修改 `/etc/default/grub` 并重新生成配置**，先看一下脚本内容再运行：

```bash
cd ~
git clone --depth=1 https://github.com/vinceliuice/grub2-themes.git
cd grub2-themes
less install.sh
sudo ./install.sh -t tela -i color -s 1080p
```

| 参数 | 含义 | 可选值 |
| --- | --- | --- |
| `-t` | 主题样式 | `tela`、`vimix`、`stylish`、`whitesur` |
| `-i` | 图标样式 | `color`（彩色）、`white`（白色）、`whitesur` |
| `-s` | 屏幕分辨率 | `1080p`、`2k`、`4k`、`ultrawide`、`ultrawide2k` |

脚本运行完就已经设置好 `GRUB_THEME` 了，但下面第 5 步的其他几项仍然建议检查一遍。想卸载时运行 `sudo ./install.sh -r -t tela`。

### 5. 修改 GRUB 配置

```bash
sudo vim /etc/default/grub
```

修改或添加下面几行（以 Catppuccin 为例，用 Breeze 的话把路径换成 `/usr/share/grub/themes/breeze/theme.txt`）：

```text
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet splash"
GRUB_GFXMODE=1920x1080,auto
GRUB_GFXPAYLOAD_LINUX=keep
GRUB_THEME="/usr/share/grub/themes/catppuccin-mocha-grub-theme/theme.txt"
```

同时**检查**下面这一行是否被注释掉了（前面有 `#`），没注释的话加上 `#`：

```text
#GRUB_TERMINAL_OUTPUT="console"
```

每一行的作用：

| 配置项 | 作用 |
| --- | --- |
| `GRUB_CMDLINE_LINUX_DEFAULT` | 第十二章加的 `splash`，Plymouth 需要 |
| `GRUB_GFXMODE` | GRUB 菜单的分辨率。设成屏幕原生分辨率，主题才清晰；`auto` 是后备，原生分辨率不支持时自动选一个 |
| `GRUB_GFXPAYLOAD_LINUX=keep` | 启动 Linux 时保持 GRUB 的图形模式，从 GRUB 到 Plymouth 的过渡更平滑，减少黑屏闪烁 |
| `GRUB_THEME` | 主题文件路径 |
| `GRUB_TERMINAL_OUTPUT="console"` | 如果这行生效，GRUB 会用纯文字模式，**主题不会显示**，所以必须注释掉 |

上一篇设置的 `GRUB_TIMEOUT=10` 和 `GRUB_DISABLE_OS_PROBER=false` **保持不变**。

> **不要开启 `GRUB_SAVEDEFAULT`（记住上次选的系统）**：网上很多教程会推荐 `GRUB_DEFAULT=saved` 加 `GRUB_SAVEDEFAULT=true`。但这个功能需要 GRUB 在开机时往 `/boot/grub/grubenv` 文件里写数据，而 **GRUB 不支持往 Btrfs 上写文件**，我们的 `/boot` 恰好在 Btrfs 上。开了之后每次开机都会报错，需要按任意键才能继续。

保存退出，重新生成 GRUB 配置：

```bash
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

输出里应该有一行：

```text
Found theme: /usr/share/grub/themes/catppuccin-mocha-grub-theme/theme.txt
```

以及和以前一样能找到 Linux 内核、Windows Boot Manager 和快照（grub-btrfs 生成的快照子菜单）。

### 6. 重启检查

重启后 GRUB 菜单应该变成了主题样式：深色背景、圆角选中框，Arch 和 Windows 前面有对应的系统图标。选择 Arch Linux 后，直接过渡到第十二章设置的开机动画。

**GRUB 主题常见问题**：

| 现象 | 原因和解决办法 |
| --- | --- |
| 还是黑底白字的老样子 | `grub-mkconfig` 的输出里没有 `Found theme`：检查 `GRUB_THEME` 路径是否拼错，`GRUB_TERMINAL_OUTPUT="console"` 是否已注释 |
| 主题显示了，但文字很小或图片模糊 | 分辨率不对。在 GRUB 菜单按 `c` 进入命令行，输入 `videoinfo` 查看支持的分辨率，选一个写进 `GRUB_GFXMODE`，重新生成配置 |
| 主题显示了，但字体是方块 | 主题自带的字体没加载。确认主题目录里有 `.pf2` 字体文件 |
| 从 BIOS 的 KIOXIA 硬盘项启动时样式也变了吗 | 会。上一篇装了两份 GRUB（注册项和 `BOOTX64.EFI` 后备），它们读的是**同一份** `/boot/grub/grub.cfg`，主题都会生效 |

## 十四、终端：Konsole + zsh + Starship + fastfetch

终端是用 Arch 时打开最多的窗口，美化分三层：

1. **终端程序本身**（Konsole）：配色、字体、透明度。
2. **Shell**（zsh）：自动补全、命令建议、语法高亮。
3. **提示符**（Starship）：命令行前面那一串显示路径、Git 分支等信息的部分。

最后再加一个 **fastfetch**，打开终端时显示系统信息和 Arch Logo，截图必备。

### 1. 安装所需软件

```bash
sudo pacman -S --needed zsh zsh-completions zsh-autosuggestions zsh-syntax-highlighting \
  starship fastfetch eza bat fzf
```

| 软件包 | 作用 |
| --- | --- |
| `zsh` | 比默认的 bash 更强大的 Shell |
| `zsh-completions` | 额外的命令补全规则 |
| `zsh-autosuggestions` | 根据历史记录，用灰色文字提示你可能要输入的命令，按 `→` 采纳 |
| `zsh-syntax-highlighting` | 命令语法高亮：命令存在显示绿色，不存在显示红色 |
| `starship` | 跨 Shell 的提示符美化工具，速度快、配置简单 |
| `fastfetch` | 显示系统信息，neofetch 的替代品（neofetch 已经停止维护） |
| `eza` | 现代版 `ls`，带颜色、图标和 Git 状态 |
| `bat` | 现代版 `cat`，带语法高亮和行号 |
| `fzf` | 模糊搜索，`Ctrl + R` 搜历史命令非常好用 |

> 这里没有用 **Oh My Zsh**。它很流行，但加载慢、内容臃肿，而我们真正需要的几个功能（补全、建议、高亮、提示符）用上面几个独立的包就能实现，启动速度快得多。

### 2. 把默认 Shell 改成 zsh

```bash
chsh -s /usr/bin/zsh
```

输入你的用户密码。**注销并重新登录**后才会生效。重新登录后打开 Konsole，第一次运行 zsh 会出现一个配置向导（`zsh-newuser-install`），按 `q` 退出即可，我们自己写配置文件。

用 `echo $SHELL` 确认，输出 `/usr/bin/zsh` 就对了。

### 3. 编写 .zshrc

```bash
vim ~/.zshrc
```

写入以下内容：

```zsh
# ===== 历史记录 =====
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt HIST_IGNORE_ALL_DUPS   # 重复的命令只保留最新一条
setopt HIST_REDUCE_BLANKS     # 去掉命令里多余的空格
setopt SHARE_HISTORY          # 多个终端窗口共享历史记录

# ===== 基本行为 =====
setopt AUTO_CD                # 直接输入目录名就能 cd 进去
setopt INTERACTIVE_COMMENTS   # 允许在命令行里写 # 注释

# ===== 补全 =====
autoload -Uz compinit && compinit
zstyle ':completion:*' menu select                       # 用方向键在补全列表里选择
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Za-z}'   # 补全时忽略大小写
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"  # 补全列表带颜色

# ===== 按键 =====
bindkey -e                            # Emacs 风格快捷键（Ctrl+A 行首、Ctrl+E 行尾）
bindkey '^[[1;5D' backward-word       # Ctrl+← 按单词左移
bindkey '^[[1;5C' forward-word        # Ctrl+→ 按单词右移
bindkey '^[[H' beginning-of-line      # Home
bindkey '^[[F' end-of-line            # End
bindkey '^[[3~' delete-char           # Delete

# 输入一部分命令后按 ↑ / ↓，只在以这部分开头的历史命令里翻找
autoload -Uz up-line-or-beginning-search down-line-or-beginning-search
zle -N up-line-or-beginning-search
zle -N down-line-or-beginning-search
bindkey '^[[A' up-line-or-beginning-search
bindkey '^[OA' up-line-or-beginning-search
bindkey '^[[B' down-line-or-beginning-search
bindkey '^[OB' down-line-or-beginning-search

# ===== 别名 =====
alias ls='eza --icons --group-directories-first'
alias ll='eza -l --icons --git --group-directories-first'
alias la='eza -la --icons --git --group-directories-first'
alias lt='eza --tree --level=2 --icons'
alias grep='grep --color=auto'

# ===== fzf：Ctrl+R 模糊搜索历史，Ctrl+T 模糊搜索文件 =====
source <(fzf --zsh)

# ===== 插件和提示符 =====
source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
eval "$(starship init zsh)"
# 语法高亮插件必须放在最后加载
source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# ===== 打开终端时显示系统信息（不想要就删掉这一行） =====
fastfetch
```

保存后运行 `source ~/.zshrc` 或者重新打开终端。试一下：

- 输入 `ls`，文件和文件夹前面有图标（如果图标是方块，说明终端字体还没设置成 Nerd Font，看下一节）。
- 输入 `pac`，后面会出现灰色的建议文字，按 `→` 补全。
- 输入一个不存在的命令，比如 `abcxyz`，文字会变红。
- 按 `Ctrl + R`，弹出可以模糊搜索的历史命令列表。

> 关于 `bat`：Arch 里它的命令名就是 `bat`，用法和 `cat` 一样，比如 `bat ~/.zshrc` 会带语法高亮和行号显示文件。这里没有用别名覆盖 `cat`，因为有些脚本依赖 `cat` 的原始输出格式。

### 4. Starship 提示符

Starship 提供了几套预设配置，直接套用 Catppuccin 预设：

```bash
starship preset catppuccin-powerline -o ~/.config/starship.toml
```

重新打开终端，提示符就变成了一条彩色的 Powerline 风格横条，依次显示：系统图标、用户名、当前目录、Git 分支和状态、编程语言版本、时间等。

其他可选的预设：

| 预设名 | 风格 |
| --- | --- |
| `catppuccin-powerline` | Catppuccin 配色的色块横条，**和本文统一** |
| `tokyo-night` | Tokyo Night 配色的色块横条 |
| `gruvbox-rainbow` | Gruvbox 配色的彩虹横条 |
| `pastel-powerline` | 柔和的马卡龙色 |
| `nerd-font-symbols` | 保持简洁，只把各模块的符号换成 Nerd Font 图标 |
| `pure-preset` | 模仿 Pure 主题的极简风格 |

换预设就是把上面命令里的名字换掉再运行一次。

**微调配置**：用 Kate 或 vim 打开 `~/.config/starship.toml`：

- 文件开头的 `palette = 'catppuccin_mocha'` 决定用哪种风味，可以改成 `catppuccin_macchiato`、`catppuccin_frappe` 或 `catppuccin_latte`。
- 找到 `[time]` 段，`disabled = false` 是显示时间，改成 `true` 就不显示了。
- 不需要的语言模块（比如你不写 Haskell），可以找到对应段落删掉。

完整的配置项见 [Starship 官方文档](https://starship.rs/zh-CN/config/)。

### 5. fastfetch

直接运行 `fastfetch` 就能看到默认效果：左边是 Arch Logo，右边是系统、内核、桌面、CPU、显卡、内存等信息。

想自定义显示内容，先生成一份配置文件：

```bash
fastfetch --gen-config
```

会生成 `~/.config/fastfetch/config.jsonc`。我们用一份更精简、配色统一的配置替换它：

```bash
vim ~/.config/fastfetch/config.jsonc
```

```jsonc
{
  "$schema": "https://github.com/fastfetch-cli/fastfetch/raw/dev/doc/json_schema.json",
  "logo": {
    "source": "arch",
    "padding": { "top": 1, "right": 3 }
  },
  "display": {
    "separator": "  ",
    "color": { "keys": "magenta" }
  },
  "modules": [
    "title",
    "separator",
    "os",
    "kernel",
    "uptime",
    "packages",
    "shell",
    "de",
    "wm",
    "theme",
    "icons",
    "cursor",
    "font",
    "terminal",
    "cpu",
    "gpu",
    "memory",
    "disk",
    "battery",
    "break",
    "colors"
  ]
}
```

- `logo.source`：Logo 样式，`arch` 是大 Logo，`arch_small` 是小 Logo。也可以写一张图片的路径（需要终端支持图片显示，Konsole 支持）。
- `display.color.keys`：左侧项目名的颜色，`magenta`（品红）和 Catppuccin 的紫色最接近。
- `modules`：要显示哪些信息、按什么顺序。混合显卡的笔记本，`gpu` 会同时列出 Intel 核显和 RTX 4060。

> 运行 `fastfetch --list-modules` 可以看到所有可用模块，`fastfetch --list-logos` 看所有内置 Logo。

### 6. Konsole：配色、字体、透明背景

先下载 Catppuccin 的 Konsole 配色文件：

```bash
mkdir -p ~/.local/share/konsole
wget -O ~/.local/share/konsole/catppuccin-mocha.colorscheme \
  https://raw.githubusercontent.com/catppuccin/konsole/main/themes/catppuccin-mocha.colorscheme
```

然后**新建一个配置方案**（不要直接改默认的"内置"方案，它不能修改）：

1. 打开 Konsole，菜单 **设置 → 管理配置方案**（Settings → Manage Profiles），点"新建"。
2. **常规**：名称填 `Catppuccin`，勾选"默认配置方案"，命令应该是 `/usr/bin/zsh`。
3. **外观**：
   - 配色方案：选 **Catppuccin Mocha**。
   - 字体：点"选择…"，选 **JetBrainsMono Nerd Font**，大小 11 或 12。
   - 右侧"编辑…"配色方案时，可以设置**背景透明度**（建议 10%～20%），并勾选"**模糊背景**"（Blur background），配合第八章开启的模糊特效就是毛玻璃终端。
4. **光标**（在"外观"或"高级"里，不同版本位置略有不同）：形状改成"I 型光标"，勾选"闪烁"。
5. **滚动**：滚动历史改成"无限"或者 10000 行。
6. 点"确定"。

再调几处窗口细节：

- 菜单 **设置 → 配置 Konsole → 标签页**：标签栏位置改成"顶部"，"显示标签栏"改成"仅在有多个标签页时"，界面更干净。
- 菜单 **设置**：取消勾选"显示菜单栏"和"显示工具栏"（之后用 `Ctrl + Shift + M` 可以重新显示菜单栏）。
- 外观里的"边距"可以调到 8～12 像素，文字不会紧贴窗口边缘。

关掉 Konsole 重新打开，应该能看到：半透明毛玻璃背景、Catppuccin 配色、开头的 fastfetch 系统信息，以及下面彩色的 Starship 提示符。

> **为什么透明度要在配色方案里设置，而不是用窗口规则？** 窗口规则会让整个窗口（包括文字）一起变透明，文字会变淡。Konsole 自己的透明度只作用于背景，文字依然清晰。

## 十五、fcitx5 输入法皮肤

输入法候选框是每次打字都会看到的东西，默认的样式是简单的白底黑字，和深色桌面很不协调。

### 1. 安装皮肤

有几种选择：

| 皮肤 | 安装方式 | 风格 |
| --- | --- | --- |
| Catppuccin | GitHub（catppuccin/fcitx5） | **和本文统一**，推荐 |
| KDE Plasma | fcitx5 自带（需要 `fcitx5-qt`，已包含在 `fcitx5-im` 里） | 自动跟随 Plasma 当前配色，不用额外装 |
| Breeze | 官方仓库 `fcitx5-breeze` | KDE 官方风格 |
| Material Color | 官方仓库 `fcitx5-material-color` | 仿 Android 输入法 |
| Nord | 官方仓库 `fcitx5-nord` | 北欧冷色调 |

安装 Catppuccin 皮肤：

```bash
cd ~
git clone --depth=1 https://github.com/catppuccin/fcitx5.git catppuccin-fcitx5
mkdir -p ~/.local/share/fcitx5/themes
cp -r catppuccin-fcitx5/src/* ~/.local/share/fcitx5/themes/
```

喜欢**圆角**候选框的话，复制前先运行一下仓库里的脚本：

```bash
cd ~/catppuccin-fcitx5
./enable-rounded.sh
cp -r src/* ~/.local/share/fcitx5/themes/
```

想用官方仓库里的皮肤，直接 `sudo pacman -S fcitx5-breeze`（或其他包名）即可。

### 2. 应用皮肤

**图形界面方式**：

1. 右键托盘里的输入法图标 → **配置**，或者在开始菜单里打开 "Fcitx 5 配置"。
2. 切到 **附加组件**（Addons）标签页，找到 **经典用户界面**（Classic User Interface），点右边的齿轮。
3. 设置以下几项：

| 选项 | 建议 |
| --- | --- |
| 主题 | `catppuccin-mocha-mauve`（风味 + 强调色，和桌面一致） |
| 深色主题 | 同样选 `catppuccin-mocha-mauve`。如果开了深浅色自动切换，这里选 Mocha，上面的"主题"选 Latte |
| 跟随系统浅色/深色设置 | 勾选 |
| 使用系统的强调色 | 用 Catppuccin 时**不勾选**（否则会覆盖皮肤自带的颜色）；用 KDE Plasma 皮肤时勾选 |
| 字体 | `Noto Sans CJK SC 12`（候选词字体），觉得小可以调到 13～14 |
| 竖排候选列表 | 按习惯，默认横排 |

4. 点"应用"。

**配置文件方式**：所有设置保存在 `~/.config/fcitx5/conf/classicui.conf`，也可以直接编辑：

```ini
Theme=catppuccin-mocha-mauve
DarkTheme=catppuccin-mocha-mauve
UseDarkTheme=True
UseAccentColor=False
Font="Noto Sans CJK SC 12"
```

改完重启 fcitx5 生效：

```bash
fcitx5 -r -d
```

（`-r` 替换正在运行的实例，`-d` 让它在后台运行，关掉终端也不会退出。）

### 3. 皮肤不生效？检查"输入法面板"部件

KDE 有一个叫"**输入法面板**"（Input Method Panel，内部叫 kimpanel）的面板小部件。如果你的面板上加了它，候选词会由这个部件来画，**样式跟随 Plasma 主题，fcitx5 的皮肤设置完全不起作用**。

想用 fcitx5 皮肤，就把面板上的"输入法面板"部件删掉（右键 → 删除），然后 `fcitx5 -r -d` 重启输入法。

### 4. 顺便调一下拼音体验

美化之外，这几个设置能让输入法更好用。在 Fcitx 5 配置 → 输入法 → 选中"拼音"→ 点齿轮：

- **每页候选词数**：默认 5，改成 7～9。
- **启用云拼音**：生僻词组的候选更准，但会把输入内容发到云端，介意隐私的话不要开。
- **词库**：上一篇提到的 `fcitx5-pinyin-zhwiki`（archlinuxcn 源）装上后会自动加载，网络流行词、专有名词的候选会多很多。

## 十六、让 GTK、Flatpak 和浏览器也统一

KDE 程序基于 Qt，主题能完全统一。但你总会用到 GTK 程序（比如 GIMP、部分国产软件）和 Flatpak 程序，它们默认可能是另一种风格。

### 1. GTK 程序

好消息是 `plasma-meta` 已经包含了 `breeze-gtk`（Breeze 的 GTK 版本）和 `kde-gtk-config`（把 KDE 设置同步给 GTK 的工具），大部分工作是自动的：

- **配色**：Breeze GTK 主题会读取 KDE 当前的配色方案，所以 GTK 程序也会变成 Catppuccin 的颜色。
- **图标、光标、字体**：你在 KDE 里设置的 Papirus、Bibata、Noto Sans 会自动写进 GTK 的配置文件。

确认一下设置：系统设置 → 颜色和主题 → 应用程序风格，点"**配置 GNOME/GTK 应用程序风格**"（Configure GNOME/GTK Application Style），确认 GTK 主题选的是 **Breeze**。

检查同步结果：

```bash
cat ~/.config/gtk-3.0/settings.ini
```

能看到类似下面的内容就说明同步成功了：

```ini
[Settings]
gtk-cursor-theme-name=Bibata-Modern-Ice
gtk-font-name=Noto Sans,  10
gtk-icon-theme-name=Papirus-Dark
gtk-theme-name=Breeze
```

**关于 libadwaita 程序**：GNOME 官方的新程序（比如"文本编辑器"、"文件"、"磁盘"）用的是 libadwaita，它**刻意不支持第三方主题**，永远是 GNOME 自己的样式。但它会跟随系统的**深色模式**（以及新版本里的强调色），所以在深色桌面上它也是深色的，不会太突兀。

> 网上有教程用 `GTK_THEME` 环境变量强制给 libadwaita 程序换主题，**不推荐**：容易导致程序界面错乱，而且 GNOME 程序更新后经常失效。

### 2. Flatpak 程序

Flatpak 程序运行在沙盒里，读不到系统的主题文件，需要额外处理。

先确认装了 Flatpak（KDE 的"发现"软件中心依赖它，通常已经有了）：

```bash
sudo pacman -S --needed flatpak
flatpak remotes
```

能看到 `flathub` 就说明 Flathub 仓库已经配置好了。

**GTK 程序的主题**：安装 Breeze 的 Flatpak 版 GTK 主题：

```bash
flatpak install flathub org.gtk.Gtk3theme.Breeze
```

再允许 Flatpak 程序读取你的 GTK 配置（只读）：

```bash
flatpak override --user --filesystem=xdg-config/gtk-3.0:ro --filesystem=xdg-config/gtk-4.0:ro
```

**光标**：Flatpak 会把系统的 `/usr/share/icons` 目录以只读方式放在沙盒里的 `/run/host/share/icons`，把用户目录的 `~/.local/share/icons` 放在 `/run/host/user-share/icons`。告诉沙盒里的程序去这两个地方找光标：

```bash
flatpak override --user --env=XCURSOR_PATH=/run/host/user-share/icons:/run/host/share/icons
flatpak override --user --env=XCURSOR_THEME=Bibata-Modern-Ice
```

查看当前的全部覆盖设置：

```bash
flatpak override --user --show
```

想撤销所有覆盖设置：`flatpak override --user --reset`。

> 在 Plasma 6 的 Wayland 会话下，新一些的 Qt 6 和 GTK 4 程序会直接使用桌面提供的光标，本来就是一致的；上面的设置主要是给老一些的 GTK 3 程序用的。另外，**KDE 的 Flatpak 程序**（用 KDE 运行时的程序）默认就是 Breeze 风格，会自动读取 KDE 的配色，一般不需要额外设置。

### 3. 浏览器

**Firefox**：

1. 打开 设置 → 常规 → 网站外观，选"自动"，网页会跟随系统的深浅色。
2. 打开 附加组件和主题（`Ctrl + Shift + A`）→ 主题，默认的"系统主题 — 自动"会跟随 GTK 主题的颜色。想和 Catppuccin 完全统一，可以在 Firefox 附加组件网站搜索 `Catppuccin Mocha` 安装官方主题。
3. 标题栏：右键工具栏 → 定制工具栏，左下角取消勾选"标题栏"，Firefox 会用自己的标签栏代替系统标题栏，更紧凑。

**Chrome / Chromium / Edge**：

1. 打开 设置 → 外观 → 模式，选"**GTK**"或"**Qt**"，浏览器的框架颜色会跟随系统主题。
2. 想要 Catppuccin 配色，在 Chrome 应用商店搜索 `Catppuccin Chrome Theme`。

**网页本身**：Firefox 和 Chrome 都有 Dark Reader 扩展，可以强制把不支持深色模式的网站变成深色，配色也可以自定义成 Catppuccin 的背景色 `#1e1e2e`。

## 十七、备份和迁移你的美化配置

辛辛苦苦调好的系统，一定要备份。重装系统或换电脑时，把这些文件放回去就能还原。

### 1. 需要备份的文件

| 文件或目录 | 内容 |
| --- | --- |
| `~/.config/kdeglobals` | 配色、字体、图标、全局主题设置 |
| `~/.config/kwinrc` | 窗口装饰、桌面特效、虚拟桌面 |
| `~/.config/plasma-org.kde.plasma.desktop-appletsrc` | 面板布局、小部件、壁纸 |
| `~/.config/plasmashellrc` `~/.config/plasmarc` | 面板尺寸、Plasma 主题 |
| `~/.config/kcminputrc` | 光标主题和大小 |
| `~/.config/kscreenlockerrc` `~/.config/ksplashrc` | 锁屏、欢迎屏幕 |
| `~/.config/krunnerrc` | KRunner 设置 |
| `~/.config/konsolerc` `~/.local/share/konsole/` | Konsole 设置、配置方案、配色 |
| `~/.local/share/plasma/` | 安装的 Plasma 主题、全局主题、小部件 |
| `~/.local/share/color-schemes/` `~/.local/share/aurorae/` | 配色方案、窗口装饰主题 |
| `~/.config/fontconfig/` | 字体优先级配置 |
| `~/.config/fcitx5/` `~/.local/share/fcitx5/themes/` | 输入法设置和皮肤 |
| `~/.zshrc` `~/.config/starship.toml` `~/.config/fastfetch/` | 终端配置 |
| `~/.config/gtk-3.0/` `~/.config/gtk-4.0/` | GTK 设置 |

系统级的设置（`/etc/default/grub`、`/etc/mkinitcpio.conf`、`/usr/share/grub/themes/` 里的主题、`/etc/plasmalogin.conf`）不在家目录里，可以单独记下来，或者重装后按本文第十一到十三章重做一遍，几分钟就好。

### 2. 一条命令打包

```bash
cd ~
tar czf ~/backup/rice-$(date +%Y%m%d).tar.gz \
  .config/kdeglobals .config/kwinrc .config/plasma-org.kde.plasma.desktop-appletsrc \
  .config/plasmashellrc .config/plasmarc .config/kcminputrc .config/kscreenlockerrc \
  .config/ksplashrc .config/krunnerrc .config/konsolerc .config/fontconfig \
  .config/fcitx5 .config/starship.toml .config/fastfetch .config/gtk-3.0 .config/gtk-4.0 \
  .local/share/konsole .local/share/plasma .local/share/color-schemes \
  .local/share/aurorae .local/share/fcitx5/themes .zshrc 2>/dev/null
ls -lh ~/backup
```

> "rice"（米饭）是 Linux 社区对"系统美化"的俗称，美化后的截图分享叫 "ricing"。

把压缩包拷到 F 盘（`/mnt/F`）或网盘。恢复时在新系统里先装好本文用到的软件包，然后注销，在命令行界面（`Ctrl + Alt + F3`）登录，运行 `tar xzf rice-日期.tar.gz -C ~`，再 `sudo systemctl restart plasmalogin` 回到图形界面。

> 进阶做法是用 Git 管理这些配置文件（俗称 dotfiles），推荐工具有 `chezmoi`、`stow`（官方仓库都有），可以记录每次修改的历史、在多台电脑间同步。

## 十八、常见问题

### 1. 系统更新后桌面崩溃、黑屏或者没有标题栏

大概率是**第三方 KWin 特效、窗口装饰插件或者 Plasma 小部件**和新版 Plasma 不兼容。

1. 按 `Ctrl + Alt + F3` 进入命令行界面，用你的用户名登录。
2. 卸载最近装的第三方插件：`paru -Rns 包名`。
3. 如果不确定是哪个，先把桌面配置挪开，让 KDE 用默认配置启动：

```bash
mv ~/.config/kwinrc ~/.config/kwinrc.bak
mv ~/.config/plasma-org.kde.plasma.desktop-appletsrc ~/.config/plasma-org.kde.plasma.desktop-appletsrc.bak
sudo systemctl restart plasmalogin
```

4. 如果是系统级的问题（比如改坏了 GRUB 或 mkinitcpio），按上一篇第十章用快照回滚。

### 2. 中文显示成日文字形

检查第三章的 fontconfig 配置：运行 `fc-match "sans-serif:lang=zh-cn"`，输出必须是 `Noto Sans CJK SC`。如果某个程序（比如某些 Electron 应用）仍然显示日文字形，通常是它自己指定了字体，到这个程序的设置里把字体改成 `Noto Sans CJK SC`。

### 3. 终端里的图标显示成方块或问号

终端字体没设置成 Nerd Font。按第十四章第 6 节，把 Konsole 配置方案的字体改成 `JetBrainsMono Nerd Font`。注意 VS Code 等编辑器的内置终端也要单独设置字体（VS Code 里是 `terminal.integrated.fontFamily`）。

### 4. Plymouth 开机动画不显示，还是滚动日志

依次检查：

1. `grep '^HOOKS' /etc/mkinitcpio.conf` 里有没有 `plymouth`，位置是否在 `udev` 之后。
2. `cat /proc/cmdline` 里有没有 `splash`。没有的话检查 `/etc/default/grub` 并重新运行 `sudo grub-mkconfig -o /boot/grub/grub.cfg`。
3. 改完 HOOKS 后是否运行了 `sudo mkinitcpio -P`。
4. 如果你在 BIOS 里把显卡模式切成了"独显直连"（只用 NVIDIA），Plymouth 可能要等 NVIDIA 驱动加载才能显示，动画会出来得很晚或者干脆不显示。解决办法是让 NVIDIA 驱动提前加载：在 `/etc/mkinitcpio.conf` 的 `MODULES=()` 里加上 `nvidia nvidia_modeset nvidia_uvm nvidia_drm`，然后 `sudo mkinitcpio -P`。混合模式（默认）下用的是 Intel 核显，不需要这一步。

### 5. 登录界面还是旧的样子

Plasma Login Manager 不会自动跟随桌面主题，需要到"登录屏幕"设置页（`kcmshell6 kcm_plasmalogin`）点右上角的"**应用 Plasma 设置**"。另外再提醒一次：SDDM 主题对它无效。

### 6. fcitx5 皮肤设置了没变化

1. 检查面板上有没有"输入法面板"部件，有的话删掉（见第十五章第 3 节）。
2. 确认主题名拼写正确：`ls ~/.local/share/fcitx5/themes/` 能看到 `catppuccin-mocha-mauve` 文件夹。
3. 运行 `fcitx5 -r -d` 重启输入法。

### 7. 某些程序里的光标样式或大小不一样

- 先确认在系统设置里选好光标后点了"应用"，并注销重新登录过一次。
- GTK 程序：检查 `~/.config/gtk-3.0/settings.ini` 里的 `gtk-cursor-theme-name`。
- Flatpak 程序：按第十六章第 2 节设置 `XCURSOR_PATH` 和 `XCURSOR_THEME`。
- 登录界面：点"应用 Plasma 设置"。

### 8. 毛玻璃效果没有出现

1. 确认第八章的"模糊"特效已开启。
2. 毛玻璃只在**半透明的区域**才看得到：面板不透明度要选"半透明"或"自适应"，Konsole 要设置背景透明度并勾选"模糊背景"。
3. 模糊特效需要显卡合成支持，在虚拟机里可能无法使用。

## 结语

到这里，从按下电源键开始：

1. **GRUB 菜单**是 Catppuccin 主题，Arch 和 Windows 一目了然；
2. 选择 Arch 后是**平滑的开机动画**，看不到一行日志；
3. **登录界面**、**欢迎屏幕**、**锁屏**和桌面同一配色；
4. **桌面**有顶栏和浮动 Dock，毛玻璃、窗口动画、统一的图标和光标；
5. 打开**终端**是半透明的 Catppuccin 配色，带系统信息和彩色提示符；
6. 打字时**输入法候选框**也是同一套颜色；
7. 就连 **GTK 程序**、**Flatpak 程序**和**浏览器**也融入了这套风格。

美化没有标准答案，本文给的是一套"稳、统一、不容易被更新弄坏"的方案。在这个基础上，你可以换壁纸、换强调色、换图标，慢慢调成自己最喜欢的样子。最后记得：**改之前拍快照，改完之后备份配置**。

## 参考资料

- [KDE Plasma 6.8 发布公告](https://kde.org/announcements/plasma/6/6.8.0/)
- [ArchWiki：KDE](https://wiki.archlinux.org/title/KDE)
- [ArchWiki：Plymouth](https://wiki.archlinux.org/title/Plymouth)
- [ArchWiki：GRUB/Tips and tricks](https://wiki.archlinux.org/title/GRUB/Tips_and_tricks)
- [ArchWiki：Font configuration](https://wiki.archlinux.org/title/Font_configuration)
- [ArchWiki：Fcitx5](https://wiki.archlinux.org/title/Fcitx5)
- [ArchWiki：Uniform look for Qt and GTK applications](https://wiki.archlinux.org/title/Uniform_look_for_Qt_and_GTK_applications)
- [Catppuccin 官网](https://catppuccin.com/)，以及各组件仓库：[KDE](https://github.com/catppuccin/kde)、[Konsole](https://github.com/catppuccin/konsole)、[fcitx5](https://github.com/catppuccin/fcitx5)、[GRUB](https://github.com/catppuccin/grub)
- [vinceliuice/grub2-themes](https://github.com/vinceliuice/grub2-themes)
- [Starship 文档](https://starship.rs/zh-CN/)
- [fastfetch](https://github.com/fastfetch-cli/fastfetch)
- [Flatpak 文档：沙盒权限](https://docs.flatpak.org/en/latest/sandbox-permissions.html)
