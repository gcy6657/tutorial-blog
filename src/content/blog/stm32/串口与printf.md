---
title: 串口篇：用 USART 把 printf 输出到电脑，在 Linux 上用 picocom 收发
description: 系列第六章，也是环境篇的最后一章。接好 CH340 模块，用标准库初始化 USART1，实现 _write 函数把 printf 重定向到串口；在 Linux 上用 picocom 收发数据，解决输出不显示、换行错位、中文乱码等常见问题。
pubDate: 2026-11-12
chapter: 6
tags: [STM32, 单片机, Linux, 串口]
---

上一章学了用调试器看变量，但很多时候我们只是想让程序"说句话"：打印一个传感器读数、确认程序跑到了哪一步。在电脑上用 `printf`，在单片机上同样可以，只是输出要通过**串口**发到电脑上。

这一章完成后，你可以在 STM32 里写 `printf("温度：%d\r\n", temp);`，在 Linux 终端里看到输出。

## 一、硬件接线

### 1. 串口是什么

串口（UART）是最简单的通信方式之一：一根线发（TX）、一根线收（RX），双方约定好**波特率**（每秒传多少位），就能互相发送数据。

STM32 的串口电平是 3.3V 的 TTL 电平，电脑上没有这种接口，所以需要一个 **USB 转 TTL 模块**（常见的是 CH340 芯片）做转换。

### 2. 接线

STM32F103 的 USART1 使用 **PA9（TX）** 和 **PA10（RX）**。和 CH340 模块这样连接：

| CH340 模块 | STM32 最小系统板 |
|---|---|
| TXD | **PA10**（RX） |
| RXD | **PA9**（TX） |
| GND | GND |

注意两点：

1. **TX 接 RX、RX 接 TX，要交叉连接**。一方的"发"要接到另一方的"收"
2. **GND 必须连接**，两边要有共同的参考电平，否则收到的全是乱码

板子仍然由 ST-Link 供电，CH340 的 3.3V / 5V 引脚**不要接**，避免两个电源冲突。如果 CH340 模块上有电平选择跳线，选 3.3V。

### 3. 确认系统认出了模块

插上 CH340，然后：

```bash
sudo dmesg | tail
```

能看到类似这样的输出：

```text
ch341 1-2:1.0: ch341-uart converter detected
usb 1-2: ch341-uart converter now attached to ttyUSB0
```

说明设备是 `/dev/ttyUSB0`。CH340 的驱动（`ch341` 模块）Linux 内核自带，**不用另外安装驱动**。

## 二、STM32 端：初始化串口

### 1. 串口模块

按江科大的习惯，外设相关的代码放在 `Hardware/` 目录。新建 `Hardware/Serial.h`：

```c
#ifndef __SERIAL_H
#define __SERIAL_H

#include <stdint.h>

void Serial_Init(void);
void Serial_SendByte(uint8_t byte);
int Serial_ReceiveByte(void);

#endif
```

新建 `Hardware/Serial.c`：

```c
#include "stm32f10x.h"
#include "Serial.h"

void Serial_Init(void)
{
    // 1. 打开 USART1 和 GPIOA 的时钟（两者都挂在 APB2 总线上）
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_USART1 | RCC_APB2Periph_GPIOA, ENABLE);

    // 2. PA9（TX）：复用推挽输出，由 USART 控制这个引脚
    GPIO_InitTypeDef gpio;
    gpio.GPIO_Pin = GPIO_Pin_9;
    gpio.GPIO_Mode = GPIO_Mode_AF_PP;
    gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &gpio);

    // 3. PA10（RX）：上拉输入，没有数据时保持高电平（空闲状态）
    gpio.GPIO_Pin = GPIO_Pin_10;
    gpio.GPIO_Mode = GPIO_Mode_IPU;
    GPIO_Init(GPIOA, &gpio);

    // 4. 串口参数：115200 波特率，8 位数据，1 位停止位，无校验
    USART_InitTypeDef usart;
    usart.USART_BaudRate = 115200;
    usart.USART_WordLength = USART_WordLength_8b;
    usart.USART_StopBits = USART_StopBits_1;
    usart.USART_Parity = USART_Parity_No;
    usart.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    usart.USART_Mode = USART_Mode_Tx | USART_Mode_Rx;
    USART_Init(USART1, &usart);

    // 5. 启动串口
    USART_Cmd(USART1, ENABLE);
}

void Serial_SendByte(uint8_t byte)
{
    USART_SendData(USART1, byte);
    // 等待发送寄存器空（TXE），才能发下一个字节
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET)
    {
    }
}

/** 收到数据时返回该字节，没有数据时返回 -1，不会阻塞等待 */
int Serial_ReceiveByte(void)
{
    if (USART_GetFlagStatus(USART1, USART_FLAG_RXNE) == SET)
    {
        return USART_ReceiveData(USART1);
    }
    return -1;
}
```

