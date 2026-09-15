# 玉子 QQ 独立版

从玉子手机中保留“小手机 Shell + 设置 App + 完整 QQ”垂直链路的 SillyTavern 第三方扩展。

## 保留功能

- 小手机悬浮窗、拖拽、缩放、关闭、位置与外观设置
- QQ 联系人、助手、群聊、会话、消息、主动消息及 IndexedDB 持久化
- 图片、语音、视频、表情、转账等现有 QQ 业务
- 自建 OpenAI 兼容 API 预设，可拉取模型、保存并为 QQ 选择当前 API
- AI 指令预设、QQ 提示词、SillyTavern 上下文与只读世界书注入
- QQ 图片生成、提示词翻译与媒体上传

本版不依赖神·数据库，也不提供数据库表格、Theater、Fusion、变量管理和数据库当前 API。QQ 自有 IndexedDB 数据库仍保留。

## 安装

在 SillyTavern 的“扩展”页面选择“安装扩展”，填写：

```text
https://github.com/cnv-bit/shouji
```

安装完成后重启 SillyTavern。测试时请先卸载原版玉子手机，避免两套扩展同时挂载。

## 开发与发布

```powershell
npm install
npm run build
npm run check
```

`manifest.json` 直接加载以下构建产物，因此发布时必须一并提交 `dist/`：

- `dist/yuzi-qq-only.bundle.js`
- `dist/yuzi-qq-only.bundle.css`

计划内契约检查只覆盖 QQ 路由、生命周期、设置 Facade 与资源链路；最终交互与宿主兼容性由 SillyTavern 实机验收。
