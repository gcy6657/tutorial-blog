---
title: 环境篇：在 Arch 上装好 ARM 工具链，把 Vim 配成 STM32 开发环境
description: 系列第二章。用 pacman 装好 arm-none-eabi-gcc、newlib、gdb、OpenOCD 和 picocom，处理 ST-Link 与串口的权限，再用 vim-plug + vim-lsp + clangd 让 Vim 支持代码补全、跳转定义和实时报错，并配好调试插件 termdebug。
pubDate: 2026-11-12
chapter: 2
tags: [STM32, 单片机, Linux, Vim]
---

> 本章基于 2026 年 11 月 Arch Linux 官方仓库的软件版本编写，包名和版本号以 `pacman -Si 包名` 的查询结果为准。

上一章讲了这个系列要用哪些工具，这一章把它们全部装好，并把 Vim 配置成一个顺手的 C 语言编辑器。完成后你会有：

- 能把 C 代码编译成 STM32 程序的**交叉编译工具链**
- 能烧录和调试芯片的 **OpenOCD**
- 能看串口输出的 **picocom**
- 一个支持**补全、跳转定义、实时报错、单步调试**的 Vim

## 一、装工具链

### 1. 什么是交叉编译

你在电脑上用 `gcc` 编译出来的程序，是给电脑的 x86_64 CPU 运行的。STM32 的内核是 ARM Cortex-M3，指令集完全不同，所以需要一个"在 x86 电脑上运行、但生成 ARM 程序"的编译器，这就叫**交叉编译器**。

ARM 官方维护的这套工具叫 `arm-none-eabi-*`，名字的含义是：

| 部分 | 含义 |
|---|---|
| `arm` | 目标架构是 ARM |
| `none` | 目标上**没有操作系统**（裸机） |
| `eabi` | 使用 ARM 的嵌入式应用二进制接口标准 |

### 2. 一条命令装好

```bash
sudo pacman -S arm-none-eabi-gcc arm-none-eabi-newlib arm-none-eabi-gdb openocd stlink picocom make
```

每个包的作用：

| 包 | 作用 |
|---|---|
| `arm-none-eabi-gcc` | 交叉编译器，同时会作为依赖装上 `arm-none-eabi-binutils`（汇编器、链接器、`objcopy`、`size` 等） |
| `arm-none-eabi-newlib` | 给嵌入式用的 C 标准库，`printf`、`memset`、`strlen` 这些函数来自它 |
| `arm-none-eabi-gdb` | ARM 版调试器 |
| `openocd` | 通过 ST-Link 和芯片通信，负责烧录和调试 |
| `stlink` | ST-Link 的开源命令行工具（`st-info`、`st-flash`），用来检测下载器、作为烧录的备用方案 |
| `picocom` | 轻量的串口终端 |
| `make` | 读取 Makefile 组织编译，大多数系统已经装了 |

### 3. 检查是否装好

```bash
arm-none-eabi-gcc --version
arm-none-eabi-gdb --version
openocd --version
```

每条都能打印出版本号就说明装好了。

## 二、ST-Link 和串口的权限

Linux 下普通用户默认不能直接访问 USB 设备和串口，需要处理一下权限。

### 1. ST-Link

Arch 的 `openocd` 和 `stlink` 包都自带了 udev 规则，会让**当前登录的用户**自动获得 ST-Link 的访问权限，一般不用额外设置。

插上 ST-Link，检查一下：

```bash
lsusb | grep -i st
```

能看到类似这样一行，说明系统认出了下载器：

```text
Bus 001 Device 007: ID 0483:3748 STMicroelectronics ST-LINK/V2
```

再用 `st-info` 看看能不能连上（这一步需要先把 ST-Link 接到开发板上，接线方法见第 4 章，现在看不到芯片信息也没关系）：

```bash
st-info --probe
```

如果提示权限不足（`Permission denied` 或 `LIBUSB_ERROR_ACCESS`），先拔掉 ST-Link 再插上；还不行就重新加载 udev 规则：

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### 2. 串口