套路还是那几步：**开时钟 → 配置引脚 → 配置外设 → 启动**。

### 2. 让 printf 走串口

在电脑上，`printf` 把格式化好的字符串交给操作系统输出到屏幕。单片机上没有操作系统，C 库（newlib）在需要输出时，会调用一个叫 `_write` 的函数，我们只要**自己实现这个函数**，把数据一个字节一个字节地发到串口就行。

在 `Hardware/Serial.c` 末尾加上：

```c
/**
 * newlib 的 printf 最终会调用 _write 输出数据。
 * 默认实现（来自 nosys.specs）什么也不做，这里改成从串口发出去。
 */
int _write(int fd, char *ptr, int len)
{
    (void)fd;   // 不区分 stdout 和 stderr，都从串口输出
    for (int i = 0; i < len; i++)
    {
        Serial_SendByte((uint8_t)ptr[i]);
    }
    return len;
}
```

> 在 Keil 里，同样的事情是通过重写 `fputc` 并勾选"Use MicroLIB"实现的。GCC 用的 newlib 不走 `fputc`，所以江科大视频里的 `fputc` 写法在这里**不起作用**，要改成 `_write`。

### 3. main.c

```c
#include <stdio.h>
#include "stm32f10x.h"
#include "Delay.h"
#include "Serial.h"

int main(void)
{
    Serial_Init();
    // 关闭 stdout 的缓冲，printf 的内容立即发送（原因见下文）
    setvbuf(stdout, NULL, _IONBF, 0);

    printf("Hello from STM32!\r\n");
    printf("系统时钟：%lu Hz\r\n", (unsigned long)SystemCoreClock);

    uint32_t count = 0;
    while (1)
    {
        // 收到电脑发来的字符，就原样回复
        int ch = Serial_ReceiveByte();
        if (ch >= 0)
        {
            printf("收到：%c\r\n", ch);
        }

        // 每秒打印一次计数
        static uint32_t ticks = 0;
        Delay_ms(1);
        if (++ticks >= 1000)
        {
            ticks = 0;
            printf("count = %lu\r\n", (unsigned long)count++);
        }
    }
}
```

几个细节：

1. **`setvbuf(stdout, NULL, _IONBF, 0);`**：newlib 默认给 `stdout` 开了缓冲区，内容攒够一定数量才真正调用 `_write`，导致 `printf` 了却迟迟看不到输出。这行代码关闭缓冲，每次 `printf` 都立即发送。
2. **`\r\n`**：串口终端里，`\n` 只是换到下一行，`\r` 才是回到行首。只写 `\n` 的话，输出会像台阶一样越来越往右。
3. **`%lu` 配 `unsigned long`**：`uint32_t` 在 ARM GCC 里是 `unsigned long`，用 `%d` 打印会有编译警告。这类类型匹配问题正是学 C 时要注意的。
4. 每次只延时 1 毫秒，是为了在等待打印的同时也能及时检查有没有收到数据。

编译烧录：

```bash
make flash
```

## 三、Linux 端：用 picocom 收发

### 1. 打开串口

```bash
picocom -b 115200 /dev/ttyUSB0
```

`-b 115200` 是波特率，**必须和程序里设置的一致**。

按一下板子上的复位键，应该能看到：

```text
Hello from STM32!
系统时钟：72000000 Hz
count = 0
count = 1
count = 2
```

系统时钟是 72000000，说明 `SystemInit` 已经把时钟配置成了 72 MHz，上一章的延时函数也是按这个频率算的。

在 picocom 里直接按键盘上的键，比如 `a`，会收到 `收到：a`。

### 2. picocom 的操作

picocom 的命令都以 `Ctrl+A` 开头：

| 按键 | 作用 |
|---|---|
| `Ctrl+A` 然后 `Ctrl+X` | 退出 picocom |
| `Ctrl+A` 然后 `Ctrl+C` | 开关本地回显（显示自己输入的字符） |
| `Ctrl+A` 然后 `Ctrl+U` / `Ctrl+D` | 调高 / 调低波特率 |

如果程序里只写了 `\n`，可以让 picocom 帮忙把收到的 `\n` 转成 `\r\n`：

```bash
picocom -b 115200 --imap lfcrlf /dev/ttyUSB0
```

