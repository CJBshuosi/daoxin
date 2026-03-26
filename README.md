# 道心文案 · 本地开发指南

## 项目结构

```
daoxin/
├── public/
│   ├── index.html   ← 页面结构（改这里调整布局）
│   ├── style.css    ← 所有样式（改这里调整外观）
│   └── app.js       ← 所有逻辑（改这里调整功能）
└── README.md
```

**为什么拆成三个文件？**
单个HTML文件塞所有代码，找东西、改东西很痛苦。
拆开后：想改样式找CSS，想改逻辑找JS，互不干扰。

---

## 第一步：在 VSCode 里跑起来

### 方法（推荐）：用 Live Server 插件

1. 打开 VSCode，安装插件 **Live Server**
   - 左侧点击扩展图标（四个方块）
   - 搜索 `Live Server`，点安装

2. 用 VSCode 打开 `daoxin` 文件夹
   ```
   文件 → 打开文件夹 → 选择 daoxin 文件夹
   ```

3. 在左侧文件树里点击 `public/index.html`

4. 右键 → **Open with Live Server**
   （或点右下角状态栏的 `Go Live`）

5. 浏览器自动打开 `http://127.0.0.1:5500/public/index.html`

6. 修改任何文件保存后，浏览器**自动刷新**

---

## 第二步：填入你的 API Key

在页面右上角输入框粘贴你的 Anthropic API Key（`sk-ant-` 开头）。

> **Key 存在哪里？**
> 只存在你浏览器的内存里，刷新就没了。
> 如果不想每次都填，可以在 `app.js` 顶部加一行：
> ```js
> // ⚠️ 仅自用时可以这样做，不要提交到git
> const DEFAULT_API_KEY = 'sk-ant-你的key';
> ```
> 然后在 `generate()` 函数里把 `apiKey` 改成 `apiKey || DEFAULT_API_KEY`

---

## 常见修改场景

### 想改生成的文案风格？
打开 `app.js`，找到 `buildSystemPrompt()` 函数，修改里面的文字。

### 想加一个新的输出字段（比如"话题标签"）？
1. 在 `buildSystemPrompt()` 的JSON格式里加 `"hashtags": [...]`
2. 在 `renderResult()` 函数里加对应的展示代码

### 想改界面颜色？
打开 `style.css`，修改顶部的 `:root { }` 里的变量值。

### 数据存在哪里？
浏览器的 `localStorage`，key 是 `daoxin_v1`。
在浏览器开发者工具（F12）→ Application → Local Storage 里可以看到和清除。

---

## 下一步可以做什么

| 功能 | 难度 | 说明 |
|------|------|------|
| 导出历史记录为txt/csv | ★☆☆ | 加一个按钮，遍历DOM收集内容 |
| API Key 本地加密存储 | ★★☆ | 用 Web Crypto API |
| 换成其他AI模型（GPT/通义）| ★★☆ | 改 `generate()` 里的fetch地址和headers |
| 多人共用（加后端）| ★★★ | 需要Node.js服务做API转发 |
