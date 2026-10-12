# 来源说明

本项目的学习模型移植并改写自 keybr.com（https://github.com/aradzie/keybr.com，AGPL-3.0）：

| 本项目 | keybr 中的对应部分 |
|---|---|
| `core/model.js` 置信度 `Target` | `keybr-lesson` 的 `Target` |
| `core/model.js` 引导解锁 `guidedKeys` | `keybr-lesson` 的 `GuidedLesson.update` |
| `core/model.js` 学习速率 `learningRate` / `findSession` | `keybr-lesson` 的 `LearningRate` / `LearningSession` |
| `core/model.js` 积分 `makeResult` | `keybr-result` 的 `Result` 积分公式 |
| `core/model.js` 按键统计 | `keybr-result` 的按键统计与平滑滤波（系数 0.1） |
| `core/math.js` | `keybr-math` 的滤波器与多项式回归 |

适配改动：改为双拼音节练习；速度单位为「击键/分」；每课 20 个音节；无服务器、无账号。
键位和例字取自小鹤双拼官网键位图。
本项目整体按 AGPL-3.0 发布；通过网络提供服务时，需向用户提供对应源码。

## 数据来源
- 成语表：chinese-xinhua（https://github.com/pwxcoo/chinese-xinhua，MIT），只用于离线生成 `public/js/longwords.js`，不随项目分发原始数据。
- 词频：jieba 自带词典；拼音：pypinyin。二者都只在 `tools/` 的生成脚本里使用，不是运行时依赖。
