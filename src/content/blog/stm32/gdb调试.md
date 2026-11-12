---
title: 调试篇：在 Vim 里用 GDB 单步调试 STM32，直接看寄存器
description: 系列第五章。讲清楚 OpenOCD + GDB 的调试原理，在 Vim 自带的 termdebug 里连接芯片、下载程序、设断点、单步执行、查看变量；用 GDB 直接读写 GPIO 寄存器，不改代码就能点亮 LED；最后把常用命令写进脚本，一条命令进入调试。
pubDate: 2026-11-12
chapter: 5
tags: [STM32, 单片机, Linux, GDB, Vim]
---

上一章的程序很简单，出了问题也容易找原因。但程序一复杂，"烧进去、看现象、猜原因、改代码、再烧"这种方式就很低效了。这一章学习**在线调试**：让程序在芯片上一行一行地执行，随时暂停下来看变量和寄存器的值。

在 Keil 里这叫"进入调试模式"，在 Linux 上我们用 **OpenOCD + GDB**，界面用 Vim 自带的 **termdebug**。

## 一、调试原理

调试时有三个程序在配合工作：

```text
 Vim (termdebug)  ──命令──>  arm-none-eabi-gdb  ──网络 3333 端口──>  OpenOCD  ──USB──>  ST-Link  ──SWD──>  STM32
```

| 角色 | 作用 |
|---|---|
| **OpenOCD** | 通过 ST-Link 控制芯片：暂停、继续运行、读写内存和寄存器。同时开一个 **GDB 服务器**，监听 3333 端口 |
| **GDB** | 调试器本体：理解源代码、变量、断点，把你的操作翻译成 OpenOCD 能执行的命令 |
| **termdebug** | 在 Vim 里显示源码和 GDB 窗口，当前执行到的行会高亮显示 |

GDB 能把芯片里的地址对应回源代码的哪一行、哪个变量，靠的是 ELF 文件里的**调试信息**。第 3 章的 Makefile 里加了 `-g3 -O0`：`-g3` 生成完整的调试信息（包括宏定义），`-O0` 关闭优化，保证代码执行顺序和源码一致。如果开了优化，单步执行时会看到代码跳来跳去，有些变量也会显示 `<optimized out>`。

## 二、第一次调试

以上一章的点灯程序为例。

### 1. 启动 OpenOCD

开一个终端，在工程目录执行：

```bash
make debug-server
```

也就是 `openocd -f interface/stlink.cfg -f target/stm32f1x.cfg`。看到类似下面这行，说明 GDB 服务器已经准备好了：

```text
Info : Listening on port 3333 for gdb connections
```

这个终端保持开着，不要关闭。

> 如果是兼容芯片，记得像上一章说的那样，在 `-f target/stm32f1x.cfg` 前面加 `-c "set CPUTAPID 0"`。

### 2. 在 Vim 里启动 termdebug

另开一个终端，在工程目录用 Vim 打开 `User/main.c`，然后执行：

```vim
:Termdebug build/main.elf
```

Vim 会分出几个窗口：

| 窗口 | 作用 |
|---|---|
| GDB 窗口 | 输入 GDB 命令的地方 |
| 程序输出窗口 | 裸机调试用不到，可以 `:q` 关掉 |
| 源码窗口 | 你的代码，当前执行到的行会高亮 |

### 3. 连接芯片，下载程序

在 GDB 窗口里依次输入：

```text
target extended-remote :3333
monitor reset halt
load
break main
continue
```

| 命令 | 作用 |
|---|---|
| `target extended-remote :3333` | 连接本机 3333 端口上的 OpenOCD |
| `monitor reset halt` | `monitor` 后面的命令会直接交给 OpenOCD 执行：复位芯片并立即暂停 |
| `load` | 把 ELF 里的程序下载到 Flash，相当于烧录了一次 |
| `break main` | 在 `main` 函数入口设断点 |
| `continue` | 继续运行，直到遇到断点 |

