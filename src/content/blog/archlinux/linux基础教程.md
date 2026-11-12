---
title: Linux 命令行基础保姆级教程：装好 Arch 之后，从打开终端到写出第一个脚本
description: 双系统和美化教程的配套篇。以装好的 Arch Linux + KDE Plasma 为实操环境，从终端和 Shell 讲起，覆盖目录结构、文件操作、vim 入门、用户与权限、pacman 软件包、进程与 systemd 服务、管道与重定向、查找、环境变量、压缩打包、磁盘、网络与 SSH，最后写出自己的第一个 Shell 脚本。
pubDate: 2026-11-11
chapter: 3
tags: [Linux, ArchLinux, 命令行, 入门]
---

> 本文是[《没有 U 盘也能装：Arch Linux + Windows 11 双系统保姆级教程》](/series/archlinux/archlinux双系统安装/)和[《Arch Linux 美化保姆级教程》](/series/archlinux/archlinux美化/)的配套篇。实操环境默认和前两篇装完时一样：**Arch Linux + KDE Plasma + Konsole 终端 + zsh（带美化篇里的 `.zshrc`）+ Btrfs 快照（snapper）+ paru**。没看过前两篇也没关系，绝大部分内容适用于任何 Linux 发行版，Arch 专属的地方会单独标出来。

装 Arch 的时候，我们照着教程敲了几百条命令；美化的时候，又改了一堆配置文件。但很多时候其实是"照着抄"，并不知道每条命令到底在干什么：`-Syu` 是什么意思？`sudo` 什么时候该加？`chmod +x` 改了什么？出了问题去哪看日志？

这篇文章的目标是：**把这些"照着抄"的东西系统地补上，让你装好系统之后能独立用命令行干活**——看得懂网上的教程，知道一条命令会造成什么后果，出了问题知道去哪里找原因。

## 零、开始之前

### 1. 为什么要学命令行

KDE 的图形界面已经很完善了，日常上网、看视频、写文档完全不需要碰终端。但在 Linux 上，有些事情用命令行做明显更好：

- **更快**：装一个软件，图形界面要打开商店、搜索、点击安装；命令行一行 `sudo pacman -S 软件名` 就完事。
- **可复制**：网上的教程、ArchWiki、论坛里的答案，几乎都是以命令的形式给出的。命令能直接复制粘贴，而"打开设置 → 找到某某 → 勾选某某"这种描述，换个版本菜单就变了。
- **能排错**：系统出了问题，图形界面往往只告诉你"失败了"，而日志和报错信息都在命令行里。
- **能自动化**：重复做的事情写成脚本，以后一条命令搞定。

### 2. 本文的约定

- 代码块里的内容是**要在终端里输入的命令**，一行一条，输完按回车执行。
- 以 `#` 开头的是注释，用来解释命令，**不用输入**（输了也没关系，Shell 会忽略它）。
- 命令中的 `yourname` 代表你的用户名，`arch-911x` 是双系统篇里设置的主机名，换成你自己的即可。
- 显示命令输出时，会用"输出类似这样"之类的说明和命令本身区分开。
- 美化篇里我们把 `ls` 设置成了 `eza` 的别名，所以你看到的 `ls` 输出带颜色和图标，和本文展示的原版 `ls` 输出格式略有不同。想看原版输出时，用 `command ls`（后面会解释为什么）。

### 3. 学习路线

| 章节 | 内容 | 学完能做什么 |
| --- | --- | --- |
| 一、二 | 终端、Shell、命令格式、获取帮助 | 看懂任何一条命令的结构，不会用的命令知道去哪查 |
| 三～五 | 目录结构、文件操作、查看和编辑文件 | 在命令行里管理文件，用 vim 改配置 |
| 六 | 用户与权限 | 看懂 `Permission denied`，知道什么时候该用 `sudo` |
| 七 | pacman 软件包管理 | 正确地安装、卸载、更新软件 |
| 八、九 | 进程、systemd 服务、日志 | 结束卡死的程序，管理开机自启，出问题会看日志 |
| 十、十一 | 重定向、管道、查找 | 组合命令处理文本，找文件、找内容 |
| 十二、十三 | 环境变量、Shell 配置、压缩打包 | 理解 PATH，配置别名，处理压缩包 |
| 十四、十五 | 磁盘、网络、SSH | 查空间占用，远程登录服务器，传文件 |
| 十六 | Shell 脚本 | 把重复操作写成脚本 |
| 十七、十八 | 常见坑、速查表 | 避开新手最容易踩的坑 |

**最好的学法是边看边敲。** 打开 Konsole，每看到一条命令就自己输一遍（尽量手打，不要复制），看看输出是什么。本文的所有操作都只在你的家目录里进行，或者在执行前明确提醒，不会弄坏系统。

为了方便练习，先建一个专门的练习目录：

```bash
mkdir ~/practice
cd ~/practice
```

后面的大部分例子都在这个目录里做，练完整个删掉即可。

## 一、终端与 Shell

### 1. 终端、Shell、命令，分别是什么

刚接触时最容易混淆的三个概念：

| 概念 | 是什么 | 本文的环境 |
| --- | --- | --- |
| **终端（Terminal）** | 一个窗口程序，负责显示文字、接收键盘输入 | Konsole |
| **Shell** | 运行在终端里的"命令解释器"，读懂你输入的命令，然后去执行 | zsh（Arch 默认是 bash） |
| **命令** | Shell 去执行的具体程序，比如 `ls`、`pacman` | 各种程序 |

打个比方：终端是**电话机**，Shell 是电话那头的**接线员**，命令是接线员帮你**转接的部门**。你对着电话说"帮我查一下余额"（输入命令），接线员听懂后转给财务部（执行 `ls` 程序），财务部把结果通过电话告诉你（输出显示在终端上）。

所以"换终端"（Konsole 换成别的）和"换 Shell"（bash 换成 zsh）是两回事。美化篇里我们做的就是：终端用 Konsole，Shell 从 bash 换成了 zsh。

> bash 和 zsh 的基础语法几乎完全一样，本文的命令在两者中都能用。少数不同的地方会单独说明。

### 2. 提示符

打开 Konsole，你会看到类似这样的一行（美化篇里用 Starship 美化过，样子会更花哨）：

```text
yourname@arch-911x ~ $
```

这叫**提示符（prompt）**，意思是"我准备好了，请输入命令"。传统格式里：

- `yourname`：当前登录的用户名
- `arch-911x`：主机名
- `~`：当前所在的目录，`~` 代表你的家目录 `/home/yourname`
- `$`：普通用户的提示符；如果是 `#`，说明当前是 **root 超级用户**，要格外小心

网上的教程常常写成 `$ ls -l` 这样，开头的 `$` 是提示符，表示"这是一条普通用户执行的命令"，**复制时不要把 `$` 带上**。同理，`# pacman -Syu` 开头的 `#` 表示要用 root 权限执行（在本文的代码块里，`#` 开头则是注释，注意区分上下文）。

### 3. 命令的格式

几乎所有命令都遵循同一个格式：

```text
命令  [选项]  [参数]
```

举个例子：

```bash
ls -l -a /etc
```

- `ls`：**命令**，列出目录内容
- `-l`、`-a`：**选项**，调整命令的行为。`-l` 表示显示详细信息，`-a` 表示显示隐藏文件
- `/etc`：**参数**，命令操作的对象，这里是要列出的目录

关于选项，有几个通用的规律，记住后看任何命令都轻松很多：

1. **短选项**是一个横杠加一个字母，比如 `-l`、`-a`。多个短选项可以合并：`ls -l -a` 等于 `ls -la`。
2. **长选项**是两个横杠加一个单词，比如 `--all`、`--help`，更好读，不能合并。很多短选项都有对应的长选项：`-a` 就是 `--all`。
3. 有的选项后面要跟一个值：`tail -n 20 文件`，表示显示最后 20 行。
4. 命令、选项、参数之间**用空格隔开**，Linux 里**大小写敏感**：`ls -l` 和 `ls -L` 是两个不同的选项，`Documents` 和 `documents` 是两个不同的目录。

现在你就能看懂双系统篇里那条 `pacman -Syu` 了：`-S`、`-y`、`-u` 三个短选项合并在一起，具体含义第七章再讲。

### 4. 必须掌握的快捷键

这几个快捷键能让你在终端里的效率翻好几倍：

| 快捷键 | 作用 |
| --- | --- |
| `Tab` | **自动补全**命令、文件名、目录名。按一次补全，有多个候选时再按一次列出来 |
| `↑` / `↓` | 翻看之前输入过的命令 |
| `Ctrl + C` | **中断**当前正在运行的命令（命令卡住、输出刷屏时用） |
| `Ctrl + D` | 输入结束；在空命令行按下会退出当前 Shell（关闭终端） |
| `Ctrl + L` | 清屏，等于输入 `clear` |
| `Ctrl + A` / `Ctrl + E` | 光标跳到行首 / 行尾 |
| `Ctrl + U` | 删除光标前的所有内容（输错一长串时很好用） |
| `Ctrl + W` | 删除光标前的一个单词 |
| `Ctrl + R` | 搜索历史命令（美化篇装了 fzf，会弹出模糊搜索列表） |
| `Ctrl + Shift + C` / `Ctrl + Shift + V` | 在 Konsole 里**复制 / 粘贴** |

特别注意最后一行：**终端里的 `Ctrl + C` 不是复制，而是中断命令**。这是从 Windows 过来最容易犯的错误。复制粘贴要加 `Shift`，或者用鼠标选中文字后按鼠标中键粘贴。

**`Tab` 补全一定要养成习惯。** 它不只是省打字，还能防止输错：如果按 `Tab` 补不出来，说明你输入的路径或命令根本不存在。

### 5. 历史命令

```bash
history          # 列出历史命令，每条前面有编号
history | tail   # 只看最近 10 条（| 是管道，第十章讲）
```

几个方便的写法（bash 和 zsh 都支持）：

```bash
!!               # 重新执行上一条命令
sudo !!          # 用 sudo 重新执行上一条命令（忘了加 sudo 时特别好用）
!123             # 执行编号为 123 的历史命令
```

> zsh 里输入 `!!` 后按回车，它会先把展开后的命令显示出来让你确认，再按一次回车才执行，这样更安全。

## 二、遇到不会的命令，去哪里查

**没有人能记住所有命令的所有选项**，会查才是关键。按推荐顺序：

### 1. `--help`：最快

绝大多数命令都支持 `--help`，输出一份简短的用法说明：

```bash
ls --help
```

输出很长的话，配合 `less` 翻页看：

```bash
ls --help | less
```

在 `less` 里用 `↑` `↓` 或 `空格` 翻页，按 `/` 输入关键词搜索，按 `q` 退出。

### 2. `man`：最完整

`man` 是 manual（手册）的缩写，每个命令都有一份详细的手册页。Arch 默认可能没装，先装上：

```bash
sudo pacman -S --needed man-db man-pages
```

然后：

