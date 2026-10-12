# 小鹤双拼练习（xiaohe-trainer）

自适应的小鹤双拼打字练习。**纯静态网站**：没有服务器、账号、多语言和构建步骤，进度保存在浏览器本地。

学习机制参考 [keybr.com](https://github.com/aradzie/keybr.com)：按每个键的实际用时算「置信度」，已解锁的键全部达标才开放下一个键，并在最弱的键上多出题。

## 功能
- **练习**：每 20 题为一课；答错立即锁定，只有按对才继续；键盘实时反馈；文字流预览。
- **引导模式**：按置信度逐键解锁（置信度 = 目标每键用时 ÷ 实际每键用时，≥ 100% 即达标）；另有第一行 / 第二行 / 第三行 / 混合的固定范围。
- **每课结算**：速度、正确率、积分，以及与上一课的涨跌；每日 30 分钟目标；按学习速率回归预测还需多少课达标。
- **进度页**：速度 / 正确率曲线、近 30 天时长、每个键的速度、最佳值、置信度和预计课数；数据导出 / 导入。
- **键位表**：官网键位图例字与规则。

## 运行
```bash
npm start            # 等价于 python3 -m http.server -d public 8000
# 打开 http://localhost:8000
npm test             # Node ≥ 18，无依赖
```
页面使用 ES 模块，不能直接双击打开（`file://` 下浏览器会拦截模块加载）。

## 部署
仓库自带 GitHub Pages 工作流：在仓库设置里把 Pages 的来源选为 **GitHub Actions**，推送到 `main` 即自动发布 `public/`。也可以把 `public/` 放到任意静态托管。

## 结构
```
public/
  index.html profile.html keyboard.html
  css/style.css
  js/
    data.js            题库（声母:韵母+字）、键位规则、解锁顺序
    core/math.js       指数平滑、多项式回归、R²
    core/model.js      置信度、按键统计、学习速率、引导解锁、积分、出题
    store.js           本地存储（只存设置和每课结果，统计由结果回放得出）
    practice.js profile.js keyboard.js charts.js
tests/                 node:test；含练习页的最小 DOM 冒烟测试
```

## 扩充题库
编辑 `public/js/data.js` 里的 `MORE`：每行 `声母:韵母+字`，同一个韵母后可连写多个字；`v` 代表 ü，`_` 代表零声母。`tests/data.test.js` 会检查每个音节都是两个键。

## 已知限制
- y、w 开头的音节里，ya yao ye yan yang you wai wan wen 等，没有找到官方依据，所以题库里不出。有依据后可在 `data.js` 的 `TF` 表补上。
- 积分公式和学习速率算法移植自 keybr，但单位按「击键/分」，课长按 20 个音节（40 次击键）。
- 数据只在本机浏览器；换设备请在进度页导出 / 导入。

## 许可证
本项目的算法移植自 keybr.com，按 **GNU AGPL-3.0** 发布，见 `LICENSE`；说明见 `NOTICE.md`。