USB 转 TTL 模块（CH340）插上后会出现 `/dev/ttyUSB0`。这个设备属于 `uucp` 组，把自己加进这个组：

```bash
sudo usermod -aG uucp $USER
```

**注销后重新登录**才会生效。之后用 `groups` 命令确认输出里有 `uucp`。

> `usermod -aG` 里的 `-a` 不能漏，否则会把你从其他组里移除。这一点在[《Linux 命令行基础保姆级教程》](/series/archlinux/linux基础教程/)的用户与权限部分讲过。

## 三、把 Vim 配成 C 语言开发环境

光有 Vim 也能写代码，但写单片机程序时会频繁查函数定义（比如 `GPIO_InitTypeDef` 里有哪些成员），有补全和跳转会方便很多。

### 1. 实现原理：LSP 和 clangd

现在的编辑器（包括 VS Code）大多用 **LSP**（Language Server Protocol）来实现补全和跳转：

- **语言服务器**负责理解代码：解析语法、找定义、检查错误。C 语言最常用的语言服务器是 **clangd**。
- **编辑器**负责显示：通过 LSP 协议向语言服务器提问，再把结果显示出来。Vim 通过插件实现这一部分。

clangd 要正确理解代码，必须知道每个文件**是怎么编译的**：头文件在哪些目录、定义了哪些宏。这些信息放在一个叫 `compile_commands.json` 的文件里，我们用 `bear` 工具在编译时自动生成它。

### 2. 安装

```bash
sudo pacman -S vim clang bear
```

- `clang` 包里带了 `clangd`
- `bear` 用来生成 `compile_commands.json`
- 想让 Vim 和系统剪贴板互通，可以把 `vim` 换成 `gvim`，它同样提供终端版的 `vim` 命令

### 3. 装插件管理器 vim-plug

```bash
curl -fLo ~/.vim/autoload/plug.vim --create-dirs \
  https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
```

> 如果访问 GitHub 很慢或下载失败，可以先配置好代理再执行；也可以用浏览器打开这个地址，把内容保存成 `~/.vim/autoload/plug.vim`。

### 4. 写配置文件

编辑 `~/.vimrc`（已经有这个文件的话，把下面的内容合并进去）：

```vim
" ========== 插件 ==========
call plug#begin()
" LSP 客户端
Plug 'prabirshrestha/vim-lsp'
" 自动补全框架，以及把 LSP 的结果接入补全
Plug 'prabirshrestha/asyncomplete.vim'
Plug 'prabirshrestha/asyncomplete-lsp.vim'
call plug#end()

" ========== 基础设置 ==========
set number                  " 显示行号
set tabstop=4 shiftwidth=4 expandtab  " 缩进 4 个空格
set encoding=utf-8
filetype plugin indent on
syntax on

" ========== clangd ==========
" --query-driver：允许 clangd 调用交叉编译器，查询它自带的头文件目录（stdint.h 等）
if executable('clangd')
  au User lsp_setup call lsp#register_server({
    \ 'name': 'clangd',
    \ 'cmd': ['clangd', '--query-driver=/usr/bin/arm-none-eabi-*'],
    \ 'allowlist': ['c', 'cpp'],
    \ })
endif

" 在 C 文件里启用的快捷键
" 注意：map 命令后面不能写行尾注释，否则注释会被当成按键的一部分
function! s:on_lsp_buffer_enabled() abort
  " 左侧留一列显示报错标记
  setlocal signcolumn=yes
  " 跳转到定义 / 查找所有引用 / 查看说明 / 重命名
  nmap <buffer> gd <plug>(lsp-definition)
  nmap <buffer> gr <plug>(lsp-references)
  nmap <buffer> K  <plug>(lsp-hover)
  nmap <buffer> <leader>rn <plug>(lsp-rename)
  " 上一个 / 下一个报错
  nmap <buffer> [g <plug>(lsp-previous-diagnostic)
  nmap <buffer> ]g <plug>(lsp-next-diagnostic)
endfunction
au User lsp_buffer_enabled call s:on_lsp_buffer_enabled()

" 补全菜单：Tab 选下一项，Shift+Tab 选上一项，回车确认
inoremap <expr> <Tab>   pumvisible() ? "\<C-n>" : "\<Tab>"
inoremap <expr> <S-Tab> pumvisible() ? "\<C-p>" : "\<S-Tab>"
inoremap <expr> <CR>    pumvisible() ? asyncomplete#close_popup() : "\<CR>"

" ========== 调试 ==========
" Vim 自带的调试插件，使用 ARM 版 gdb，第 5 章会用到
packadd termdebug
let g:termdebugger = 'arm-none-eabi-gdb'
let g:termdebug_wide = 1    " 宽屏时源码和 gdb 窗口左右排列
```