执行完 `continue`，程序会停在 `main` 的第一行，源码窗口里这一行会被高亮。

## 三、常用调试操作

### 1. 控制程序执行

termdebug 提供了一组 Vim 命令，可以在源码窗口里直接用：

| Vim 命令 | 对应的 GDB 命令 | 作用 |
|---|---|---|
| `:Break` | `break` | 在光标所在行设断点 |
| `:Clear` | `clear` | 删除光标所在行的断点 |
| `:Over` | `next` | 执行一行，**不进入**函数内部 |
| `:Step` | `step` | 执行一行，遇到函数调用会**进入**函数 |
| `:Finish` | `finish` | 执行完当前函数，回到调用它的地方 |
| `:Continue` | `continue` | 继续运行到下一个断点 |
| `:Stop` | `interrupt` | 暂停正在运行的程序 |
| `:Evaluate` | `print` | 显示光标下变量或表达式的值 |

每次都输入命令比较麻烦，可以在 `~/.vimrc` 里加几个快捷键：

```vim
nnoremap <F9>  :Break<CR>
nnoremap <F10> :Over<CR>
nnoremap <F11> :Step<CR>
nnoremap <F12> :Finish<CR>
```

试一下：程序停在 `main` 里以后，按几次 F10，每按一次执行一行，高亮会跟着往下走。执行过 `GPIO_ResetBits` 那一行之后，板子上的 LED 会亮起来；再执行 `GPIO_SetBits`，LED 熄灭。这时候你就真正"看到"了每一行代码的效果。

如果在 `Delay_ms(500)` 这一行按 F11（`:Step`），会进入 `Delay_ms` 函数内部；按 F12（`:Finish`）再回来。

### 2. 查看变量

在 GDB 窗口里：

```text
print gpio
print gpio.GPIO_Pin
print/x gpio.GPIO_Pin
```

`print/x` 表示用十六进制显示，`print/t` 是二进制。也可以把光标放到源码里的变量上，执行 `:Evaluate`。

想让某个变量每次暂停时都自动显示，用 `display`：

```text
display ms
```

### 3. 查看调用关系

```text
backtrace
```

会列出当前在哪个函数里、是谁调用的它。比如停在 `Delay_us` 里时，能看到 `Delay_us ← Delay_ms ← main` 这样的调用链。

## 四、直接读写寄存器

这是调试器最有意思的用法之一：**不用改代码，直接在 GDB 里操作硬件**。

### 1. 查看 GPIOC 的输出寄存器

因为编译时用了 `-g3`，GDB 认识 `stm32f10x.h` 里定义的宏，可以直接写：

```text
print/x GPIOC->ODR
```

单步执行 `GPIO_ResetBits` 前后各看一次，会发现第 13 位（`0x2000`）从 1 变成了 0。

如果 GDB 提示不认识 `GPIOC`，也可以直接用地址读。查参考手册可知 GPIOC 的基地址是 `0x40011000`，ODR 寄存器的偏移是 `0x0C`：

```text
x/x 0x4001100C
```

`x` 命令的意思是"查看内存"（examine），`/x` 表示用十六进制显示。

### 2. 用 GDB 点亮 LED

程序暂停时，直接修改寄存器：

```text
set var GPIOC->ODR = GPIOC->ODR & ~(1 << 13)
```

LED 会马上亮起来。再改回来：

```text
set var GPIOC->ODR = GPIOC->ODR | (1 << 13)
```

这个实验很好地说明了一件事：**单片机的外设就是一组有固定地址的内存**，写这块内存，硬件就会动作。标准库的函数、我们写的 C 代码，最终做的都是这件事。

### 3. 查看 CPU 寄存器

```text
info registers
```

会显示 R0～R12、SP（栈指针）、LR（返回地址）、PC（当前执行的指令地址）等内核寄存器。现在看不懂没关系，以后学到中断和函数调用的原理时会用到。

## 五、程序跑飞了怎么办：HardFault