### 3. 关于中文

上面的程序里直接打印了中文，在 picocom 里能正常显示。这是因为：

- 源代码文件是 UTF-8 编码，GCC 编译时字符串保持 UTF-8 不变
- `printf` 只是把这些字节原样发出去
- Linux 终端默认也是 UTF-8，收到后正确解码

在 Windows 上用 Keil 时，源文件经常是 GBK 编码，配上不同编码的串口助手就会乱码。全程 UTF-8 的 Linux 环境反而省了这个麻烦。

## 四、printf 的代价

`printf` 用起来方便，但在单片机上并不便宜：

```bash
arm-none-eabi-size build/main.elf
```

加了 `printf` 以后，`text` 一般会增加好几 KB。F103C8T6 只有 64 KB Flash，大部分情况下够用，但要知道它不是免费的。

另外，为了省空间，newlib-nano 默认**不支持打印浮点数**，`printf("%f", 3.14)` 什么也不输出。需要的话在 Makefile 的 `LDFLAGS` 里加上 `-u _printf_float`，代价是程序体积再增加几 KB：

```makefile
LDFLAGS := $(MCU) -T $(LDSCRIPT) -Wl,--gc-sections -Wl,-Map=$(BUILD)/$(TARGET).map \
           --specs=nano.specs --specs=nosys.specs -u _printf_float
```

也可以不用浮点，把数字放大后用整数打印，比如 `printf("%d.%02d\r\n", v / 100, v % 100);`。

## 五、常见问题

### 1. picocom 提示 `Permission denied`

当前用户没有串口权限。参考第 2 章，把自己加入 `uucp` 组，然后**注销重新登录**。

### 2. 找不到 `/dev/ttyUSB0`

- 用 `sudo dmesg | tail` 看看插上模块时有没有输出
- 如果看到 `ch341` 识别成功后马上又断开（`disconnected`），可能是装了 **brltty**（盲文显示器支持程序），它会抢占 CH340 的设备。不需要盲文显示器的话卸载它：

```bash
sudo pacman -Rns brltty
```

- 换一个 USB 口或换根线试试，有些线只能充电、不能传数据

### 3. 收到的全是乱码

1. **波特率不一致**：picocom 的 `-b` 要和程序里的 `USART_BaudRate` 一样
2. **GND 没接**：检查 CH340 的 GND 和板子的 GND 是否相连
3. **时钟不对**：如果打印出来的系统时钟不是 72000000，说明外部晶振没有起振，波特率也会跟着算错。可以检查一下板子上的 8 MHz 晶振

### 4. 什么都收不到

1. **TX、RX 接反了**：要交叉连接，CH340 的 TXD 接 PA10，RXD 接 PA9
2. **printf 被缓冲了**：确认 `main` 里调用了 `setvbuf(stdout, NULL, _IONBF, 0);`
3. **`_write` 没有被链接进来**：确认 `Hardware/Serial.c` 被编译了（`build/Hardware/Serial.o` 存在）。如果 Makefile 里的 `SRC_DIRS` 没写 `Hardware`，这个文件不会被编译

### 5. 链接时报 `multiple definition of '_write'`

工程里有两个地方定义了 `_write`，删掉一个即可。

## 六、环境篇总结

到这里，环境篇的 6 章就全部完成了。回顾一下，我们在 Linux 上搭起了一套完整的 STM32 开发环境：

| 环节 | 工具 | 对应章节 |
|---|---|---|
| 写代码 | Vim + clangd（补全、跳转、报错） | 第 2 章 |
| 工程组织 | 标准库 + 启动文件 + 链接脚本 + Makefile | 第 3 章 |
| 编译烧录 | arm-none-eabi-gcc + OpenOCD（`:make flash`） | 第 4 章 |
| 调试 | GDB + termdebug（断点、单步、看寄存器） | 第 5 章 |
| 打印输出 | USART + printf + picocom | 第 6 章 |

接下来就可以跟着江科大的视频学习各个外设了：按键、OLED、外部中断、定时器、PWM、ADC、DMA、I2C、SPI……视频里的原理和代码都能直接用，只需要记住：

- 新文件放进 `System/`、`Hardware/`、`User/` 目录，Makefile 自动编译
- `:make` 编译、`:make flash` 烧录、`:Termdebug -x debug.gdb build/main.elf` 调试
- 串口打印用 `_write` 重定向，不用 `fputc`
- 新增源文件后执行 `make clean && bear -- make`，让 clangd 跟上

后续我也会继续更新外设章节。