```bash
man ls
man pacman
```

`man` 的操作和 `less` 完全一样：方向键翻页、`/` 搜索、`n` 跳到下一个搜索结果、`q` 退出。手册页通常分成这几部分：

- **NAME**：命令名和一句话说明
- **SYNOPSIS**：用法格式。方括号 `[ ]` 里的是可选的，`...` 表示可以有多个
- **DESCRIPTION**：详细说明
- **OPTIONS**：所有选项的解释
- **EXAMPLES**：示例（不是每个手册页都有）

### 3. `tldr`：最实用

`man` 太长、全是英文，看着累。`tldr`（Too Long; Didn't Read）只列出**最常用的几个例子**，非常适合新手：

```bash
sudo pacman -S tealdeer   # tealdeer 是 tldr 的一个快速实现，命令名就叫 tldr
tldr --update             # 第一次使用前下载示例库
tldr tar
```

输出类似这样，一眼就知道怎么用：

```text
  Create an archive and write it to a file:
      tar cf path/to/target.tar path/to/file1 path/to/file2 ...

  Extract a (compressed) archive file into the current directory verbosely:
      tar xvf path/to/source.tar[.gz|.bz2|.xz]
  ...
```

### 4. ArchWiki：最权威

[ArchWiki](https://wiki.archlinux.org/) 是公认质量最高的 Linux 文档，不只是 Arch 用户，其他发行版的用户也经常查。遇到问题，在搜索引擎里搜"ArchWiki + 关键词"，比直接搜中文答案靠谱得多。很多页面有[中文版](https://wiki.archlinuxcn.org/)，但更新可能比英文版慢。

### 5. 网上的命令，先看懂再执行

搜到别人给的命令时，**特别是带 `sudo` 的命令，执行前先弄清楚它在干什么**。看不懂就用 `tldr` 或 `man` 查一下每个部分，或者干脆把命令丢给 AI 问一句"这条命令会做什么"。第十七章会专门讲几类绝对不要乱执行的命令。

## 三、Linux 的目录结构

### 1. 一切从根目录 `/` 开始

Windows 有 C 盘、D 盘、F 盘，每个盘是一棵独立的目录树。**Linux 没有盘符，只有一棵树**，树根是 `/`（叫"根目录"），所有文件、所有硬盘分区、甚至 U 盘，都挂在这棵树的某个位置上。

比如双系统篇里，我们把 Btrfs 的几个子卷分别挂载到了 `/`、`/home`、`/var/log` 等位置，把 EFI 分区挂到了 `/boot`。从使用者的角度看，它们都只是这棵树上的普通目录。

> Linux 用 `/` 分隔路径，Windows 用 `\`。Linux 的路径写作 `/home/yourname/Documents`。

### 2. 常见目录的用途

```bash
ls /
```

你会看到一堆目录，不用全部记住，知道下面这些就够用了：

| 目录 | 用途 | 你会在什么时候碰到它 |
| --- | --- | --- |
| `/home/yourname` | **你的家目录**，存放你的所有个人文件和配置，相当于 Windows 的 `C:\Users\你的名字` | 天天用，简写为 `~` |
| `/root` | root 用户的家目录 | 很少用 |
| `/etc` | **系统配置文件**，全是文本文件 | 改 GRUB、pacman、fstab 配置时 |
| `/usr` | 系统安装的程序和库，`/usr/bin` 里是绝大多数命令 | 一般不用手动改 |
| `/bin`、`/sbin`、`/lib` | 在 Arch 上都是指向 `/usr` 下对应目录的链接，历史遗留 | 不用管 |
| `/var` | 经常变化的数据：日志（`/var/log`）、pacman 缓存（`/var/cache/pacman`） | 清理空间、看日志时 |
| `/tmp` | 临时文件，**重启后清空** | 放临时东西 |
| `/boot` | 内核和引导文件，双系统篇里挂载了 EFI 分区 | 改引导时 |
| `/dev` | 设备文件，硬盘是 `/dev/nvme0n1` 这样的文件 | 分区、挂载时 |
| `/mnt`、`/run/media/yourname` | 挂载点，U 盘插上后一般自动挂在 `/run/media/yourname/` 下 | 访问 U 盘、Windows 分区时 |
| `/proc`、`/sys` | 内核提供的虚拟文件，反映系统运行状态 | 查硬件信息时 |
| `/opt` | 一些第三方大软件装在这里 | 偶尔 |

这里引出了 Linux 的一个核心思想：**一切皆文件**。硬盘是文件（`/dev/nvme0n1`），CPU 信息是文件（`/proc/cpuinfo`），系统配置是文本文件（`/etc/...`）。所以学会了操作文件，就学会了操作大半个系统。试试：

```bash
cat /proc/cpuinfo | head -20   # 查看 CPU 信息的前 20 行
cat /etc/hostname              # 查看主机名
```

**普通用户日常只需要操作自己的家目录**，`/home/yourname` 之外的地方基本都属于系统，要用 `sudo` 才能修改（第六章讲）。这也是一层保护：不加 `sudo`，你几乎不可能误删系统文件。

### 3. 路径：绝对路径和相对路径

- **绝对路径**：从根目录 `/` 开始写的完整路径，比如 `/home/yourname/practice`。不管你当前在哪，它指的都是同一个位置。
- **相对路径**：从**当前所在目录**出发的路径，不以 `/` 开头。比如你当前在 `/home/yourname`，那么 `practice` 就指 `/home/yourname/practice`。

几个特殊符号：

| 符号 | 含义 |
| --- | --- |
| `~` | 你的家目录 `/home/yourname` |
| `.` | 当前目录 |
| `..` | 上一级目录 |
| `-` | 上一次所在的目录（只用于 `cd -`） |

### 4. 在目录之间移动：`pwd`、`cd`、`ls`

```bash
pwd                   # Print Working Directory，显示当前在哪个目录
cd /etc               # 进入 /etc（绝对路径）
cd ..                 # 回到上一级，也就是 /
cd                    # 不带参数：回到家目录，等于 cd ~
cd practice           # 进入家目录下的 practice（相对路径）
cd -                  # 回到上一次所在的目录
```

> 美化篇的 `.zshrc` 开启了 `AUTO_CD`，直接输入目录名（比如 `..` 或 `/etc`）就能进去，省掉 `cd`。但在脚本和 bash 里不行，所以还是要会用 `cd`。

`ls` 列出目录内容，最常用的几种写法：

```bash
ls                    # 列出当前目录
ls /etc               # 列出指定目录
ls -l                 # 详细信息：权限、所有者、大小、修改时间
ls -a                 # 包括隐藏文件
ls -lh                # 详细信息，大小用 K、M、G 显示，更好读
ls -lt                # 按修改时间排序，最新的在前
```

美化篇里我们定义了几个别名：`ll` 等于 `ls -l`，`la` 等于 `ls -la`，`lt` 以树形显示目录结构，平时直接用它们就行。

### 5. 隐藏文件

**Linux 里以 `.` 开头的文件和目录就是隐藏文件**，没有 Windows 那样的"隐藏属性"。普通 `ls` 看不到它们，要加 `-a`：

```bash
cd ~
ls -a
```

你会看到 `.zshrc`、`.config`、`.local` 这类东西。**程序的配置几乎都放在家目录的隐藏文件里**：

- `~/.config/`：大部分程序的配置目录，美化篇里改的 KDE 配置都在这
- `~/.local/share/`：程序数据，比如下载的主题、图标
- `~/.cache/`：缓存，可以放心删，程序会重新生成
- `~/.zshrc`：zsh 的配置文件

在 KDE 的文件管理器 Dolphin 里，按 `Ctrl + H` 可以显示 / 隐藏这些文件。

## 四、文件和目录操作

回到练习目录：

```bash
cd ~/practice
```

### 1. 创建：`mkdir`、`touch`

```bash
mkdir notes                    # 创建目录
mkdir -p projects/blog/images  # -p：一次创建多层目录，中间的目录不存在就自动创建
touch hello.txt                # 创建一个空文件（如果文件已存在，只更新它的修改时间）
command ls -R                  # -R：递归列出所有子目录的内容
```

`mkdir -p` 非常常用：不加 `-p` 时，如果 `projects` 还不存在，`mkdir projects/blog/images` 会报错；加了 `-p`，目录已存在也不会报错。

### 2. 复制：`cp`

```bash
cp hello.txt hello-copy.txt    # 复制文件并起个新名字
cp hello.txt notes/            # 复制到 notes 目录里，保持原名
cp -r projects projects-bak    # 复制目录必须加 -r（recursive，递归）
cp -i hello.txt notes/         # -i：目标已存在时先询问，防止覆盖
```

**`cp` 默认会直接覆盖同名文件，不会提示。** 复制重要文件时加上 `-i`，养成好习惯。

### 3. 移动和重命名：`mv`

Linux 没有单独的"重命名"命令，**重命名就是把文件"移动"成一个新名字**：

```bash
mv hello-copy.txt hi.txt       # 重命名
mv hi.txt notes/               # 移动到 notes 目录
mv projects-bak ~/             # 把目录移动到家目录（mv 移动目录不需要 -r）
mv -i hello.txt notes/         # 同样，-i 防止覆盖
```

### 4. 删除：`rm`（请认真看这一节）

```bash
rm notes/hi.txt                # 删除文件
rm -r ~/projects-bak           # 删除目录及其中所有内容
rmdir 空目录                    # 只能删除空目录，目录不为空会报错，比较安全
rm -i 文件                     # 删除前逐个询问
```

**重点：`rm` 删除的文件不进回收站，直接没了，基本无法恢复。** 这和在 Dolphin 里按 `Delete` 完全不同。

网上经常能看到 `rm -rf`：`-r` 递归删除目录，`-f`（force）强制删除、不提示、不报错。它本身没问题，但配合上写错的路径就是灾难：

```text
rm -rf ~/practice/old     想删的：练习目录里的 old
rm -rf ~/practice /old    多打了一个空格：删掉整个 practice，再尝试删 /old
rm -rf ~ /practice/old    空格打错位置：直接删掉整个家目录！
```

（上面三行是反面教材，**不要执行**。）几条保命建议：

1. 用 `rm` 之前，先用 `ls` 看一眼同样的路径，确认要删的就是这些东西。
2. 能不加 `-f` 就不加，**永远不要在 `sudo` 后面随手加 `rm -rf`**。
3. 删除不确定的东西时，用回收站代替 `rm`。KDE 自带的命令可以把文件移进 Dolphin 的回收站：

```bash
kioclient move 要删的文件 trash:/
```

或者装 `trash-cli`，命令更短：

```bash
sudo pacman -S trash-cli
trash-put 要删的文件      # 移到回收站
trash-list               # 查看回收站
trash-restore            # 恢复
```

> 双系统篇配置的 snapper 快照只覆盖根目录 `/`，**不包括 `/home`**。所以家目录里误删的文件，快照救不回来。重要的个人文件请另外备份。

### 5. 通配符：一次操作一批文件

先造一些练习文件：

```bash
cd ~/practice
touch a.txt b.txt c.log photo1.jpg photo2.jpg photo10.jpg
```

| 通配符 | 含义 | 例子 |
| --- | --- | --- |
| `*` | 任意个任意字符（包括零个） | `*.jpg` 匹配所有 jpg 文件 |
| `?` | 恰好一个任意字符 | `photo?.jpg` 匹配 photo1、photo2，不匹配 photo10 |
| `[abc]` | 方括号里的任意一个字符 | `[ab].txt` 匹配 a.txt、b.txt |
| `{x,y}` | 展开成多个词（严格说这不是通配符，而是"大括号展开"） | `touch {1..5}.md` 创建 1.md 到 5.md |

```bash
ls *.jpg
ls photo?.jpg
mkdir backup && cp *.txt backup/   # && 的意思是：前一条成功了才执行后一条
touch day{1..7}.md                 # 一次创建 7 个文件
```

**通配符配合 `rm` 时尤其要小心**。`rm *` 会删掉当前目录下的所有文件，执行前务必 `pwd` 确认自己在哪。一个好习惯是先用 `ls` 代替 `rm` 试一遍：`ls *.log` 看看会匹配到什么，确认无误后再把 `ls` 换成 `rm`。

### 6. 文件名里的空格和特殊字符

Shell 用空格分隔参数，所以文件名里有空格时，必须用引号括起来，或者在空格前加反斜杠 `\`：

```bash
touch "my file.txt"       # 用引号
ls my\ file.txt           # 用反斜杠转义
```

如果写成 `rm my file.txt`，Shell 会以为你要删除名为 `my` 和 `file.txt` 的**两个**文件。按 `Tab` 补全时，Shell 会自动帮你加上转义，这是用 `Tab` 的又一个好处。

单引号和双引号的区别：

```bash
echo "我的家目录是 $HOME"   # 双引号：$HOME 会被替换成变量的值
echo '我的家目录是 $HOME'   # 单引号：原样输出，什么都不替换
```

> 中文文件名在 Linux 下完全没问题。但给自己创建的文件（特别是要在命令行里操作的）起名时，建议用**英文、数字、短横线和下划线**，不用空格，能省很多麻烦。

### 7. 链接：`ln -s`

**软链接（符号链接）** 类似 Windows 的快捷方式：一个指向另一个文件或目录的"指针"。

```bash
ln -s ~/practice/projects/blog ~/practice/blog-link   # 建一个指向 blog 目录的软链接
command ls -l ~/practice                              # 能看到 blog-link -> /home/yourname/practice/projects/blog
cd ~/practice/blog-link                               # 可以像普通目录一样进去
rm ~/practice/blog-link                               # 删除软链接本身，不会影响原目录
```

注意格式是 `ln -s 原文件 链接名`，**原文件在前**，很多人会记反。删除指向目录的软链接时，**不要在末尾加 `/`**，`rm -r blog-link/` 这种写法删的可能是原目录里的内容。

## 五、查看和编辑文件

### 1. 查看文件内容

| 命令 | 作用 | 适合 |
| --- | --- | --- |
| `cat 文件` | 一次输出全部内容 | 短文件 |
| `less 文件` | 分页查看，可以上下翻、搜索 | 长文件 |
| `head 文件` | 只看开头 10 行，`-n 20` 指定行数 | 看文件开头 |
| `tail 文件` | 只看末尾 10 行 | 看日志最新的部分 |
| `tail -f 文件` | 持续显示文件新增的内容，`Ctrl + C` 退出 | 实时看日志 |
| `wc -l 文件` | 统计行数 | 统计 |
| `file 文件` | 判断文件类型 | 不知道一个文件是什么时 |
| `bat 文件` | 带语法高亮和行号的 `cat`（美化篇装过） | 看代码、配置 |

```bash
cat /etc/hostname
less /etc/pacman.conf        # q 退出，/ 搜索
head -n 5 /etc/passwd
tail -n 20 /var/log/pacman.log
file /usr/bin/ls             # 输出会告诉你这是一个 ELF 可执行文件
bat /etc/pacman.conf
```

`/var/log/pacman.log` 记录了你每一次安装、升级、卸载软件的时间和版本，系统更新后出问题时，用它查"最近升级了什么"非常有用。

### 2. 编辑文件：先学 nano

改配置文件是 Linux 的日常，需要一个命令行文本编辑器。最容易上手的是 **nano**：

```bash
sudo pacman -S --needed nano
nano ~/practice/hello.txt
```

nano 打开后就是普通的编辑模式，直接打字即可。底部有快捷键提示，`^` 代表 `Ctrl`：

| 快捷键 | 作用 |
| --- | --- |
| `Ctrl + O`，再按回车 | 保存 |
| `Ctrl + X` | 退出（有未保存的修改会询问） |
| `Ctrl + W` | 搜索 |
| `Ctrl + K` / `Ctrl + U` | 剪切整行 / 粘贴 |

### 3. vim 入门：至少学会"进得去、改得了、出得来"

双系统篇和美化篇里我们一直在用 vim。它是 Linux 上最常见的编辑器，几乎每台服务器上都有，**哪怕平时用 nano，也必须会 vim 的基本操作**：总有一天你会在一台只有 vim 的机器上改配置，或者某个命令（比如 `git commit`、`visudo`）突然把你扔进 vim 里。

vim 和普通编辑器最大的不同是**有模式**：

| 模式 | 怎么进入 | 干什么 |
| --- | --- | --- |
| **普通模式** | 打开 vim 时默认就是；任何时候按 `Esc` 回到这里 | 移动光标、删除、复制、粘贴，**按键是命令而不是输入文字** |
| **插入模式** | 普通模式下按 `i` | 像普通编辑器一样打字，左下角显示 `-- INSERT --` |
| **命令行模式** | 普通模式下按 `:` | 输入保存、退出、替换等命令 |

新手 vim 的"最小生存指南"：

```bash
vim ~/practice/hello.txt
```

1. 按 `i` 进入插入模式，输入一些文字。
2. 按 `Esc` 回到普通模式。
3. 输入 `:wq` 然后回车：保存并退出（w = write，q = quit）。

如果改乱了不想保存：按 `Esc`，输入 `:q!` 回车，**不保存强制退出**。

> 网上流传的笑话"怎么退出 vim"说的就是这个：在普通模式下乱按键会触发各种命令，在插入模式下输入 `:q` 只会把这三个字符打进文件里。**记住：不知道自己在哪个模式时，先按两下 `Esc`。**

学会上面这些就能用了。再进一步，普通模式下最常用的命令：

| 按键 | 作用 |
| --- | --- |
| `h` `j` `k` `l` | 左、下、上、右（方向键也能用） |
| `gg` / `G` | 跳到文件开头 / 结尾 |
| `0` / `$` | 跳到行首 / 行尾 |
| `w` / `b` | 跳到下一个 / 上一个单词 |
| `o` | 在下方新开一行并进入插入模式 |
| `x` | 删除光标处的一个字符 |
| `dd` | 删除（剪切）整行，`3dd` 删除 3 行 |
| `yy` | 复制整行 |
| `p` | 粘贴到下方 |
| `u` | 撤销，`Ctrl + R` 重做 |
| `/关键词` | 向下搜索，`n` 下一个，`N` 上一个 |
| `:数字` | 跳到第几行，比如 `:25` |
| `:%s/旧/新/g` | 全文替换 |

想系统学习，运行 `vimtutor`，跟着做一遍大约 30 分钟，是最好的 vim 入门教程。

### 4. 设置默认编辑器

有些命令（`visudo`、`sudoedit`、`git commit`）会自动打开一个编辑器，用哪个取决于环境变量 `EDITOR`。在 `~/.zshrc` 末尾加一行（环境变量第十二章细讲）：

```bash
export EDITOR=vim      # 习惯 nano 就写 nano
```

## 六、用户与权限

### 1. 用户和用户组

Linux 是多用户系统，每个文件都属于某个用户，每个程序都以某个用户的身份运行。

```bash
whoami          # 我是谁
id              # 我的用户 ID、所属的组
groups          # 我在哪些组里
```

`id` 的输出类似：

```text
uid=1000(yourname) gid=1000(yourname) groups=1000(yourname),998(wheel)
```

- 每个用户有一个 **UID**，第一个普通用户一般是 1000。
- **用户组**用来批量授权：把用户加进某个组，他就拥有这个组的权限。双系统篇里创建用户时用了 `useradd -m -G wheel yourname`，就是把你加进了 `wheel` 组，而 `wheel` 组被允许使用 `sudo`。

系统里的所有用户记录在 `/etc/passwd`：

```bash
cat /etc/passwd
```

你会发现除了 `root` 和你自己，还有很多陌生的"用户"，比如 `nobody`、`systemd-network`。它们是给系统服务用的，不能登录，作用是让每个服务只拥有自己需要的权限。

### 2. root 和 sudo

**root 是超级用户**（UID 为 0），可以做任何事，包括删除整个系统。所以日常使用普通用户，只在需要时临时借用 root 权限，这就是 `sudo`（superuser do）：

```bash
pacman -Syu         # 报错：error: you cannot perform this operation unless you are root.
sudo pacman -Syu    # 输入你自己的密码（不是 root 密码），以 root 身份执行
```

输入密码时**屏幕上不会显示任何字符**，连星号都没有，这是正常的，输完直接按回车。输一次密码后，几分钟内再用 `sudo` 不用重复输入。

什么时候需要 `sudo`？简单的判断标准：

- **修改家目录以外的东西**（`/etc` 里的配置、安装软件、管理系统服务）：需要。
- **操作家目录里的东西**：**不需要，也不应该加**。

为什么不应该加？用 `sudo` 在家目录里创建或修改的文件，所有者会变成 root，之后你自己就改不了了。很多"明明是我自己的文件却 Permission denied"的问题就是这么来的。双系统篇里强调"不要用 sudo 运行 paru"，也是同样的道理。

两个相关的写法：

```bash
sudo -i                     # 切换成 root 的 Shell，提示符变成 #，输入 exit 退出。尽量少用
sudoedit /etc/pacman.conf   # 安全地编辑系统文件：编辑器以普通用户身份运行，保存时再写回
```

### 3. 看懂文件权限

用原版 `ls -l` 看一下（美化篇里 `ls` 被设成了 eza 的别名，`command` 表示跳过别名，执行原版命令）：

```bash
command ls -l ~/practice
```

输出类似：

```text
-rw-r--r-- 1 yourname yourname    0 11月11日 20:15 a.txt
-rw-r--r-- 1 yourname yourname    0 11月11日 20:15 b.txt
drwxr-xr-x 3 yourname yourname 4096 11月11日 20:10 projects
```

重点看最前面的 10 个字符，以 `-rw-r--r--` 为例：

```text
-    rw-    r--    r--
│    │      │      └── 其他人（others）的权限
│    │      └───────── 所属组（group）的权限
│    └──────────────── 所有者（user）的权限
└───────────────────── 文件类型：- 普通文件，d 目录，l 软链接
```

后面的两个 `yourname` 分别是**所有者**和**所属组**。每组三个字符代表三种权限：

| 字符 | 对文件来说 | 对目录来说 | 数字 |
| --- | --- | --- | --- |
| `r` | 可以读取内容 | 可以列出目录里有哪些文件 | 4 |
| `w` | 可以修改内容 | 可以在目录里创建、删除、重命名文件 | 2 |
| `x` | 可以作为程序执行 | 可以进入目录（`cd`） | 1 |
| `-` | 没有这项权限 | | 0 |

所以 `-rw-r--r--` 的意思是：这是一个普通文件，所有者可读可写，同组用户和其他人只能读。

**数字表示法**：把每组的数字加起来，三组连在一起。这是最常见的写法：

| 数字 | 字符 | 常见用途 |
| --- | --- | --- |
| `644` | `rw-r--r--` | 普通文件的默认权限 |
| `755` | `rwxr-xr-x` | 目录、可执行脚本的默认权限 |
| `600` | `rw-------` | 私密文件，只有自己能读写，比如 SSH 私钥 |
| `700` | `rwx------` | 私密目录，比如 `~/.ssh` |

### 4. 修改权限：`chmod`

```bash
cd ~/practice
echo 'echo "Hello, Linux!"' > hello.sh   # 写一个最简单的脚本（> 是重定向，第十章讲）
./hello.sh                              # 报错：Permission denied（没有执行权限）
chmod +x hello.sh                       # 加上执行权限
./hello.sh                              # 输出 Hello, Linux!
```

> 为什么要写成 `./hello.sh` 而不是 `hello.sh`？因为 Shell 只在 PATH 环境变量列出的目录里找命令，当前目录不在其中，所以要用 `./` 明确指出"当前目录下的这个文件"。第十二章会解释 PATH。

`chmod` 的两种写法：

```bash
# 符号写法：谁（u 所有者 / g 组 / o 其他人 / a 所有人） + 加减（+ / - / =） + 权限
chmod u+x hello.sh       # 给所有者加执行权限
chmod go-w hello.sh      # 去掉组和其他人的写权限
chmod a=r a.txt          # 所有人只读

# 数字写法：直接设置三组权限
chmod 755 hello.sh
chmod 600 a.txt
```

`chmod -R` 可以递归修改整个目录，但要慎用：它会把目录里的普通文件也一起改掉，比如 `chmod -R 755` 会让所有文件都变成"可执行"。

**永远不要用 `chmod 777` 来"解决"权限问题。** 777 的意思是所有人都能读、写、执行，这等于把门拆了。网上有些答案遇到 Permission denied 就让你 `sudo chmod -R 777`，这会带来安全隐患，作用在某些文件上甚至会让程序拒绝工作（比如 SSH 发现私钥权限太宽松会直接拒绝使用）。正确做法是弄清楚为什么没权限，再针对性地修改。

### 5. 修改所有者：`chown`

```bash
sudo chown yourname:yourname 文件       # 把所有者和所属组都改成 yourname
sudo chown -R yourname:yourname 目录    # 递归修改整个目录
```

最常见的用途就是修复前面说的"不小心用 sudo 在家目录里创建了文件"的问题。可以用这条命令检查家目录里有没有属于 root 的文件：

```bash
find ~ -user root 2>/dev/null     # find 第十一章讲，2>/dev/null 第十章讲
```

没有任何输出就说明一切正常。

### 6. 用户管理常用命令

```bash
sudo useradd -m -G wheel 新用户名   # 创建用户，-m 同时创建家目录，-G 加入附加组
sudo passwd 用户名                  # 设置或修改密码，修改自己的密码直接 passwd
sudo usermod -aG 组名 用户名         # 把已有用户加入某个组
sudo userdel -r 用户名              # 删除用户及其家目录
```

`usermod -aG` 是实际中最常用的一条，比如以后用 Docker 时要把自己加进 `docker` 组。两个注意点：**`-a`（追加）千万不能漏**，只写 `-G` 会把用户从其他所有附加组里移除，包括 `wheel`，然后你就用不了 `sudo` 了；**加入组之后要注销重新登录才生效**。

## 七、软件包管理：pacman

> 本章是 Arch 专属内容。其他发行版的思路一样，只是命令不同，比如 Ubuntu / Debian 用 `apt`，Fedora 用 `dnf`。

### 1. 包管理器是什么

在 Windows 上装软件，要去官网下载安装包、一路"下一步"；更新时每个软件各自弹窗提醒。Linux 用**包管理器**统一管理：所有软件从官方**软件仓库**下载，自动处理依赖，一条命令更新所有软件。Arch 的包管理器就是 **pacman**。

双系统篇里我们配置了：

- **官方仓库**（core、extra 等）：Arch 官方维护，最可靠。
- **archlinuxcn**：中文社区维护的仓库，提供了很多国内常用软件。
- **AUR**：用户提交的打包脚本，数量最多但没有官方审核，用 `paru` 安装。

### 2. 最常用的命令

pacman 的选项看起来像乱码，其实很有规律：**大写字母是操作，小写字母是修饰**。

| 命令 | 作用 | 记忆方法 |
| --- | --- | --- |
| `sudo pacman -Syu` | **更新整个系统** | S 同步（Sync），y 刷新仓库列表，u 升级（upgrade） |
| `sudo pacman -S 包名` | 安装软件 | S 从仓库同步 |
| `sudo pacman -S --needed 包名` | 安装，已安装的跳过 | |
| `pacman -Ss 关键词` | 在仓库里搜索 | s 搜索（search） |
| `sudo pacman -Rns 包名` | 卸载软件，同时删除不再需要的依赖和配置备份 | R 移除（Remove），n 删配置，s 删依赖 |
| `pacman -Q` | 列出所有已安装的包 | Q 查询本地（Query） |
| `pacman -Qs 关键词` | 在已安装的包里搜索 | |
| `pacman -Qi 包名` | 查看已安装包的详细信息 | i 信息（info） |
| `pacman -Si 包名` | 查看仓库里某个包的信息（不用安装） | |
| `pacman -Ql 包名` | 列出这个包安装了哪些文件 | l 列表（list） |
| `pacman -Qo 文件路径` | 查询某个文件属于哪个包 | o 属于（owns） |
| `pacman -F 文件名` | 查询哪个包（包括没装的）提供某个文件，先运行 `sudo pacman -Fy` | F 文件（Files） |

查询类命令（`-Q`、`-Ss`、`-Si`）不需要 `sudo`，修改系统的（`-S`、`-R`、`-Syu`）才需要。

几个实用场景：

```bash
pacman -Ss video player        # 想装个视频播放器，先搜搜有什么
pacman -Si mpv                 # 看看 mpv 的介绍、大小、依赖
sudo pacman -S mpv             # 装上
pacman -Ql mpv | grep bin      # mpv 装了哪些命令
pacman -Qo /usr/bin/ls         # ls 这个命令是哪个包提供的？答案是 coreutils
sudo pacman -Fy && pacman -F ifconfig   # 想用 ifconfig 但提示 command not found，查查它在哪个包里
```

### 3. Arch 更新系统的几条规矩

Arch 是**滚动更新**的发行版：没有"大版本"的概念，软件一有新版本就推送。好处是永远用最新的软件，代价是要遵守几条规矩：

1. **始终用 `sudo pacman -Syu` 更新整个系统，不要用 `pacman -Sy 某包`。** 后者会刷新仓库列表、却只升级这一个包，导致系统里的软件版本不一致（叫"部分升级"），可能让其他程序因为依赖的库版本不对而无法启动。Arch 官方明确不支持部分升级。想装新软件时，可以合在一起写成 `sudo pacman -Syu 包名`。
2. **更新前看一眼 [Arch 官网新闻](https://archlinux.org/news/)**。偶尔有需要手动干预的更新，新闻里会写清楚怎么做。
3. **更新时看一眼 pacman 的输出**。以 `warning:` 开头的提示要留意，特别是 `.pacnew` 文件：表示某个配置文件有了新版本，但因为你改过旧的，pacman 没有覆盖，而是把新版本存成了 `.pacnew`，需要你手动比较合并。
4. **不要太久不更新**。几个月不更新再一次性升级，出问题的概率大很多。建议一周左右更新一次。
5. **更新出问题了，有快照兜底**。双系统篇配置了 snap-pac，每次 pacman 操作前后都会自动拍快照，回滚方法见双系统篇第十章。

查找系统里的 `.pacnew` 文件：

```bash
sudo pacman -S --needed pacman-contrib   # 提供 pacdiff、paccache 等工具
pacdiff -o                               # 只列出 .pacnew 文件，不做处理
```

### 4. 清理

```bash
pacman -Qdtq                          # 列出"孤儿包"：作为依赖被装进来、但现在已经没有软件需要的包
sudo pacman -Rns $(pacman -Qdtq)      # 卸载所有孤儿包（列表为空时会报错，无视即可）
paccache -r                           # 清理软件包缓存，每个包只保留最近 3 个版本
du -sh /var/cache/pacman/pkg          # 看看缓存占了多少空间
```

卸载孤儿包前，先看一眼 `pacman -Qdtq` 列出的东西，确认里面没有你想保留的软件。`$(命令)` 的意思是"把这条命令的输出当作参数"，第十六章会再遇到。

pacman 下载的安装包会一直留在 `/var/cache/pacman/pkg/`，时间长了能占好几个 G。保留几个旧版本的好处是：新版有问题时可以降级回去。

### 5. AUR 和 paru

官方仓库和 archlinuxcn 里都找不到的软件，才去 AUR 找。`paru` 的用法和 pacman 几乎一样：

```bash
paru 关键词          # 搜索（包括官方仓库和 AUR），然后输入编号安装
paru -S 包名         # 安装
paru                 # 不带参数：等于 paru -Syu，同时更新官方仓库和 AUR 的软件
```

**AUR 的包是任何人都能上传的**，paru 安装前会让你查看 PKGBUILD（打包脚本）。至少看一眼它从哪里下载源码，以及包的投票数、最后更新时间。来源可疑、很久没人维护的包，慎装。

### 6. 其他安装方式

- **Flatpak**：美化篇第十六章提过，跨发行版的沙盒化应用，适合装一些闭源的大软件。用 `flatpak install` 安装，`flatpak update` 更新。
- **AppImage**：一个文件就是一个程序，下载后 `chmod +x` 就能运行，不用安装。
- **`make install`、来路不明的 `.sh` 安装脚本**：尽量避免。它们绕过了包管理器，pacman 不知道它们装了什么文件，以后很难干净地卸载，还可能覆盖系统文件。

优先级：**官方仓库 > archlinuxcn > AUR > Flatpak > 其他**。

## 八、进程管理

### 1. 什么是进程

**程序**是硬盘上的文件，**进程**是正在运行的程序。同一个程序可以运行多次，产生多个进程。每个进程有一个唯一的编号，叫 **PID**。

### 2. 查看进程

```bash
ps aux                   # 列出所有进程的快照
ps aux | grep firefox    # 只看和 firefox 有关的进程
pgrep -a firefox         # 更简单的写法：列出名字匹配的进程的 PID 和完整命令
```

`ps aux` 的输出列很多，关注这几列就行：

| 列 | 含义 |
| --- | --- |
| `USER` | 进程以哪个用户的身份运行 |
| `PID` | 进程编号 |
| `%CPU` / `%MEM` | CPU / 内存占用 |
| `COMMAND` | 启动它的命令 |

想实时查看，用 `top`，或者更好用的 `htop` / `btop`：

```bash
sudo pacman -S htop btop
htop
```

在 `htop` 里：`F6` 选择排序方式（比如按 CPU 或内存排序），`F9` 结束选中的进程，`F10` 或 `q` 退出。`btop` 界面更漂亮，还能看网络和硬盘读写。

> 这就是 Linux 版的"任务管理器"。KDE 也有图形版的**系统监视器**（System Monitor），按 `Ctrl + Esc` 打开。

### 3. 结束进程

程序卡死了怎么办？

```bash
kill 12345               # 给 PID 为 12345 的进程发送"请结束"的信号
kill -9 12345            # 强制结束（进程没机会保存数据，前一种无效时再用）
pkill firefox            # 按名字结束进程
killall firefox          # 结束所有叫 firefox 的进程
```

`kill` 本质上是给进程发送**信号**。默认发送 `SIGTERM`（15 号），礼貌地请进程退出，进程可以先保存数据、清理现场；`-9` 是 `SIGKILL`，由内核直接杀掉，进程无法拒绝也无法善后。**先用默认的，不行再用 `-9`。** 前面说的 `Ctrl + C`，其实就是给前台进程发送 `SIGINT` 信号。

图形程序卡死时，KDE 里还可以按 `Ctrl + Alt + Esc`，鼠标变成骷髅后点一下卡死的窗口，直接把它杀掉。

### 4. 前台和后台

在终端里运行一个程序，它默认在**前台**，占住终端直到结束。有几种办法把它放到后台：

```bash
sleep 300              # 运行一个要 5 分钟的命令，终端被占住了
# 按 Ctrl + Z：把它暂停并放到后台
jobs                   # 查看后台任务，显示 [1]  + suspended  sleep 300
bg %1                  # 让 1 号任务在后台继续运行
fg %1                  # 把 1 号任务调回前台
sleep 300 &            # 命令末尾加 &：一开始就在后台运行
```

**注意：后台任务属于这个终端，关掉终端窗口，它们一般也会被结束。** 想让命令在关闭终端后继续运行：

```bash
nohup 长时间运行的命令 > output.log 2>&1 &
```

`nohup` 让进程忽略终端关闭的信号，输出写进 `output.log`（`2>&1` 第十章解释）。在远程服务器上跑长任务，更推荐 `tmux`，第十五章会提到。

从终端启动图形程序（比如 `dolphin .` 用文件管理器打开当前目录）时，用 `setsid dolphin .` 可以让它彻底脱离终端，关掉终端也不影响。

## 九、systemd：服务和日志

### 1. 服务是什么

**服务（service）** 是在后台持续运行、不需要你手动启动的程序，比如网络管理（NetworkManager）、蓝牙、登录界面、SSH 服务器。在 Arch 和大多数现代发行版上，管理服务的是 **systemd**，用到的命令是 `systemctl`。

双系统篇里我们已经用过它了：

```bash
systemctl enable NetworkManager
```

### 2. systemctl 常用命令

| 命令 | 作用 |
| --- | --- |
| `systemctl status 服务名` | 查看服务状态（不需要 sudo） |
| `sudo systemctl start 服务名` | 立即启动 |
| `sudo systemctl stop 服务名` | 立即停止 |
| `sudo systemctl restart 服务名` | 重启（改了服务的配置文件后常用） |
| `sudo systemctl enable 服务名` | 设置开机自启（不会立即启动） |
| `sudo systemctl disable 服务名` | 取消开机自启 |
| `sudo systemctl enable --now 服务名` | 设置开机自启**并且**立即启动，最常用 |
| `systemctl --failed` | 列出启动失败的服务 |
| `systemctl list-unit-files --state=enabled` | 列出所有开机自启的服务 |

**`start` 和 `enable` 是两件事**，新手经常搞混：`start` 是"现在启动"，重启电脑后就没了；`enable` 是"以后每次开机都启动"，但不影响现在。大多数时候你两个都要，所以用 `enable --now`。

看一下 NetworkManager 的状态：

```bash
systemctl status NetworkManager
```

输出类似这样（按 `q` 退出）：

```text
● NetworkManager.service - Network Manager
     Loaded: loaded (/usr/lib/systemd/system/NetworkManager.service; enabled; preset: disabled)
     Active: active (running) since Wed 2026-11-11 19:02:13 CST; 1h 20min ago
   Main PID: 612 (NetworkManager)
   ...
11月 11 19:02:14 arch-911x NetworkManager[612]: <info>  ... 最近几行日志 ...
```

- `Loaded` 一行里的 `enabled` 表示已设置开机自启。
- `Active: active (running)` 表示正在运行；`inactive (dead)` 表示没运行；`failed` 表示启动失败。
- 最下面是这个服务最近的几行日志，**服务出问题时先看这里**。

服务的名字后面其实都有 `.service` 后缀，命令里可以省略。

### 3. 用户级服务

有些服务是跟着用户走的，比如音频服务 PipeWire，它们不需要 root 权限，用 `--user` 管理，也不用加 `sudo`：

```bash
systemctl --user status pipewire
systemctl --user restart pipewire    # 声音出问题时可以试试重启它
```

### 4. 看日志：journalctl

systemd 把所有服务和内核的日志统一收集起来，用 `journalctl` 查看。**系统出了问题，日志是第一手线索。**

```bash
journalctl -b                 # 本次开机以来的所有日志
journalctl -b -1              # 上一次开机的日志（上次死机、黑屏后查原因用）
journalctl -b -p err          # 本次开机以来的错误（err）及更严重的日志
journalctl -u NetworkManager  # 只看某个服务的日志
journalctl -u NetworkManager -b -n 50   # 某个服务本次开机的最后 50 行
journalctl -f                 # 实时滚动显示新日志，Ctrl + C 退出
journalctl --since "10 min ago"   # 最近 10 分钟的日志
journalctl -k                 # 只看内核日志，排查硬件、驱动问题
```

查看系统级服务的完整日志可能需要 `sudo`，或者确保自己在 `wheel` 组里。日志通常很长，默认用 `less` 显示：按 `G` 跳到最后（最新的日志在最下面），`/` 搜索关键词。

日志会占用硬盘空间，可以这样查看和清理：

```bash
journalctl --disk-usage
sudo journalctl --vacuum-size=500M   # 只保留最近 500M 的日志
```

> 看到一堆红色的错误先别慌。正常系统的日志里也会有一些无害的报错（比如某个可选的硬件不存在）。排查问题时，关注**和问题出现时间吻合**、**和出问题的组件相关**的那几行。把报错信息原文复制去搜索，通常就能找到答案。

### 5. 开机慢？看看谁拖了后腿

```bash
systemd-analyze               # 开机总耗时
systemd-analyze blame         # 每个服务的启动耗时，从慢到快排序
```

如果某个你用不到的服务特别慢，可以 `disable` 掉。但不认识的服务别乱关，先搜一下它是干什么的。

## 十、重定向与管道：把命令组合起来

Linux 命令行真正强大的地方，在于**每个命令只做好一件小事，然后把它们像积木一样拼起来**。拼接靠的就是重定向和管道。

### 1. 三个标准数据流

每个命令运行时都有三个"通道"：

| 名称 | 编号 | 默认去向 | 内容 |
| --- | --- | --- | --- |
| 标准输入（stdin） | 0 | 键盘 | 命令读取的数据 |
| 标准输出（stdout） | 1 | 屏幕 | 正常的输出结果 |
| 标准错误（stderr） | 2 | 屏幕 | 报错信息 |

正常输出和报错信息都显示在屏幕上，看起来没区别，但它们其实是两条独立的通道，可以分别处理。

### 2. 输出重定向

```bash
cd ~/practice
echo "第一行" > notes.txt      # > ：把输出写进文件，文件已存在会被【覆盖】
echo "第二行" >> notes.txt     # >>：追加到文件末尾
cat notes.txt
ls /不存在的目录 2> error.txt  # 2>：只把报错写进文件
ls ~ /不存在的目录 > out.txt 2>&1   # 2>&1：把报错也送到标准输出去，两者都写进 out.txt
ls ~ /不存在的目录 &> out.txt       # 和上一条效果一样的简写
```

**`>` 会悄无声息地清空并覆盖原文件**，这是新手丢数据的常见原因之一。往已有文件里加内容一定用 `>>`。

`/dev/null` 是一个特殊的"黑洞"文件，写进去的东西都会消失。不想看某些输出时就丢给它：

```bash
find / -name "*.conf" 2>/dev/null   # 搜索整个系统，但不显示大量的"权限不够"报错
```

### 3. 输入重定向

`<` 让命令从文件读取输入，而不是从键盘：

```bash
wc -l < notes.txt      # 统计 notes.txt 的行数
```

### 4. 管道 `|`：把一个命令的输出交给下一个命令

管道是最常用的拼接方式：`命令A | 命令B`，A 的输出直接成为 B 的输入。

```bash
ls /usr/bin | wc -l                 # /usr/bin 里有多少个命令
pacman -Q | wc -l                   # 一共装了多少个软件包
ps aux | grep firefox               # 在进程列表里找 firefox
history | grep pacman               # 在历史命令里找用过的 pacman 命令
journalctl -b | grep -i error       # 在日志里找 error（-i 忽略大小写）
```

可以一直串下去。比如：**找出最近安装和升级最频繁的 10 个软件包**：

```bash
grep -E "installed|upgraded" /var/log/pacman.log | awk '{print $4}' | sort | uniq -c | sort -rn | head
```

拆开来看：

1. `grep -E "installed|upgraded" /var/log/pacman.log`：从 pacman 日志里找出安装和升级的记录
2. `awk '{print $4}'`：每行按空格分列，取第 4 列（包名）
3. `sort`：排序，让相同的包名挨在一起
4. `uniq -c`：合并相邻的重复行，并在前面加上出现次数
5. `sort -rn`：按数字（`-n`）从大到小（`-r`）排序
6. `head`：只看前 10 行

一开始不用追求写出这么长的组合，**能看懂、知道每一段在干什么就够了**。自己写的时候也是这样一段一段加，每加一段看一下输出对不对。

### 5. 文本处理的常用小工具

| 命令 | 作用 | 例子 |
| --- | --- | --- |
| `grep 关键词` | 过滤出包含关键词的行 | `grep -i error log.txt` |
| `sort` | 排序，`-n` 按数字，`-r` 倒序 | `sort -n numbers.txt` |
| `uniq` | 去掉相邻的重复行，`-c` 计数，通常先 `sort` | `sort list.txt \| uniq` |
| `wc` | 统计，`-l` 行数，`-w` 单词数，`-c` 字节数 | `wc -l file.txt` |
| `head` / `tail` | 取开头 / 结尾几行 | `head -n 3` |
| `cut` | 按分隔符取某几列 | `cut -d: -f1 /etc/passwd` 列出所有用户名 |
| `awk` | 按列处理文本，功能很强，常用来取某一列 | `awk '{print $1}'` |
| `sed` | 查找替换 | `sed 's/旧/新/g' file.txt` |
| `tr` | 替换或删除字符 | `echo hello \| tr a-z A-Z` 转成大写 |

`grep` 最常用，它的几个选项值得记住：

```bash
grep -i "error" 文件       # 忽略大小写
grep -n "error" 文件       # 显示行号
grep -v "debug" 文件       # 反向：显示【不】包含 debug 的行
grep -r "关键词" 目录       # 递归搜索目录下所有文件的内容
grep -E "a|b" 文件          # 使用扩展正则表达式，匹配 a 或 b
```

### 6. `tee`：既显示又保存，以及 sudo 写文件的坑

`tee` 把输入同时输出到屏幕和文件：

```bash
sudo pacman -Syu 2>&1 | tee ~/practice/update.log   # 一边看更新过程，一边存一份日志
```

`tee` 还解决了一个经典的坑。假设你想往系统配置文件里追加一行，很自然会这样写：

```bash
sudo echo "something" >> /etc/某配置文件   # 报错：Permission denied
```

明明加了 `sudo` 为什么还没权限？因为 `>>` 重定向是**你当前的 Shell**（普通用户身份）在处理，`sudo` 只作用于 `echo` 这个命令。正确的写法是让有 root 权限的 `tee` 去写文件：

```bash
echo "something" | sudo tee -a /etc/某配置文件      # -a 表示追加，不加 -a 就是覆盖
```

网上很多教程里的 `| sudo tee` 就是这个原因。

### 7. `xargs`：把输入变成参数

有些命令不从标准输入读数据，而是要参数，比如 `rm`。`xargs` 负责把管道传过来的内容转换成参数：

```bash
cd ~/practice
ls *.md | xargs wc -l        # 统计每个 md 文件的行数
```

## 十一、查找文件和命令

### 1. `find`：按条件找文件

`find` 的格式是 `find 从哪里找 按什么条件`：

```bash
find ~/practice -name "*.txt"         # 按名字找，支持通配符（记得加引号）
find ~ -iname "*readme*"              # -iname 忽略大小写
find ~/practice -type d               # 只找目录（f 普通文件，d 目录，l 软链接）
find ~ -size +100M                    # 找大于 100M 的文件，清理空间时很有用
find ~/Downloads -mtime -7            # 最近 7 天内修改过的文件
find ~/practice -name "*.log" -delete # 找到后直接删除（先不加 -delete 跑一遍确认！）
find ~/practice -name "*.sh" -exec chmod +x {} \;   # 对每个找到的文件执行命令，{} 代表文件名
```

### 2. `locate`：按名字秒找

`find` 是实时遍历硬盘，范围大时比较慢。`locate` 查询一个预先建好的文件名数据库，几乎瞬间出结果：

```bash
sudo pacman -S plocate
sudo updatedb                 # 建立数据库（安装后会自动定期更新）
locate pacman.conf
```

缺点是刚创建的文件要等数据库更新后才能搜到。

### 3. 按内容找：`grep -r` 和 `rg`

不知道文件名，只记得文件里有某段文字时：

```bash
grep -rn "GRUB_TIMEOUT" /etc/default/   # 在目录里递归搜索，-n 显示行号
```

更快的替代品是 `ripgrep`，命令名 `rg`，自动跳过 `.gitignore` 里的文件，搜代码时特别好用：

```bash
sudo pacman -S ripgrep
rg "关键词" 目录
```

### 4. 找命令本身在哪：`which`、`type`

```bash
which pacman          # 输出 /usr/bin/pacman
type ls               # 告诉你 ls 是一个别名（alias），还是一个程序
type cd               # cd 是 Shell 内置命令
```

`type ls` 在我们的环境下会显示 `ls is an alias for eza --icons --group-directories-first`，这就解释了为什么前面要用 `command ls` 才能执行原版的 `ls`。

## 十二、环境变量与 Shell 配置

### 1. 变量

Shell 里可以定义变量，用 `$` 读取它的值：

```bash
name="Linux"            # 定义变量，等号两边【不能有空格】
echo "Hello, $name"     # 输出 Hello, Linux
echo "${name}er"        # 变量名后面紧跟其他字符时，用大括号括起来
```

**环境变量**是一类特殊的变量，会被传递给从这个 Shell 启动的所有程序，程序根据它们调整自己的行为。看几个常见的：

```bash
echo $HOME      # 家目录
echo $USER      # 用户名
echo $SHELL     # 默认 Shell
echo $LANG      # 语言设置，比如 zh_CN.UTF-8
echo $EDITOR    # 默认编辑器
env             # 列出所有环境变量
```

用 `export` 设置环境变量：

```bash
export EDITOR=vim
```

但这样设置只对**当前这个终端**有效，关掉就没了。要永久生效，得写进配置文件。

### 2. PATH：Shell 去哪里找命令

```bash
echo $PATH
```

输出类似：

```text
/usr/local/sbin:/usr/local/bin:/usr/bin
```

这是一串用冒号分隔的目录。你输入 `pacman` 时，Shell 就按顺序在这些目录里找名叫 `pacman` 的可执行文件，找到第一个就执行。找遍了都没有，就报 `command not found`。

这就解释了两件事：

1. 为什么运行当前目录的脚本要写 `./hello.sh`：当前目录不在 PATH 里。
2. 为什么有些通过其他方式安装的工具（比如 Rust 的 cargo、Python 的 pip 装在用户目录下的命令）装好后提示找不到：它们所在的目录没加进 PATH。

把自己写的脚本放到 `~/.local/bin`，并把这个目录加进 PATH，就能像系统命令一样在任何地方直接运行了：

```bash
mkdir -p ~/.local/bin
```

然后在 `~/.zshrc` 里加上：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

这行的意思是：把 `~/.local/bin` 加到原有 PATH 的**前面**。注意一定要带上 `:$PATH`，否则会把原来的 PATH 整个覆盖掉，所有命令都找不到了。

### 3. Shell 配置文件

Shell 每次启动时，会读取家目录下的配置文件，在里面写的变量、别名就会自动生效：

| Shell | 配置文件 |
| --- | --- |
| zsh | `~/.zshrc` |
| bash | `~/.bashrc` |

美化篇里我们已经写过一份 `~/.zshrc`。现在你应该能看懂里面大部分内容了：`HISTSIZE` 是变量，`setopt` 是 zsh 的选项开关，`alias` 定义别名，`source` 加载插件。

修改配置文件后，要让它在当前终端立即生效：

```bash
source ~/.zshrc
```

或者干脆重新打开一个终端。

### 4. 别名：给常用命令起个短名字

```bash
alias update='sudo pacman -Syu'     # 以后输入 update 就等于 sudo pacman -Syu
alias                               # 列出所有别名
unalias update                      # 删除别名（只对当前终端有效）
```

同样，想永久保留就写进 `~/.zshrc`。几个可以考虑加的：

```bash
alias cp='cp -i'          # 复制时覆盖前询问
alias mv='mv -i'          # 移动时覆盖前询问
alias df='df -h'          # 磁盘空间用 G 显示
alias free='free -h'
```

## 十三、压缩与打包

### 1. 打包和压缩是两件事

在 Linux 里：

- **打包**（tar）：把很多文件和目录合并成**一个**文件，不减小体积。
- **压缩**（gzip、xz、zstd）：把**一个**文件变小。

所以常见的 `.tar.gz` 就是"先用 tar 打包，再用 gzip 压缩"。好在 `tar` 命令可以一步搞定。

### 2. tar：最常用的三条

`tar` 的选项可以这样记：**c**reate 创建、e**x**tract 解压、**t** 列出内容、**z** 用 gzip、**v** 显示过程、**f** 后面跟文件名（`f` 必须放最后）。

```bash
cd ~
tar czvf practice.tar.gz practice/      # 打包并压缩 practice 目录
tar tzvf practice.tar.gz                # 不解压，只看里面有什么
tar xzvf practice.tar.gz                # 解压到当前目录
tar xzvf practice.tar.gz -C /tmp        # 解压到指定目录（-C 大写）
```

其实现在的 `tar` 解压时会自动识别压缩格式，解压任何 `.tar.*` 文件都可以直接用：

```bash
tar xf 任意文件.tar.gz        # 或 .tar.xz、.tar.zst、.tar.bz2
```

几种压缩格式的对比：

| 后缀 | 压缩方式 | tar 选项 | 特点 |
| --- | --- | --- | --- |
| `.tar.gz` / `.tgz` | gzip | `z` | 最通用，速度快 |
| `.tar.xz` | xz | `J` | 压缩率高，但慢 |
| `.tar.zst` | zstd | `--zstd` | 又快压缩率又高，Arch 的软件包就是这个格式 |

美化篇第一章备份 KDE 配置时用的 `tar czf`，就是这里的 `c`、`z`、`f` 组合。

### 3. zip、rar、7z

和 Windows 用户互传文件时，常用 zip：

```bash
sudo pacman -S --needed zip unzip
zip -r practice.zip practice/      # 压缩目录要加 -r
unzip practice.zip                 # 解压
unzip -l practice.zip              # 只看内容
```

**Windows 上压缩的 zip 解压后中文文件名变成乱码**，这是因为 Windows 中文版默认用 GBK 编码文件名，而 Linux 用 UTF-8。用 `unar` 解压可以自动识别编码：

```bash
sudo pacman -S unarchiver          # 提供 unar 和 lsar 两个命令
unar 文件.zip                       # 自动识别编码，也能解压 rar、7z 等格式
unar -e GBK 文件.zip                # 自动识别失败时手动指定编码
```

7z 格式用 `7zip` 包提供的 `7z` 命令：`7z x 文件.7z` 解压。

> 图形界面下，KDE 的 **Ark** 也能处理以上所有格式，在 Dolphin 里右键压缩包就能解压。

## 十四、磁盘与存储

### 1. 磁盘空间：`df`、`du`

```bash
df -h                     # 每个挂载点的总空间、已用、可用（-h 用 G、M 显示）
du -sh ~/Downloads        # 某个目录占了多大空间（-s 只显示总数）
du -sh ~/* | sort -h      # 家目录下每个文件和目录的大小，从小到大排列
du -sh ~/.cache           # 缓存往往很大，可以放心清理
```

更直观的是 `ncdu`，交互式地查看哪里最占空间：

```bash
sudo pacman -S ncdu
ncdu ~                    # 方向键进出目录，d 删除，q 退出
```

> **Btrfs 用户注意**：因为快照和压缩的存在，`df` 显示的已用空间在 Btrfs 上不太准确。双系统篇里我们用的是 Btrfs，查看真实使用情况用：
>
> ```bash
> sudo btrfs filesystem usage /
> ```
>
> 如果发现空间被莫名其妙地占满，很可能是**快照太多**，旧快照里引用着已经删掉的文件。用 `snapper -c root list` 查看，按双系统篇第十章的方法清理旧快照。

### 2. 内存：`free`

```bash
free -h
```

输出里看 `available` 一列，这才是真正还能用的内存。`free` 一列很小是正常的，Linux 会把空闲内存拿去做文件缓存，需要时随时让出来。"Linux 吃内存"是一个常见的误解。

### 3. 硬盘和分区：`lsblk`

```bash
lsblk -f
```

以树状显示所有硬盘、分区、文件系统类型和挂载点。双系统篇分区时用过，你能在里面看到 Windows 的 NTFS 分区、EFI 分区和 Arch 的 Btrfs 分区。

### 4. 挂载：访问 U 盘和 Windows 分区

前面说过，Linux 没有盘符，一个分区要**挂载**到目录树上的某个位置才能访问。在 KDE 里插上 U 盘，Dolphin 左侧会出现它，点一下就自动挂载到 `/run/media/yourname/` 下。命令行手动挂载：

```bash
lsblk -f                                   # 先找到分区名，比如 /dev/sda1
sudo mkdir -p /mnt/usb
sudo mount /dev/sda1 /mnt/usb              # 挂载
ls /mnt/usb
sudo umount /mnt/usb                       # 卸载（注意命令是 umount，没有 n）
```

**拔 U 盘之前一定要先卸载**（Dolphin 里点弹出图标），否则还没写完的数据会丢失。

访问 Windows 分区时要注意：如果 Windows 开着"快速启动"或者处于休眠状态，NTFS 分区会被锁定，Linux 只能以只读方式挂载，甚至挂载失败。双系统篇里已经关掉了快速启动，如果还遇到这个问题，回到 Windows 里**完全关机**（不是重启后直接切换）再试。**尽量不要在 Linux 里修改 Windows 系统分区的文件。**

## 十五、网络基础与 SSH

### 1. 查看网络状态

```bash
ip a                      # 查看所有网卡和 IP 地址（ip addr 的简写）
ip route                  # 查看路由，default via 后面就是网关（路由器）地址
ping -c 4 archlinux.org   # 测试能否连通某个网站，-c 4 只发 4 次（不加会一直 ping，Ctrl+C 停止）
nmcli device wifi list    # 列出附近的 WiFi
nmcli device wifi connect "WiFi名" password "密码"   # 连接 WiFi
```

`ip a` 的输出里，`lo` 是本机回环地址 `127.0.0.1`，`wlan0`（或者类似 `wlp3s0` 的名字）是无线网卡，`inet` 后面就是你在局域网里的 IP 地址，比如 `192.168.1.105`。

> `ifconfig` 是老命令，Arch 默认不装，用 `ip` 代替就好。

排查"上不了网"的思路：

1. `ip a`：网卡有没有拿到 IP？没有就是 WiFi 或网线的问题。
2. `ping 网关地址`：能不能连到路由器？
3. `ping 223.5.5.5`：能不能连到外网的 IP？（223.5.5.5 是阿里的公共 DNS）
4. `ping baidu.com`：能 ping 通 IP 但 ping 不通域名，就是 DNS 的问题。

### 2. 下载：`curl`、`wget`

```bash
curl https://archlinux.org            # 把网页内容输出到终端
curl -LO https://某网址/文件.tar.gz     # 下载文件，保存为原文件名（-L 跟随跳转）
wget https://某网址/文件.tar.gz         # 下载文件（需要先装 wget 包）
curl ip.sb                            # 查看自己的公网 IP
```

### 3. 查看端口：`ss`

```bash
ss -tulpn             # 列出所有正在监听的端口，以及是哪个程序
```

比如开发时提示"端口已被占用"，用 `ss -tulpn | grep 3000` 就能找出是谁占了 3000 端口。看进程名需要 `sudo`。

### 4. SSH：远程登录

SSH 是远程登录 Linux 服务器的标准方式。买了云服务器、或者想从另一台电脑登录这台 Arch，都用它。

**连接远程服务器**（Arch 自带 ssh 客户端，在 `openssh` 包里）：

```bash
ssh 用户名@服务器IP           # 第一次连接会问是否信任这台主机，输入 yes
ssh -p 2222 用户名@服务器IP   # 服务器的 SSH 不在默认的 22 端口时
exit                         # 退出远程登录
```

登录后的操作就和本地终端一样了，本文学的所有命令都能用。**注意看提示符里的主机名**，确认自己是在本机还是在服务器上，别在服务器上执行了本来想在本机执行的命令。

**用密钥代替密码登录**，更安全，也不用每次输密码：

```bash
ssh-keygen -t ed25519 -C "我的笔记本"   # 生成密钥对，一路回车即可（也可以给私钥设个密码）
ssh-copy-id 用户名@服务器IP             # 把公钥复制到服务器上
ssh 用户名@服务器IP                     # 之后登录就不用输服务器密码了
```

这会在 `~/.ssh/` 下生成两个文件：

- `id_ed25519`：**私钥**，相当于你的钥匙，**绝对不能给任何人**，权限必须是 600。
- `id_ed25519.pub`：**公钥**，相当于锁，可以放心地放到各个服务器、GitHub 上。

**给常用服务器起别名**：编辑 `~/.ssh/config`：

```text
Host myserver
    HostName 203.0.113.10
    User yourname
    Port 22
```

之后 `ssh myserver` 就能直接登录。

**传文件**：

```bash
scp 本地文件 myserver:~/                 # 上传到服务器的家目录
scp myserver:~/远程文件 ./               # 下载到本地当前目录
scp -r 本地目录 myserver:~/              # 传目录加 -r
rsync -avP 本地目录/ myserver:~/备份/     # rsync：只传有变化的部分，支持断点续传，同步大量文件时更好用（两边都要装 rsync）
```

**在服务器上跑长任务用 tmux**：SSH 断开后，在里面运行的程序也会被结束。`tmux` 能创建一个独立于 SSH 连接的会话：

```bash
tmux                  # 新建一个会话，在里面运行长任务
# 按 Ctrl + B，松开，再按 D：离开会话（任务继续在后台运行），然后可以放心断开 SSH
tmux attach           # 下次登录后，回到之前的会话
```

> 如果想让别的电脑 SSH 登录**这台 Arch**，需要安装并启动 SSH 服务：`sudo systemctl enable --now sshd`。笔记本日常用不到的话，**不建议开启**，少开一个服务就少一个被攻击的入口。

## 十六、第一个 Shell 脚本

把一串命令写进文件，就是 Shell 脚本。它是把重复工作自动化的第一步。

### 1. Hello World

```bash
mkdir -p ~/.local/bin
vim ~/.local/bin/hello
```

写入：

```bash
#!/usr/bin/env bash
# 我的第一个脚本

echo "你好，$USER！"
echo "今天是 $(date +%Y年%m月%d日)"
echo "你现在在：$(pwd)"
```

保存退出，然后：

```bash
chmod +x ~/.local/bin/hello
hello
```

（如果提示 `command not found`，检查一下第十二章的 PATH 设置，并重新打开终端。）

逐行解释：

- 第一行 `#!/usr/bin/env bash` 叫 **shebang**，告诉系统用 bash 来执行这个脚本。**即使你日常用的是 zsh，脚本也建议用 bash 写**，因为 bash 在几乎所有 Linux 系统上都有，脚本拿到别的机器上也能运行。
- `#` 开头的是注释。
- `$(命令)` 叫**命令替换**，会被替换成括号里命令的输出结果。

### 2. 变量、参数、条件判断

再写一个稍微有用一点的：输入一个目录，告诉你它的大小和文件数量。

```bash
vim ~/.local/bin/dirinfo
```

```bash
#!/usr/bin/env bash
# 用法：dirinfo 目录路径

# 没有传参数时，默认用当前目录
target="${1:-.}"

if [ ! -d "$target" ]; then
    echo "错误：$target 不是一个目录" >&2
    exit 1
fi

size=$(du -sh "$target" | cut -f1)
count=$(find "$target" -type f | wc -l)

echo "目录：$target"
echo "大小：$size"
echo "文件数：$count"
```

```bash
chmod +x ~/.local/bin/dirinfo
dirinfo ~/practice
dirinfo /不存在
```

新出现的语法：

- `$1`：运行脚本时传入的第一个参数，`$2` 是第二个，以此类推；`$#` 是参数个数，`$@` 是所有参数。
- `${1:-.}`：如果 `$1` 为空，就用 `.`（当前目录）作为默认值。
- `if [ 条件 ]; then ... fi`：条件判断。**方括号里面两侧必须有空格**。`-d` 判断是否是目录，`!` 表示取反。其他常用的判断：`-f` 是否是普通文件，`-e` 是否存在，`-z "$var"` 变量是否为空，`"$a" = "$b"` 字符串是否相等。
- `>&2`：把这句输出送到标准错误，报错信息就应该这么输出。
- `exit 1`：退出脚本，返回值 1 表示失败（0 表示成功）。
- **变量引用时都加上了双引号** `"$target"`：这样路径里有空格也不会出错。这是写脚本最重要的好习惯之一。

### 3. 循环

```bash
for file in ~/practice/*.txt; do
    echo "处理：$file"
    wc -l "$file"
done
```

`for` 循环可以直接在终端里输入，不一定要写进脚本。再举个例子，批量把 jpg 改名，加上日期前缀：

```bash
cd ~/practice
for f in *.jpg; do
    mv -i "$f" "$(date +%Y%m%d)-$f"
done
ls
```

### 4. 实战：一键更新系统的脚本

把第七章的更新规矩写成脚本：先拍快照，再更新系统和 AUR，最后清理缓存和检查 `.pacnew`。

```bash
vim ~/.local/bin/sysupdate
```

```bash
#!/usr/bin/env bash
# 一键更新：快照 → 更新 → 清理 → 检查 .pacnew
set -euo pipefail

echo "==> 提醒：更新前看一眼 https://archlinux.org/news/ 有没有需要手动干预的消息"
read -rp "继续更新吗？[y/N] " answer
if [ "$answer" != "y" ]; then
    echo "已取消。"
    exit 0
fi

echo "==> 拍摄快照"
sudo snapper -c root create -d "sysupdate $(date '+%F %T')"

echo "==> 更新官方仓库和 AUR"
paru -Syu

echo "==> 清理软件包缓存（每个包保留最近 3 个版本）"
sudo paccache -r

orphans=$(pacman -Qdtq || true)
if [ -n "$orphans" ]; then
    echo "==> 发现孤儿包，可以确认后用 sudo pacman -Rns \$(pacman -Qdtq) 卸载："
    echo "$orphans"
fi

pacnew=$(pacdiff -o || true)
if [ -n "$pacnew" ]; then
    echo "==> 发现 .pacnew 文件，记得手动合并："
    echo "$pacnew"
fi

echo "==> 更新完成。如果内核或显卡驱动有更新，建议重启。"
```

```bash
chmod +x ~/.local/bin/sysupdate
sysupdate
```

几个新东西：

- `set -euo pipefail`：一行"安全带"。`-e` 任何命令出错就立即退出脚本，不会带着错误继续往下执行；`-u` 使用未定义的变量时报错；`-o pipefail` 管道中任何一段出错都算出错。**建议每个脚本都加上。**
- `read -rp "提示" 变量`：读取用户输入，存进变量。
- `|| true`：`pacman -Qdtq` 在没有孤儿包时会返回"失败"，在 `set -e` 下会导致脚本直接退出，加上 `|| true` 表示"失败了也没关系"。
- 脚本里**没有**自动卸载孤儿包，而是只列出来让你确认。自动化脚本里，删除类的操作最好留给人来判断。

运行这个脚本需要第七章装的 `pacman-contrib`（提供 `paccache` 和 `pacdiff`）。

### 5. 写脚本的几条好习惯

1. 第一行写 shebang，第二行加上 `set -euo pipefail`。
2. 变量引用一律加双引号：`"$var"`。
3. 先在终端里把每条命令单独跑通，再写进脚本。
4. 脚本里有 `rm`、`mv` 之类的操作时，先用 `echo` 代替跑一遍，看看实际会执行什么。
5. 用 `shellcheck` 检查脚本里的常见错误：`sudo pacman -S shellcheck`，然后 `shellcheck 脚本文件`。它会指出没加引号的变量之类的问题，并给出修改建议，是学写脚本的好老师。

## 十七、新手常见坑和好习惯

### 1. 绝对不要乱执行的命令

网上（尤其是一些"整蛊"帖子）偶尔会出现这些命令，**看到就跳过**：

| 命令特征 | 后果 |
| --- | --- |
| `rm -rf /`、`rm -rf ~`、`rm -rf /*` | 删除整个系统 / 家目录 |
| `dd if=... of=/dev/sda`、`of=/dev/nvme0n1` | 直接覆写整块硬盘，数据全毁 |
| `mkfs.xxx /dev/...` | 格式化分区 |
| `chmod -R 777 /`、`chown -R ... /` | 把整个系统的权限弄乱，系统基本报废 |
| `:(){ :\|:& };:` | "Fork 炸弹"，无限创建进程直到系统卡死 |
| `curl 某网址 \| sudo bash` | 下载并以 root 身份直接执行一个你没看过的脚本 |

最后一种在一些正经软件的安装说明里也会出现。安全的做法是先把脚本下载下来，看一遍内容，确认没问题再执行；对 Arch 用户来说，更好的做法是先查查官方仓库和 AUR 里有没有这个软件。

### 2. 常见报错和对应原因

| 报错 | 常见原因 | 怎么办 |
| --- | --- | --- |
| `command not found` | 没装这个软件，或者命令拼错了，或者不在 PATH 里 | 检查拼写；`pacman -F 命令名` 查是哪个包提供的 |
| `Permission denied` | 没有权限，或者脚本没有执行权限 | 系统文件加 `sudo`；脚本用 `chmod +x`；家目录里的文件检查所有者 |
| `No such file or directory` | 路径写错了，或者当前目录不对 | `pwd` 看看自己在哪；用 `Tab` 补全路径 |
| `Is a directory` | 对目录用了只能处理文件的命令 | 比如 `cp` / `rm` 目录要加 `-r` |
| `Device or resource busy` | 文件或分区正在被使用 | 比如卸载 U 盘时，先 `cd` 离开 U 盘的目录 |
| `/bin/bash^M: bad interpreter` | 脚本是在 Windows 上编辑的，换行符是 CRLF | `sed -i 's/\r$//' 脚本文件` 转换成 Linux 的 LF 换行 |
| `error: failed to commit transaction (conflicting files)` | pacman 发现要安装的文件已经存在 | 通常是以前用非 pacman 方式装过同名软件，先搞清楚那个文件是哪来的 |
| `unable to lock database` | 有另一个 pacman 正在运行，或者上次被强行中断 | 确认没有 pacman 在运行后，`sudo rm /var/lib/pacman/db.lck` |

### 3. 好习惯清单

1. **执行前先想一下这条命令会改什么**，特别是带 `sudo`、`rm`、`>` 的命令。
2. **多用 `Tab` 补全**，少打字，少出错。
3. **改系统配置文件前先备份**：`sudo cp /etc/某文件 /etc/某文件.bak`。改坏了可以恢复。
4. **改系统前拍快照**：`sudo snapper -c root create -d "改了什么"`。
5. **报错信息要读完**。很多时候答案就写在报错里，比如"did you mean ...?"或者"try running with sudo"。
6. **复制报错原文去搜索**，不要自己概括。把报错里属于你个人的部分（用户名、路径）去掉再搜，效果更好。
7. **记笔记**。解决了一个问题，把命令和原因记下来，下次遇到就不用再查了。这个博客就是这么来的。

## 十八、速查表

### 文件和目录

| 命令 | 作用 |
| --- | --- |
| `pwd` | 显示当前目录 |
| `cd 目录` / `cd` / `cd -` / `cd ..` | 切换目录 / 回家目录 / 回上次目录 / 上一级 |
| `ls -lah` | 列出所有文件的详细信息 |
| `mkdir -p a/b/c` | 创建多层目录 |
| `touch 文件` | 创建空文件 |
| `cp -r 源 目标` | 复制（目录加 `-r`） |
| `mv 源 目标` | 移动 / 重命名 |
| `rm -r 目标` | 删除（不可恢复！） |
| `ln -s 原文件 链接名` | 创建软链接 |
| `cat` / `less` / `head` / `tail -f` | 查看文件 |
| `find 目录 -name "模式"` | 按名字找文件 |
| `grep -rn "内容" 目录` | 按内容找文件 |

### 权限和用户

| 命令 | 作用 |
| --- | --- |
| `sudo 命令` | 以 root 身份执行 |
| `chmod +x 文件` / `chmod 644 文件` | 修改权限 |
| `sudo chown 用户:组 文件` | 修改所有者 |
| `id` / `groups` | 查看自己的用户和组 |
| `sudo usermod -aG 组 用户` | 把用户加入组（不能漏 `-a`） |

### 软件包（Arch）

| 命令 | 作用 |
| --- | --- |
| `sudo pacman -Syu` | 更新系统 |
| `sudo pacman -S 包` | 安装 |
| `sudo pacman -Rns 包` | 卸载 |
| `pacman -Ss 关键词` | 搜索 |
| `pacman -Qi 包` / `pacman -Ql 包` | 查看信息 / 安装的文件 |
| `pacman -Qo 文件` | 文件属于哪个包 |
| `paru -S 包` | 从 AUR 安装 |

### 进程、服务、日志

| 命令 | 作用 |
| --- | --- |
| `htop` | 实时查看进程 |
| `pgrep -a 名字` | 查找进程 |
| `kill PID` / `kill -9 PID` / `pkill 名字` | 结束进程 |
| `Ctrl + Z`、`bg`、`fg`、`jobs` | 前后台任务 |
| `systemctl status 服务` | 服务状态 |
| `sudo systemctl enable --now 服务` | 开机自启并立即启动 |
| `systemctl --failed` | 失败的服务 |
| `journalctl -b -p err` | 本次开机的错误日志 |
| `journalctl -u 服务 -f` | 实时看某服务的日志 |

### 磁盘、网络、其他

| 命令 | 作用 |
| --- | --- |
| `df -h` / `du -sh 目录` / `ncdu` | 磁盘空间 / 目录大小 / 交互式查看 |
| `free -h` | 内存 |
| `lsblk -f` | 硬盘和分区 |
| `ip a` / `ping` / `ss -tulpn` | IP 地址 / 连通性 / 端口 |
| `ssh 用户@主机` / `scp` / `rsync -avP` | 远程登录 / 传文件 |
| `tar czf 包.tar.gz 目录` / `tar xf 包` | 打包压缩 / 解压 |
| `命令 > 文件` / `>>` / `2>&1` / `\|` | 重定向 / 追加 / 合并错误输出 / 管道 |
| `echo $PATH` / `export 变量=值` | 环境变量 |
| `source ~/.zshrc` | 重新加载 Shell 配置 |

练习完之后，可以把练习目录删掉：

```bash
rm -r ~/practice
```

## 结语

到这里，你已经掌握了：

1. 看懂任何一条命令的结构，会用 `--help`、`man`、`tldr` 和 ArchWiki 自己查；
2. 在目录树里自如地移动，创建、复制、移动、删除文件，并且知道 `rm` 的危险；
3. 用 nano 或 vim 修改配置文件；
4. 看懂 `rwxr-xr-x`，知道什么时候该用 `sudo`、什么时候不该用；
5. 用 pacman 正确地维护一个滚动更新的 Arch 系统；
6. 结束卡死的程序，管理开机服务，出了问题去 `journalctl` 里找线索；
7. 用管道把小命令组合成强大的工具；
8. 理解 PATH 和 Shell 配置文件，自定义自己的命令行环境；
9. 处理各种压缩包，查看磁盘和网络状态，用 SSH 管理远程服务器；
10. 写出自己的 Shell 脚本，把重复的工作自动化。

这些足够应付日常使用中绝大多数需要命令行的场景了。剩下的，就在实际使用中遇到一个学一个。**命令行的熟练度不是背出来的，是用出来的**：下次想装软件时，别打开商店，打开终端试试吧。

## 参考资料

- [ArchWiki：General recommendations](https://wiki.archlinux.org/title/General_recommendations)（装好系统后的推荐阅读清单）
- [ArchWiki：pacman](https://wiki.archlinux.org/title/Pacman)、[System maintenance](https://wiki.archlinux.org/title/System_maintenance)
- [ArchWiki：Users and groups](https://wiki.archlinux.org/title/Users_and_groups)、[File permissions and attributes](https://wiki.archlinux.org/title/File_permissions_and_attributes)
- [ArchWiki：systemd](https://wiki.archlinux.org/title/Systemd)、[systemd/Journal](https://wiki.archlinux.org/title/Systemd/Journal)
- [ArchWiki：OpenSSH](https://wiki.archlinux.org/title/OpenSSH)
- [GNU Bash 手册](https://www.gnu.org/software/bash/manual/)
- [The Linux Command Line](https://linuxcommand.org/tlcl.php)（William Shotts 著，可免费在线阅读，系统学习命令行的经典入门书）
- [tldr pages](https://tldr.sh/)
- [ShellCheck](https://www.shellcheck.net/)
- [explainshell.com](https://explainshell.com/)（粘贴一条命令，逐段解释每部分的含义）