学习过程中最常见的"程序卡死"，是进入了 **HardFault**（硬件错误）中断。原因通常是访问了非法地址（比如空指针）、或者用了没开时钟的外设。

程序卡住时，在 GDB 里按 `Ctrl+C`（或者在 Vim 里 `:Stop`）暂停，然后：

```text
backtrace
```

如果看到当前停在 `HardFault_Handler` 里，就说明出错了。`stm32f10x_it.c` 里的默认 `HardFault_Handler` 是一个死循环，程序会一直停在那里。

可以做个实验：在 `main` 里加一行访问空指针的代码：

```c
*(volatile uint32_t *)0 = 1;
```

调试运行，程序会停在 `HardFault_Handler`。这个习惯很重要：**程序没反应时，先暂停看看停在哪里**，而不是盲目改代码。

## 六、把启动命令写进脚本

每次调试都要输入那几条连接命令很麻烦，可以写进一个 GDB 脚本。在工程根目录新建 `debug.gdb`：

```text
target extended-remote :3333
monitor reset halt
load
break main
continue
```

以后在 Vim 里这样启动，GDB 会自动执行脚本里的命令：

```vim
:Termdebug -x debug.gdb build/main.elf
```

`:Termdebug` 后面的参数会原样传给 GDB，`-x` 表示执行一个命令文件。也可以把它也设成快捷键：

```vim
nnoremap <leader>d :Termdebug -x debug.gdb build/main.elf<CR>
```

修改代码以后，不用退出调试，在 GDB 窗口里依次执行下面的命令就能重新编译、下载、从头运行：

```text
make
monitor reset halt
load
continue
```

GDB 里的 `make` 命令会在当前目录执行 `make`。

## 七、退出调试

1. 在 GDB 窗口里输入 `quit`（如果问是否结束调试会话，输入 `y`），termdebug 的窗口会自动关闭
2. 在 OpenOCD 的终端里按 `Ctrl+C` 结束 OpenOCD

退出后芯片会继续运行当前的程序。

## 八、常见问题

### 1. `:Termdebug` 提示不是编辑器命令

`~/.vimrc` 里没有加载 termdebug 插件。确认有这一行：

```vim
packadd termdebug
```

### 2. GDB 连接时报 `Connection refused`

OpenOCD 没有在运行，或者已经退出了。回到 OpenOCD 的终端看看有没有报错，最常见的原因是连不上芯片，解决方法见第 4 章的常见问题。

### 3. 单步执行时代码乱跳，变量显示 `<optimized out>`

编译时开了优化。确认 Makefile 里是 `-O0`，然后 `make clean && make` 重新编译，再 `load` 一次。

### 4. 断点设不上：`Cannot insert breakpoint`

STM32F103 的硬件断点只有 **6 个**。程序在 Flash 里运行时，GDB 只能用硬件断点，设多了会报错。用 `info breakpoints` 查看现有断点，用 `delete 编号` 删掉不需要的。

### 5. `print GPIOC->ODR` 提示 `No symbol "GPIOC" in current context`

GDB 需要调试信息里有宏定义才能认识 `GPIOC`。确认编译参数是 `-g3` 而不是 `-g`，并且程序当前停在包含了 `stm32f10x.h` 的文件里。实在不行就用 `x/x 地址` 的方式直接读。

## 九、本章小结

- **OpenOCD** 控制芯片并提供 GDB 服务器，**GDB** 负责调试逻辑，**termdebug** 在 Vim 里显示界面
- 连接流程：`target extended-remote :3333` → `monitor reset halt` → `load` → `break main` → `continue`
- `:Over` / `:Step` / `:Finish` 单步执行，`print` 查看变量，`backtrace` 查看调用关系
- 外设寄存器可以在 GDB 里直接读写，这是理解"寄存器就是内存"最直观的方式
- 程序没反应时，先暂停、看 `backtrace`，检查是不是进了 `HardFault_Handler`

下一章学习串口通信，把 `printf` 的输出发到电脑上。
