---
title: 在 Arch Linux 上学 STM32（Vim + GCC）
description: 不用 Keil，全程在 Linux 下用 Vim、arm-none-eabi-gcc、Makefile 和 OpenOCD 开发 STM32F103，代码和江科大的标准库教程一一对应，顺便把 C 语言练扎实。
order: 2
---

这个系列面向**想学 C 语言、对单片机感兴趣、并且想全程用 Linux** 的新手。芯片选的是最常见的 STM32F103C8T6，代码使用 ST 官方的**标准库**，和 B 站江协科技（江科大）的 STM32 入门教程保持一致：视频里讲原理和代码，这个系列负责把 Keil 换成 Linux 下的工具。

目前已经写完的是**环境篇**：从选型、装工具、搭工程，到点灯、调试、串口打印。外设章节（按键、中断、定时器、PWM、ADC……）会在后续跟着学习进度补上。
