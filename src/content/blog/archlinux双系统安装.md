---
title: 没有 U 盘也能装：Arch Linux + Windows 11 双系统保姆级教程（KDE Plasma + Btrfs 快照）
description: 不用 U 盘，把安装镜像放进硬盘分区直接启动，在第二块固态上给 Arch Linux 划出 300G，保留 Windows 11，装好 KDE Plasma、NVIDIA 驱动、中文输入法和可回滚的 Btrfs 快照。
pubDate: 2026-11-10
tags: [Linux, ArchLinux, 双系统]
---

> 【风险提示】分区操作有丢数据的可能。动手前请把 F 盘里重要的东西备份到网盘或别的设备上。本文基于 2026 年 11 月的 Arch Linux 官方安装镜像（2026.11.01，内核 7.2.11）和 ArchWiki 编写，后续版本命令可能有细微变化，以 [ArchWiki](https://wiki.archlinux.org/title/Installation_guide) 为准。

这篇文章是我给自己的笔记本装双系统时整理的。手头没有 U 盘，所以用的是一个不太常见但官方支持的办法：**把安装镜像的内容复制进硬盘上一个单独的小分区，直接从硬盘启动安装环境。**

## 零、先看看我的电脑和最终规划

### 1. 电脑配置

| 项目 | 配置 | 对安装的影响 |
| --- | --- | --- |
| 型号 | 雷神 911X | BIOS 为 AMI |
| CPU | Intel i5-12450H | 装 `intel-ucode` 微码 |
| 内存 | 16G | 用 zram 当交换空间，不建 swap 分区 |
| 显卡 | Intel UHD 核显 + RTX 4060 Laptop | 混合显卡，NVIDIA 装 `nvidia-open` |
| 无线网卡 | Intel Wireless-AC 9462 | Linux 内核自带驱动，安装环境里能直接连 WiFi |
| 硬盘 0 | 512G NVMe：Windows 引导分区（300M）+ C 盘 + 恢复分区 | **完全不动** |
| 硬盘 1 | 1TB NVMe（KIOXIA）：只有一个 F 盘 | 从这里压缩出 300G 给 Linux |

两块硬盘这一点非常重要：Windows 的系统和引导都在硬盘 0 上，Linux 全部装在硬盘 1 上，两边互不干扰。哪天不想要 Linux 了，删掉硬盘 1 上的几个分区就行，Windows 毫发无损。

> Windows 自带的 EFI 引导分区只有 300M，放了 Windows 的引导文件后剩余空间很少，所以我们**不往里面塞东西**，而是在硬盘 1 上给 Linux 单独建一个 EFI 分区。

### 2. 为什么是 300G

F 盘一共 931G，已用约 321G。分 500G 的话 F 盘只剩 100 多 G 空闲，有点紧。

Arch 本体加 KDE 桌面不到 15G，日常开发、装几个 Steam 游戏，300G 完全够用。Btrfs 的快照会占一些空间，但它只记录变化的部分，通常也就几十 G。以后真的不够了，Linux 里还可以直接读写 F 盘。

### 3. 最终分区规划（硬盘 1）

| 分区 | 大小 | 格式 | 用途 |
| --- | --- | --- | --- |
| 原有 MSR 分区 | 16M | — | Windows 保留，不动 |
| F 盘 | 约 631G | NTFS | 原来的 F 盘，压缩后剩下的部分 |
| ARCH_202611 | 2G | FAT32 | **硬盘里的"安装 U 盘"**，装完保留当救援系统 |
| Linux EFI 分区 | 1G | FAT32 | 放 GRUB 引导，挂载到 `/efi` |
| Linux 根分区 | 约 297G | Btrfs | 系统、软件、个人文件全在这里 |

## 一、在 Windows 里做准备

### 1. 检查 BitLocker，备份恢复密钥

后面要关闭"安全启动"。如果你的 C 盘开了 BitLocker（或者 Windows 11 的"设备加密"），关闭安全启动后再进 Windows，**会被要求输入 48 位恢复密钥**，没有它就进不去系统。

用**管理员身份**打开 PowerShell，运行：

```powershell
manage-bde -status
```

- 如果看到"保护状态：保护关闭"或"完全解密"，说明没加密，跳过这一步。
- 如果显示"保护打开"，去 [Microsoft 账户恢复密钥页面](https://account.microsoft.com/devices/recoverykey) 确认能看到你这台电脑的密钥，**抄到纸上或拍照存手机**。也可以在"设置 → 隐私和安全性 → 设备加密"里临时关闭加密。

### 2. 确认快速启动已关闭

Windows 的"快速启动"会让 F 盘处于半休眠状态，Linux 挂载它可能只能读不能写，甚至损坏数据。

打开"控制面板 → 硬件和声音 → 电源选项 → 选择电源按钮的功能 → 更改当前不可用的设置"，**取消勾选"启用快速启动"**。我这台电脑检测下来已经是关闭状态，你检查一下就行。

### 3. 下载安装镜像并校验

到清华镜像站下载镜像（国内速度快）：

```text
https://mirrors.tuna.tsinghua.edu.cn/archlinux/iso/latest/
```

下载 `archlinux-2026.11.01-x86_64.iso`（约 1.2G）。如果月份变了，文件名里的日期也会变，**后文所有 `202611` 都换成你下载的那个年月**。

下载完一定要校验，防止文件损坏。打开 PowerShell，进入下载目录：

```powershell
Get-FileHash .\archlinux-2026.11.01-x86_64.iso -Algorithm SHA256
```

把输出的哈希值，和 [Arch 官网下载页](https://archlinux.org/download/) 上 "SHA256" 那一栏比对，**一个字符都不能差**。注意要和官网比，不要和镜像站上的文件比。

### 4. 压缩 F 盘，腾出 300G

1. 按 `Win + X`，选"磁盘管理"。
2. 右键 F 盘，选"压缩卷"。
3. "输入压缩空间量"填 **307200**（单位是 MB，300 × 1024 = 307200），点"压缩"。

完成后，F 盘右边会出现一块约 300G 的黑色"未分配"区域。

> 如果提示能压缩的空间不够，通常是 F 盘末尾有不能移动的文件。可以先对 F 盘做一次"优化"（右键 F 盘 → 属性 → 工具 → 优化），再试。

**不要把这块未分配空间直接建成分区**，Linux 的分区等会在安装环境里建。我们只先从里面拿 2G 出来。

### 5. 做一个"硬盘里的安装盘"

这是本文不用 U 盘的关键。ArchWiki 写得很清楚：在 UEFI 电脑上，**只要把 ISO 里的文件解压到一个 FAT32 分区里，就能直接启动**，而且这个分区可以只是硬盘上的一个分区，不影响其他分区。

1. 在磁盘管理里，右键刚才的"未分配"区域，选"新建简单卷"。
2. 大小填 **2048**（MB）。
3. 分配一个盘符，比如 `G:`。
4. 文件系统选 **FAT32**，卷标填 **`ARCH_202611`**，勾选"执行快速格式化"，完成。

> 卷标写成 `ARCH_年月` 是为了保险：Arch 安装环境启动时要找到自己所在的分区，ArchWiki 的排错部分专门提到，找不到时把卷标改成 `ARCH_202611` 就能解决。FAT32 卷标最多 11 个字符，`ARCH_202611` 正好 11 个。

5. 双击下载好的 ISO 文件，Windows 会把它挂载成一个虚拟光驱。
6. 打开这个光驱，**`Ctrl + A` 全选所有文件和文件夹，复制到 `G:` 盘**。
7. 复制完，右键虚拟光驱，选"弹出"。

复制完成后，`G:` 盘根目录下应该能看到 `arch`、`boot`、`EFI`、`loader` 这几个文件夹。

现在磁盘管理里硬盘 1 的样子应该是：F 盘 → 2G 的 ARCH_202611 → 约 298G 未分配。

### 6.（可选）解决双系统时间差 8 小时

Windows 默认把主板时间当作本地时间，Linux 默认当作 UTC 时间。不处理的话，从 Linux 切回 Windows 时钟会慢 8 小时。

推荐让 Windows 也改用 UTC。用**管理员身份**打开命令提示符：

```bat
reg add "HKLM\System\CurrentControlSet\Control\TimeZoneInformation" /v RealTimeIsUniversal /d 1 /t REG_DWORD /f
```

改完重启一次，然后在 Windows 设置里点一下"立即同步时间"。

## 二、BIOS 设置并启动安装环境

### 1. 关闭安全启动

Arch 官方安装镜像**不支持安全启动**（Secure Boot），必须先关掉。我检测到这台电脑目前是开启状态。

1. 重启，开机出现雷神 Logo 时连按 **`F2`** 进入 BIOS（雷神笔记本一般是 F2，以你屏幕上的提示为准）。
2. 找到 `Security` 或 `Boot` 菜单下的 **Secure Boot**，改成 **Disabled**。
3. 按 `F10` 保存并退出。

关闭安全启动对 Windows 11 日常使用没有影响。装好 Arch 之后如果想重新开启，可以用 `sbctl` 给自己的系统签名，这是进阶玩法，本文不展开。

### 2. 从硬盘里的安装盘启动

1. 重启，开机时连按 **`F7`**（雷神部分机型是 `F12`，以实际为准）打开启动菜单。
2. 选择 KIOXIA 硬盘对应的 **UEFI 启动项**。它的名字可能是 `UEFI OS (KIOXIA-EXCERIA PLUS G3 SSD)`、`ARCH_202611` 或者只显示硬盘型号，总之**不是 Windows Boot Manager** 的那个。
3. 进入黑底的 Arch 启动菜单后，选第一项 `Arch Linux install medium (x86_64, UEFI)`，回车。

等一会儿，看到 `root@archiso ~ #` 提示符，就进入安装环境了。

#### 启动菜单里找不到这个分区怎么办

有些主板只认"EFI 系统分区"类型的分区。回到 Windows，用**管理员身份**打开命令提示符，把 2G 分区的类型改成 EFI 系统分区：

```bat
diskpart
list disk
select disk 1
list partition
```

在列表里找到大小为 2048 MB 的那个分区，记下编号（下面假设是 3）：

```bat
select partition 3
set id=c12a7328-f81f-11d2-ba4b-00a0c93ec93b
exit
```

> `select disk 1` 之前务必用 `list disk` 确认 1 号盘是那块约 931G 的盘。改完后这个分区的盘符会消失，属于正常现象，文件都还在。

再重启按 F7 试一次。

## 三、安装环境里的基础准备

> 从这一步开始，所有命令都在 Arch 安装环境的命令行里输入。`#` 开头的提示符代表你是 root 用户，不需要加 `sudo`。

### 1. 字体太小就放大

```bash
setfont ter-132b
```

### 2. 确认是 UEFI 模式启动

```bash
cat /sys/firmware/efi/fw_platform_size
```

输出 `64` 就对了。如果提示文件不存在，说明是以传统 BIOS 模式启动的，回到启动菜单重新选带 `UEFI` 字样的那项。

### 3. 连接 WiFi

插网线的话直接跳过这一步。用无线的话：

```bash
iwctl
```

进入 `[iwd]#` 交互界面后，依次输入：

```text
device list
station wlan0 scan
station wlan0 get-networks
station wlan0 connect "你的WiFi名称"
```

输入 WiFi 密码，然后 `exit` 退出。如果 `device list` 里网卡名不是 `wlan0`，就把后面的 `wlan0` 换成实际的名字。

测试网络：

```bash
ping -c 3 mirrors.tuna.tsinghua.edu.cn
```

能看到回复就说明连上了，按 `Ctrl + C` 也能停止。

### 4. 确认时间同步

```bash
timedatectl
```

看到 `System clock synchronized: yes` 即可。时间不对会导致下载软件包时签名校验失败。

### 5. 换成国内镜像源

安装环境启动后会自动运行 `reflector` 更新镜像列表，可能会把我们改的列表覆盖掉，所以先停掉它：

```bash
systemctl stop reflector.service
```

然后把镜像列表改成国内源：

```bash
cat > /etc/pacman.d/mirrorlist << 'EOF'
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinux/$repo/os/$arch
Server = https://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch
Server = https://mirrors.aliyun.com/archlinux/$repo/os/$arch
EOF
```

这个文件之后会被自动复制到新系统里。

## 四、分区：最需要小心的一步

### 1. 认准硬盘

```bash
lsblk -o NAME,SIZE,MODEL,FSTYPE,LABEL
```

你会看到两块 NVMe 硬盘，名字是 `nvme0n1` 和 `nvme1n1`，**但哪个是哪个不一定和 Windows 里的编号对应**，要看型号和大小来认：

- 型号带 `KIOXIA`、大小约 `931.5G`、下面有 NTFS 格式的 F 盘和 `ARCH_202611` 分区的，就是我们要装 Linux 的盘。
- 另一块约 `476.9G` 的是 Windows 系统盘，**不要碰**。

下文假设 KIOXIA 是 **`nvme1n1`**。如果你这里是 `nvme0n1`，**后面所有命令里的 `nvme1n1` 都要换掉**。

大概会是这样（示意）：

```text
NAME          SIZE MODEL                       FSTYPE LABEL
nvme1n1     931.5G KIOXIA-EXCERIA PLUS G3 SSD
├─nvme1n1p1    16M
├─nvme1n1p2 631.5G                             ntfs   新加卷
└─nvme1n1p3     2G                             vfat   ARCH_202611
nvme0n1     476.9G KPEGYJTBX4M512BCGC
├─nvme0n1p1   300M                             vfat
...
```

### 2. 用 cfdisk 建分区

```bash
cfdisk /dev/nvme1n1
```

cfdisk 是带界面的分区工具，用方向键选择，回车确认。

1. 用上下键选中最下面那行 **`Free space`**（约 298G）。**不要选到 F 盘或 2G 那个分区。**
2. 选择底部的 `[ New ]`，大小输入 `1G`，回车。
3. 保持选中这个新分区，选择 `[ Type ]`，在列表里找到 **`EFI System`**，回车。
4. 再选中剩下的 `Free space`，选择 `[ New ]`，大小直接回车（用掉全部剩余空间）。
5. 选择 `[ Type ]`，找到 **`Linux root (x86-64)`**，回车。
6. 选择 `[ Write ]`，输入 `yes` 回车，再选 `[ Quit ]` 退出。

> **再强调一次：整个过程只在 Free space 里新建分区，不要对 F 盘、MSR、ARCH_202611 这三个已有分区做任何删除或修改。**

再运行一次 `lsblk`，应该多出了两个分区：

- `nvme1n1p4`：1G，EFI 分区
- `nvme1n1p5`：约 297G，根分区

为了少打字、少出错，先把它们存成变量（**这两个变量只在这次登录有效**）：

```bash
ESP=/dev/nvme1n1p4
ROOT=/dev/nvme1n1p5
```

## 五、格式化并建立 Btrfs 子卷

### 1. 格式化

```bash
mkfs.fat -F 32 -n LINUXEFI $ESP
mkfs.btrfs -L ArchLinux $ROOT
```

### 2. 为什么要分子卷

Btrfs 的"子卷"可以理解为一个分区里的多个独立区域。我们把它们分开，是为了**做系统快照时只拍系统本身，不把日志、软件包缓存、个人文件一起拍进去**。这样回滚系统时，你 home 目录里新写的文件不会跟着丢。

| 子卷 | 挂载到 | 说明 |
| --- | --- | --- |
| `@` | `/` | 系统本体，快照和回滚的对象 |
| `@home` | `/home` | 个人文件，回滚系统时不受影响 |
| `@log` | `/var/log` | 日志，回滚后还能查看出问题时的日志 |
| `@pkg` | `/var/cache/pacman/pkg` | 软件包缓存，不需要拍进快照 |
| `@snapshots` | `/.snapshots` | 存放快照本身 |

### 3. 创建子卷

```bash
mount $ROOT /mnt
btrfs subvolume create /mnt/@
btrfs subvolume create /mnt/@home
btrfs subvolume create /mnt/@log
btrfs subvolume create /mnt/@pkg
btrfs subvolume create /mnt/@snapshots
umount /mnt
```

### 4. 挂载

`noatime` 减少不必要的写入，`compress=zstd` 开启透明压缩，能省不少空间，在 NVMe 上几乎没有性能损失。

```bash
OPTS=noatime,compress=zstd
mount -o $OPTS,subvol=@ $ROOT /mnt
mount --mkdir -o $OPTS,subvol=@home $ROOT /mnt/home
mount --mkdir -o $OPTS,subvol=@log $ROOT /mnt/var/log
mount --mkdir -o $OPTS,subvol=@pkg $ROOT /mnt/var/cache/pacman/pkg
mount --mkdir -o $OPTS,subvol=@snapshots $ROOT /mnt/.snapshots
mount --mkdir $ESP /mnt/efi
```

> 注意 EFI 分区挂在 **`/efi`** 而不是 `/boot`。这样内核和启动镜像会放在 Btrfs 里的 `/boot`，**拍快照时内核也一起拍进去**。回滚系统时内核和驱动模块版本始终匹配，不会出现"回滚后开不了机"的情况。

检查一下：

```bash
lsblk -o NAME,SIZE,MOUNTPOINTS
```

`nvme1n1p5` 后面应该列出 `/mnt`、`/mnt/home` 等 5 个挂载点，`nvme1n1p4` 后面是 `/mnt/efi`。

## 六、安装基本系统

### 1. pacstrap 安装软件包

```bash
pacstrap -K /mnt base base-devel linux linux-firmware intel-ucode sof-firmware \
  btrfs-progs ntfs-3g networkmanager grub efibootmgr os-prober \
  sudo vim man-db man-pages texinfo zram-generator
```

各个包的作用：

| 软件包 | 作用 |
| --- | --- |
| `base` `linux` `linux-firmware` | 系统基础、内核、硬件固件 |
| `base-devel` | 编译工具，之后装 AUR 软件要用 |
| `intel-ucode` | Intel CPU 微码，修复硬件漏洞 |
| `sof-firmware` | 笔记本板载声卡固件，没有它可能没声音 |
| `btrfs-progs` | Btrfs 管理工具 |
| `ntfs-3g` | NTFS 工具，方便修复 F 盘 |
| `networkmanager` | 装好后联网用，**不装重启后就没网了** |
| `grub` `efibootmgr` `os-prober` | 引导程序，以及识别 Windows 的工具 |
| `sudo` `vim` | 权限管理、文本编辑器（新系统里默认没有任何编辑器，一定要装） |
| `zram-generator` | 用内存压缩做交换空间 |

国内源下载大约几分钟。如果中途报 `signature is unknown trust` 或 `invalid or corrupted package`，先更新密钥环再重新运行上面的命令：

```bash
pacman -Sy archlinux-keyring
```

### 2. 生成 fstab

fstab 告诉系统开机时要挂载哪些分区。

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

genfstab 会给每个 Btrfs 子卷同时写上 `subvol=@xxx` 和 `subvolid=数字`。后面回滚系统时，我们会用新的子卷替换 `@`，它的编号会变，所以**要把 `subvolid` 删掉，只按名字挂载**：

```bash
sed -i 's/subvolid=[0-9]*,//g' /mnt/etc/fstab
cat /mnt/etc/fstab
```

检查输出：应该有 5 行 btrfs（分别对应 `/`、`/home`、`/var/log`、`/var/cache/pacman/pkg`、`/.snapshots`），1 行 vfat（`/efi`），每行都带 `subvol=` 而不再有 `subvolid=`。

### 3. 进入新系统

```bash
arch-chroot -S /mnt
```

提示符变成 `[root@archiso /]#`，表示你现在操作的是新装好的系统。

## 七、系统基础配置

### 1. 时区和时间

```bash
ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
hwclock --systohc
systemctl enable systemd-timesyncd
```

### 2. 语言

> **关于编辑文件**：安装过程中要改好几个配置文件，本文统一用 vim。安装环境和新系统里都有 vim（新系统里的是 pacstrap 时装的）。下面几个操作就够用了：
>
> | 操作 | 按键 |
> | --- | --- |
> | 搜索 | 普通模式下输入 `/关键词` 回车，`n` 跳到下一个 |
> | 删除光标处的字符（比如行首的 `#`） | `x` |
> | 进入插入模式 / 回到普通模式 | `i` / `Esc` |
> | 在文件末尾新开一行 | `G` 然后 `o` |
> | 保存并退出 / 不保存退出 | `:wq` / `:q!` |
>
> 后文说"删掉行首的 `#`"，就是搜到那一行、按 `0` 回到行首、按 `x`。

```bash
vim /etc/locale.gen
```

找到下面两行，删掉行首的 `#`：

```text
en_US.UTF-8 UTF-8
zh_CN.UTF-8 UTF-8
```

具体操作：输入 `/^#en_US.UTF-8` 回车，按 `x`；再输入 `/^#zh_CN.UTF-8` 回车，按 `x`；最后 `:wq` 保存退出。然后生成：

```bash
locale-gen
echo 'LANG=en_US.UTF-8' > /etc/locale.conf
```

> 系统语言先设成英文，因为黑底的命令行界面显示不了中文，会变成一堆方块。装好桌面之后，在 KDE 的系统设置里再改成中文。

### 3. 主机名

名字随意，只能用小写字母、数字和横线：

```bash
echo 'arch-911x' > /etc/hostname
```

### 4. root 密码和日常用户

```bash
passwd
```

输入两次 root 密码（输入时屏幕上不显示，正常）。

建一个日常用的账户，把 `yourname` 换成你的用户名：

```bash
useradd -m -G wheel yourname
passwd yourname
```

允许 `wheel` 组的用户使用 sudo：

```bash
EDITOR=vim visudo
```

找到这一行，删掉开头的 `# `（井号和后面的空格）：

```text
%wheel ALL=(ALL:ALL) ALL
```

具体操作：输入 `/^# %wheel ALL=(ALL:ALL) ALL$` 回车，按两次 `x`，然后 `:wq`。注意不要改成下面那行带 `NOPASSWD` 的，那个是"sudo 不用输密码"，不安全。

> visudo 保存时会检查语法，如果提示 `What now?`，说明改错了，输入 `e` 回去重新编辑。

### 5. 开启网络服务

```bash
systemctl enable NetworkManager
```

### 6. 配置 zram 交换空间

zram 在内存里划出一块压缩区域当交换空间，比在硬盘上建 swap 分区快得多。16G 内存分一半给它就够了：

```bash
cat > /etc/systemd/zram-generator.conf << 'EOF'
[zram0]
zram-size = ram / 2
compression-algorithm = zstd
EOF
```

## 八、安装 GRUB 引导

### 1. 安装到 EFI 分区

```bash
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
```

看到 `Installation finished. No error reported.` 就成功了。

### 2. 让 GRUB 识别 Windows

```bash
vim /etc/default/grub
```

修改或添加这几行：

```text
GRUB_TIMEOUT=10
GRUB_DISABLE_OS_PROBER=false
```

- `GRUB_TIMEOUT=10`：开机菜单等待 10 秒，给你时间选系统。
- `GRUB_DISABLE_OS_PROBER=false`：这一行原本被注释掉了，删掉 `#` 打开它，GRUB 才会去找 Windows。

vim 操作：输入 `/GRUB_TIMEOUT=` 回车，按 `$` 跳到行尾，按 `x` 删掉原来的 `5`，按 `a` 输入 `10`，按 `Esc`；再输入 `/#GRUB_DISABLE_OS_PROBER` 回车，按 `x` 删掉 `#`；最后 `:wq`。

生成配置：

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

输出里应该能看到这几行：

```text
Found linux image: /boot/vmlinuz-linux
Found initrd image: /boot/intel-ucode.img /boot/initramfs-linux.img
Found Windows Boot Manager on /dev/nvme0n1p1@/EFI/Microsoft/Boot/bootmgfw.efi
```

> 如果在 chroot 里没有出现 `Found Windows Boot Manager` 也不要紧，有时候是 chroot 环境的限制。重启进入新系统后，再运行一次 `sudo grub-mkconfig -o /boot/grub/grub.cfg` 通常就能找到。

### 3. 退出并重启

```bash
exit
umount -R /mnt
reboot
```

重启时进 BIOS（F2），在 `Boot` 菜单里把 **GRUB** 调到第一位，保存退出。以后每次开机都会出现 GRUB 菜单，可以选 Arch Linux 或 Windows Boot Manager。

## 九、重启之后：桌面、驱动、中文

在 GRUB 菜单里选 `Arch Linux`，用刚才创建的普通用户登录（不是 root）。下面的命令都要加 `sudo`。

### 1. 联网

用 NetworkManager 连 WiFi：

```bash
nmcli device wifi list
nmcli device wifi connect "你的WiFi名称" password "你的WiFi密码"
```

### 2. 开启 multilib 仓库

NVIDIA 的 32 位库和 Steam 都在 multilib 仓库里，默认是关着的。

```bash
sudo vim /etc/pacman.conf
```

找到下面两行，删掉开头的 `#`：

```text
[multilib]
Include = /etc/pacman.d/mirrorlist
```

顺便把 `#Color` 前面的 `#` 也删了，pacman 的输出会变成彩色。

vim 操作：输入 `/^#\[multilib\]` 回车，按 `x`；按 `j` 下移一行、`0` 回到行首、`x`；再输入 `/^#Color` 回车，按 `x`；最后 `:wq`。注意上面还有一个 `[multilib-testing]`（测试仓库），**不要打开它**。

然后更新一次系统：

```bash
sudo pacman -Syu
```

### 3. 安装 KDE Plasma 桌面

```bash
sudo pacman -S plasma-meta konsole dolphin kate ark spectacle gwenview okular \
  pipewire pipewire-pulse pipewire-alsa wireplumber
sudo systemctl enable plasmalogin.service
```

| 软件包 | 作用 |
| --- | --- |
| `plasma-meta` | KDE Plasma 桌面本体，包含登录管理器、系统设置、网络/蓝牙/音量托盘等 |
| `konsole` | 终端 |
| `dolphin` | 文件管理器 |
| `kate` | 图形界面的文本编辑器 |
| `ark` | 压缩包管理 |
| `spectacle` | 截图工具（快捷键 `Print`） |
| `gwenview` `okular` | 看图、看 PDF |
| `pipewire` 等 | 声音系统 |

> `plasma-meta` 只包含桌面本身，**不包含终端和文件管理器**，所以要单独装 `konsole` 和 `dolphin`，不然进了桌面连个终端都打不开。

安装过程中 pacman 可能会问你某个依赖选哪个提供者（比如 `qt6-multimedia-backend`），直接回车用默认值就行。

KDE 现在默认的登录管理器是 **Plasma Login Manager**（软件包 `plasma-login-manager`，已经包含在 `plasma-meta` 里），它的服务名是 `plasmalogin.service`。网上很多老教程写的是 `sddm`，那是之前的默认选择，现在不需要再装。

蓝牙需要再开一下服务：

```bash
sudo pacman -S bluez bluez-utils
sudo systemctl enable bluetooth
```

### 4. 显卡驱动（Intel 核显 + RTX 4060）

这台电脑是混合显卡：平时桌面跑在 Intel 核显上省电，打游戏、跑 CUDA 时再调用 NVIDIA 独显。

根据 ArchWiki 当前的说明，RTX 40 系（Ada Lovelace 架构）推荐用 **`nvidia-open`**（NVIDIA 官方开源内核模块），它是为官方 `linux` 内核预编译好的，不需要 DKMS。

```bash
sudo pacman -S mesa lib32-mesa vulkan-intel lib32-vulkan-intel intel-media-driver \
  nvidia-open nvidia-utils lib32-nvidia-utils nvidia-settings nvidia-prime
```

| 软件包 | 作用 |
| --- | --- |
| `mesa` `vulkan-intel` | Intel 核显的 OpenGL 和 Vulkan 驱动 |
| `intel-media-driver` | Intel 视频硬件解码，看视频更省电 |
| `nvidia-open` `nvidia-utils` | NVIDIA 驱动 |
| `lib32-*` | 32 位库，Steam 和很多游戏需要 |
| `nvidia-prime` | 提供 `prime-run` 命令，指定程序用独显运行 |

开启 NVIDIA 的睡眠相关服务，避免合盖睡眠唤醒后花屏或黑屏：

```bash
sudo systemctl enable nvidia-suspend.service nvidia-hibernate.service nvidia-resume.service
```

`nvidia-utils` 会自动屏蔽开源的 nouveau 驱动，并默认开启 Wayland 需要的 DRM 模式设置，不用再手动加内核参数。

### 5. 中文字体

```bash
sudo pacman -S noto-fonts noto-fonts-cjk noto-fonts-emoji
```

### 6. 重启进入桌面

```bash
reboot
```

重启后会出现 Plasma 的登录界面，左下角确认会话是 `Plasma (Wayland)`，输入密码进入桌面。

**改成中文界面**：打开"System Settings → Language & Time → Region & Language"，把 Language 改成"简体中文"，点 Apply，注销再登录。

> 建议家目录里的"Desktop""Downloads"等文件夹保持英文名，英文路径在终端里更好打。

**检查显卡驱动**：打开终端，运行：

```bash
nvidia-smi
prime-run glxinfo | grep "OpenGL renderer"
```

第一条能看到 RTX 4060 的信息，第二条输出里有 `NVIDIA GeForce RTX 4060` 就说明独显能正常调用（`glxinfo` 在 `mesa-utils` 包里，没有就先 `sudo pacman -S mesa-utils`）。

想让某个程序用独显运行，在终端里加 `prime-run` 前缀就行，比如 `prime-run blender`。Steam 游戏在游戏属性的"启动选项"里填 `prime-run %command%`。

### 7. 中文输入法（fcitx5）

KDE 下用 fcitx5，和 Plasma 的集成最好：

```bash
sudo pacman -S fcitx5-im fcitx5-chinese-addons
```

`fcitx5-im` 包含输入法框架、配置工具和 Qt/GTK 程序的支持；`fcitx5-chinese-addons` 提供拼音输入法。

然后让 XWayland 下的老程序也能用输入法：

```bash
sudo vim /etc/environment
```

在文件末尾加一行：

```text
XMODIFIERS=@im=fcitx
```

> **不要**再加网上老教程里的 `GTK_IM_MODULE=fcitx` 和 `QT_IM_MODULE=fcitx`。在 KDE 的 Wayland 会话下，输入法由桌面直接接管，加了这两个变量反而可能导致候选框位置不对或者闪烁。

注销重新登录，然后：

1. 打开"系统设置 → 键盘 → 虚拟键盘"，选择 **Fcitx 5**，点应用。
2. 打开"系统设置 → 键盘 → 输入法"（或者右键托盘里的键盘图标 → 配置），点"添加输入法"，搜索并添加 **拼音**。
3. 用 `Ctrl + 空格` 切换中英文，也可以单按 `Shift` 临时切换。

> 想要更全的词库，可以从下文的 archlinuxcn 源安装 `fcitx5-pinyin-zhwiki`（中文维基百科词库）。喜欢 Rime（小狼毫/鼠须管同款）的话，可以装 `fcitx5-rime`。

### 8. 添加 archlinuxcn 源和 AUR 助手

archlinuxcn 是国内社区维护的仓库，里面有很多常用软件的预编译版本（比如 `paru`、各种国产软件），能省去自己编译的时间。

```bash
sudo vim /etc/pacman.conf
```

在文件最后加上：

```text
[archlinuxcn]
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinuxcn/$arch
```

然后安装密钥和 AUR 助手 `paru`：

```bash
sudo pacman -Sy archlinuxcn-keyring
sudo pacman -S paru
```

> 如果安装 `archlinuxcn-keyring` 时报签名错误，先运行 `sudo pacman-key --lsign-key "farseerfc@archlinux.org"` 再重试。

之后装 AUR 里的软件就用 `paru -S 软件名`，用法和 pacman 一样。注意不要用 sudo 运行 paru。

### 9.（可选）在 Linux 里自动挂载 F 盘

先查 F 盘的 UUID：

```bash
lsblk -f
```

找到 `nvme1n1p2`（NTFS 那个）的 UUID，然后：

```bash
sudo mkdir -p /mnt/F
sudo vim /etc/fstab
```

在文件最后加一行（把 UUID 换成你自己的；`uid=1000` 是第一个普通用户的编号，用 `id -u` 可以确认）：

```text
UUID=你的UUID  /mnt/F  ntfs3  defaults,uid=1000,gid=1000,umask=022,nofail  0  0
```

`nofail` 表示万一挂载失败也不影响开机。保存后运行 `sudo mount -a` 测试，没报错就可以在 `/mnt/F` 里看到 F 盘的文件了。

## 十、Btrfs 快照：Arch 新手的后悔药

Arch 是滚动更新，偶尔一次更新会把系统搞坏。有了快照，**每次用 pacman 装软件、更新系统前后都会自动拍一张快照**，出问题时在 GRUB 菜单里选一个以前的快照就能开机，然后一条命令回滚。

我们用三个工具：

| 工具 | 作用 |
| --- | --- |
| `snapper` | 创建和管理快照 |
| `snap-pac` | 每次运行 pacman 前后自动拍快照 |
| `grub-btrfs` | 把快照加进 GRUB 启动菜单 |

### 1. 安装

```bash
sudo pacman -S snapper snap-pac grub-btrfs inotify-tools
```

### 2. 创建 snapper 配置

snapper 创建配置时会自己建一个 `/.snapshots` 子卷，但我们已经有 `@snapshots` 挂在那里了，直接运行会冲突。标准做法是先腾出位置，让它建完再换回我们自己的：

```bash
sudo umount /.snapshots
sudo rm -r /.snapshots
sudo snapper -c root create-config /
sudo btrfs subvolume delete /.snapshots
sudo mkdir /.snapshots
sudo mount -a
sudo chmod 750 /.snapshots
```

运行 `findmnt /.snapshots`，看到它挂的是 `subvol=/@snapshots` 就对了。

### 3. 限制快照数量

不限制的话快照会越积越多。编辑配置：

```bash
sudo vim /etc/snapper/configs/root
```

找到这些项，改成下面的值：

```text
ALLOW_USERS="yourname"
TIMELINE_CREATE="yes"
TIMELINE_LIMIT_HOURLY="5"
TIMELINE_LIMIT_DAILY="7"
TIMELINE_LIMIT_WEEKLY="2"
TIMELINE_LIMIT_MONTHLY="1"
TIMELINE_LIMIT_YEARLY="0"
NUMBER_LIMIT="20"
```

意思是：定时快照保留最近 5 个小时、7 天、2 周、1 个月的；pacman 触发的快照最多保留 20 个。

开启定时快照和自动清理：

```bash
sudo systemctl enable --now snapper-timeline.timer snapper-cleanup.timer
```

### 4. 把快照加进 GRUB 菜单

```bash
sudo systemctl enable --now grub-btrfsd
```

`grub-btrfsd` 会监视 `/.snapshots`，一有新快照就自动更新 GRUB 菜单。

快照默认是只读的，直接从只读快照启动，很多程序会因为写不了文件而报错。grub-btrfs 提供了一个 overlayfs 钩子，让快照启动时"看起来可写"（改动只存在内存里，重启就消失）：

```bash
sudo vim /etc/mkinitcpio.conf
```

找到 `HOOKS=(...)` 这一行。新版 mkinitcpio 默认是基于 systemd 的写法，大致长这样：

```text
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block filesystems fsck)
```

**grub-btrfs 的 overlayfs 钩子和 `systemd` 钩子不兼容**（加上去不会报错，但从快照启动时不生效），所以要换回传统的 `udev` 写法：`systemd` 换成 `udev`，`sd-vconsole` 换成 `keymap consolefont`，最后加上 `grub-btrfs-overlayfs`。改完是这样：

```text
HOOKS=(base udev autodetect microcode modconf kms keyboard keymap consolefont block filesystems fsck grub-btrfs-overlayfs)
```

> 我们没有做磁盘加密，换成 `udev` 不会有任何功能损失。如果你的原始 HOOKS 和上面的默认值不一样，按同样的规则替换就行，不要删掉你自己加的其他钩子。

重新生成启动镜像和 GRUB 配置：

```bash
sudo mkinitcpio -P
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

mkinitcpio 运行时如果出现 `consolefont: no font found` 之类的 WARNING 可以忽略，只要没有 ERROR 就行。

### 5. 试一下

```bash
sudo pacman -S htop
snapper -c root list
```

应该能看到一对 `pre` 和 `post` 快照，描述里写着 `pacman -S htop`。重启后，GRUB 菜单里会多出一项 `Arch Linux snapshots`，进去就能看到这些快照。

### 6. 系统坏了怎么回滚

假设某次更新后系统进不去桌面了：

1. 重启，在 GRUB 里选 `Arch Linux snapshots`，挑一个**出问题之前的快照**启动。
2. 进去确认一切正常后，打开终端，看一下快照编号和根分区：

   ```bash
   snapper -c root list
   lsblk -f
   ```

   假设要恢复的快照编号是 `42`，根分区是 `/dev/nvme1n1p5`。

3. 把整个 Btrfs 分区的顶层挂出来，把坏掉的 `@` 改名，再用快照造一个新的 `@`：

   ```bash
   sudo mount -o subvolid=5 /dev/nvme1n1p5 /mnt
   sudo mv /mnt/@ /mnt/@broken
   sudo btrfs subvolume snapshot /mnt/@snapshots/42/snapshot /mnt/@
   sudo umount /mnt
   reboot
   ```

4. 重启后正常进入系统，就回到了快照时的状态，`/home` 里的个人文件不受影响。确认没问题后，删掉坏掉的旧系统释放空间：

   ```bash
   sudo mount -o subvolid=5 /dev/nvme1n1p5 /mnt
   sudo btrfs subvolume delete /mnt/@broken
   sudo umount /mnt
   ```

> 第 3 步能成功，靠的就是前面在 fstab 里删掉了 `subvolid`，系统只认 `@` 这个名字。如果 `@broken` 里还有嵌套子卷导致删除失败，先用 `sudo btrfs subvolume list /mnt` 看看里面有什么，逐个删掉再删 `@broken`。

想要图形界面管理快照的话，可以装 `btrfs-assistant`（`paru -S btrfs-assistant`）。

## 十一、双系统日常和常见问题

### 1. 开机直接进了 Windows，GRUB 菜单不见了

Windows 大版本更新有时会把自己改回启动顺序的第一位。进 BIOS（F2）把 GRUB 调回第一位即可，也可以在 Linux 里用 `sudo efibootmgr` 查看并调整。

如果 BIOS 里根本没有 GRUB 这一项（个别主板会丢失启动项），从 F7 启动菜单进入 2G 的 ARCH_202611 安装环境，重新挂载并修复：

```bash
mount -o subvol=@ /dev/nvme1n1p5 /mnt
mount /dev/nvme1n1p4 /mnt/efi
arch-chroot -S /mnt
grub-install --target=x86_64-efi --efi-directory=/efi --bootloader-id=GRUB
grub-install --target=x86_64-efi --efi-directory=/efi --removable
grub-mkconfig -o /boot/grub/grub.cfg
exit
reboot
```

第二条 `--removable` 会把 GRUB 额外放到一个所有主板都认的默认位置，作为保底。

**这就是为什么建议保留那个 2G 分区**：它是一个永远在硬盘里的救援系统，不用 U 盘也能修。以后想换成新版本的安装环境，在 Windows 里把它清空，再复制一遍新的 ISO 内容就行（记得改卷标）。

### 2. 进 KDE 黑屏或卡在登录界面

多半是 NVIDIA 驱动的问题。在 GRUB 菜单选中 Arch Linux 后按 `e`，在 `linux` 开头那行末尾加上 `nomodeset`，按 `Ctrl + X` 启动，进去后检查驱动是否装全。也可以按 `Ctrl + Alt + F3` 切到命令行登录排查，`journalctl -b -p err` 查看报错。

实在不行，就用上一节的快照回滚。

### 3. Linux 里 F 盘只能读、不能写

通常是 Windows 没有完全关机（快速启动、休眠，或者 Windows 更新后的重启）。回到 Windows，确认快速启动已关，用"开始 → 电源 → 重启"彻底重启一次，再进 Linux 就好了。如果提示文件系统有错误，可以在 Windows 里对 F 盘运行 `chkdsk F: /f`。

### 4. 两边时间对不上

如果第一章没有改注册表，可以回去补上那一步。不想改 Windows 的话，也可以让 Linux 迁就 Windows：`sudo timedatectl set-local-rtc 1`，但 ArchWiki 不推荐这种做法。

### 5. 日常维护

- 更新系统：`sudo pacman -Syu`（AUR 的一起更新用 `paru`）。**建议每周更新一次**，太久不更新再一次性更新，出问题的概率反而更大。
- 更新前看一眼 [Arch 官网新闻](https://archlinux.org/news/)，遇到需要手动处理的更新，官方会在那里说明。
- 清理软件包缓存：`sudo pacman -S pacman-contrib`，然后 `sudo paccache -r`（保留最近 3 个版本）。

## 参考资料

- [ArchWiki：Installation guide](https://wiki.archlinux.org/title/Installation_guide)
- [ArchWiki：USB flash installation medium（手动格式化方法）](https://wiki.archlinux.org/title/USB_flash_installation_medium)
- [ArchWiki：Dual boot with Windows](https://wiki.archlinux.org/title/Dual_boot_with_Windows)
- [ArchWiki：Btrfs](https://wiki.archlinux.org/title/Btrfs)
- [ArchWiki：Snapper](https://wiki.archlinux.org/title/Snapper)
- [ArchWiki：NVIDIA](https://wiki.archlinux.org/title/NVIDIA)
- [ArchWiki：NVIDIA Optimus](https://wiki.archlinux.org/title/NVIDIA_Optimus)
- [ArchWiki：GRUB](https://wiki.archlinux.org/title/GRUB)
- [ArchWiki：System time（双系统时间问题）](https://wiki.archlinux.org/title/System_time)