保存后重新打开 Vim，执行：

```vim
:PlugInstall
```

等插件下载完成，按 `q` 关闭安装窗口。

### 5. 常用快捷键

| 快捷键 | 作用 | 用在什么时候 |
|---|---|---|
| `gd` | 跳转到定义 | 光标放在 `GPIO_Init` 上，直接跳进标准库源码看它干了什么 |
| `Ctrl+o` | 跳回原来的位置 | 看完定义回到自己的代码 |
| `K` | 显示函数签名和注释 | 忘了函数有哪些参数 |
| `gr` | 列出所有引用 | 看一个变量在哪些地方被修改 |
| `]g` / `[g` | 跳到下一个 / 上一个报错 | 写完代码检查错误 |

`<leader>` 默认是反斜杠 `\`，所以重命名是依次按 `\`、`r`、`n`。

> 现在还没有 STM32 工程，打开 `.c` 文件时 clangd 不知道头文件在哪，会报一堆"找不到文件"。这是正常的，下一章建好工程、生成 `compile_commands.json` 以后就好了。你可以先用第一章的 `hello.c` 试试：用 `gcc` 编译的普通 C 文件，clangd 不需要额外配置就能工作。

## 四、Vim 里编译：`:make` 和 quickfix

这部分不需要装任何东西，是 Vim 自带的功能，后面每一章都会用。

在 Vim 里执行 `:make`，Vim 会在当前目录运行 `make` 命令，并且**自动解析编译器的报错信息**。编译出错时：

| 命令 | 作用 |
|---|---|
| `:copen` | 打开报错列表（quickfix 窗口），在某一行按回车跳到对应的出错位置 |
| `:cnext` / `:cprev` | 跳到下一个 / 上一个错误 |
| `:cclose` | 关闭报错列表 |

可以在 `~/.vimrc` 里加两个快捷键，按 F5 编译、F6 编译并烧录：

```vim
nnoremap <F5> :make<CR>
nnoremap <F6> :make flash<CR>
```

`make flash` 这个目标会在下一章的 Makefile 里写好。

## 五、可能遇到的问题

### 1. `:PlugInstall` 提示找不到命令

说明 `plug.vim` 没有放对位置。确认文件在 `~/.vim/autoload/plug.vim`，并且 `~/.vimrc` 里 `call plug#begin()` 写在最前面。

### 2. 插件下载卡住或失败

vim-plug 用 `git clone` 从 GitHub 下载插件，网络不好时会卡住。可以给 git 配置代理后重试 `:PlugInstall`，失败的插件会显示 `x`，按 `R` 可以只重试失败的。

### 3. `arm-none-eabi-gcc` 能用，但编译时报 `cannot find -lc` 或找不到 `stdio.h`

没装 `arm-none-eabi-newlib`。补装即可：

```bash
sudo pacman -S arm-none-eabi-newlib
```

## 六、本章小结

- `pacman` 装好了交叉编译器、C 库、调试器、OpenOCD、stlink、picocom
- ST-Link 靠包自带的 udev 规则获得权限，串口靠加入 `uucp` 组
- Vim 用 **vim-lsp + clangd** 实现补全和跳转，用 **termdebug** 调试
- 在 Vim 里用 `:make` 编译，报错进 quickfix 窗口

下一章搭建 STM32 标准库工程，写 Makefile 和链接脚本。
