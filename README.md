# SVG Editor CLI

高级软件开发 Lab1 Phase 1。TypeScript 面向对象实现，支持六种 SVG 图形、树形组合、Command 撤销重做与 SVG 文件读写。

需要 Node.js 22+。完整设计、复核纠正过程及质量说明见 [doc/README.md](doc/README.md)。

## 安装与运行

```sh
npm install
npm run cli
```

也可使用 pnpm（项目提供 pnpm-lock.yaml，推荐冻结安装）：

```sh
pnpm install --frozen-lockfile
pnpm run cli
```

本机已经安装依赖，在 Windows 项目目录直接执行 `run-cli.cmd`（PowerShell 中为 `.\run-cli.cmd`）即可编译并启动，不要求 npm 在 PATH 中。按 Ctrl+C 或输入流 EOF 退出。文件路径以启动时的工作目录为基准；Windows 启动脚本会切换到工程目录。

```text
svg> init 800 600
svg> create g scene
svg> create rect r1 20 30 120 60 #4a90d9 in scene
svg> create text title 35 65 "开始" in scene
svg> move scene 10 20
svg> undo
svg> tree
svg> save my-diagram.svg
```

输出 `.svg` 可直接拖入浏览器预览。省略 fill/stroke 时不生成该属性，使用 SVG 默认值（线条默认不可见，需要指定 stroke）。

## 命令

| 类别 | 语法 |
|---|---|
| 文档 | `init [w] [h]`、`read <file.svg>`、`save [file.svg]`、`canvas [w h]` |
| 创建矩形 | `create rect <id> <x> <y> <w> <h> [fill]` |
| 创建圆 | `create circle <id> <cx> <cy> <r> [fill]` |
| 创建椭圆 | `create ellipse <id> <cx> <cy> <rx> <ry> [fill]` |
| 创建线条 | `create line <id> <x1> <y1> <x2> <y2> [stroke]` |
| 创建文字 | `create text <id> <x> <y> "content"` |
| 创建容器 | `create g <id>` |
| 创建时指定父级 | 所有 create 均可追加 `in <containerId>` |
| 编辑 | `delete <id>`、`move <id> <dx> <dy>`、`scale <id> <factor>`、`set <id> <attr> <value>` |
| 层级 | `group <newGid> <id1> [id2...]`、`ungroup <gid>`、`addto <gid> <id>` |
| 同级绘制顺序 | `front <id>`（后绘制）、`back <id>`（先绘制） |
| 显示 | `tree [id]`、`show <id>`、`help` |
| 历史 | `undo`、`redo` |

每个图形（含组）的 id 唯一且区分大小写。空行及以 # 开头的整行注释被跳过；不支持行尾注释，因为 # 同时用于颜色。含空格的参数用双引号包裹，引号内可用 `\"` 和 `\\` 转义。参数或编辑失败输出一行 `error:`，不会修改文档或撤销历史。

`set` 允许公共属性 fill/stroke/stroke-width、各类型的几何属性和 text 类型的 text 内容。缩放以 SVG 原点为中心，同时缩放位置和尺寸，不缩放描边宽度；组递归操作子节点。组的公共样式按 SVG 继承生效。

每条编辑是一个撤销单元；成功的新编辑会清空 redo。成功执行 init/read/save 或修改画布尺寸会清空历史并建立屏障，下一次成功编辑后解除。canvas 查询不影响历史。save 无参数使用上次成功 read/save 的路径；init 清除已知路径。

## 回放案例与验证

从项目根目录执行（PowerShell）：

```powershell
pnpm run build
Push-Location examples
Get-Content -Raw flowchart.commands | node ../dist/src/bootstrap/Main.js
Get-Content -Raw session.commands | node ../dist/src/bootstrap/Main.js
Pop-Location
pnpm run render:example
```

session.commands 中有两条有意保留的预期错误；失败后程序继续执行。回放会覆盖 examples 中同名的示例输出。流程图对应作业第 6.1 节版本 A；line 没有箭头标记，与作业本阶段示例一致。

![流程图输出预览](examples/flowchart.png)

```sh
pnpm run typecheck
pnpm test
```

测试覆盖领域不变量、编辑失败回滚、撤销重做、层级顺序、命令解析、SVG 往返、真实 CLI 子进程及独立渲染器检查；架构检查验证模块依赖和一类一文件。`render:example` 使用开发依赖 resvg 生成 PNG，CLI 运行时不依赖渲染器。

## 本阶段边界

只实现 rect/circle/ellipse/line/text/g 六种内置类型，`create box` 返回 unknown shape type。导入支持公共样式、基本几何、px 画布尺寸、与画布一致的 viewBox；缺 id 自动补齐并警告，重复 id 拒绝。g 的 data-kind 降级为普通组。

暂不支持 transform、style、字体属性、path/use、复杂 XML 子元素和不同的 viewBox 坐标映射；这些内容明确报错，不静默丢失。全文档快照适合课程规模文档，大规模文件可进一步优化为增量历史。
