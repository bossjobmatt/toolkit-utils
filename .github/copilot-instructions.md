# GitHub Copilot Instructions for toolkit-utils

## 项目概述

toolkit-utils 是一个 monorepo 项目，包含以下包：
- **@bossjobmatt/toolkit-utils**: 数学工具库（加、减、乘、除函数）
- **@bossjobmatt/toolkit-cli**: 命令行字符串处理工具

## 项目结构

```
toolkit-utils/
├── packages/
│   ├── toolkit-utils/          # 数学工具库
│   │   ├── index.js            # 导出 add, subtract, multiply, divide 函数
│   │   ├── package.json
│   │   └── README.md
│   └── toolkit-cli/            # CLI 工具
│       ├── index.js            # Commander 命令行工具
│       ├── package.json
│       ├── bin/
│       │   └── setup-npm-github.js
│       └── src/
├── scripts/                    # 构建脚本
├── .github/                    # GitHub 配置
├── .changeset/                 # 版本管理配置
└── pnpm-workspace.yaml         # Workspace 配置
```

## 技术栈

- **包管理**: pnpm
- **版本管理**: changesets
- **发布仓库**: GitHub Packages (npm.pkg.github.com)
- **CLI 框架**: Commander.js
- **运行时**: Node.js

## 开发指南

### 代码风格

1. **使用 ES6+ 模块化**
   - 优先使用 `export` / `import` 语法
   - 对象解构用于清晰的 API

2. **函数编写**
   - 保持函数简洁、职责单一
   - 提供清晰的参数和返回值
   - 添加必要的注释说明功能

3. **变量命名**
   - 使用清晰的英文名称
   - 布尔变量使用 `is` 或 `has` 前缀
   - 常量使用 UPPER_SNAKE_CASE

### Workspace 操作

1. **依赖管理**
   ```bash
   pnpm install                 # 安装所有依赖
   pnpm add <package> -w        # 在 workspace 根目录添加依赖
   pnpm add <package> -r        # 在所有包中添加依赖
   ```

2. **构建和发布**
   ```bash
   pnpm build                   # 构建所有包
   pnpm release                 # 发布到 GitHub Packages
   ```

### 版本管理

- 使用 **changesets** 管理版本变化
- 每个功能/修复创建一个 changeset
- 遵循 Semantic Versioning (MAJOR.MINOR.PATCH)

### 发布流程

1. 创建 changeset 文件
2. 提交 PR 并获得 review
3. 合并到 main 分支
4. GitHub Actions 自动触发发布流程
5. 包发布到 GitHub Packages

## 最佳实践

### 添加新功能

1. **在适当的包中添加**
   - 数学函数 → toolkit-utils
   - CLI 命令 → toolkit-cli

2. **更新 package.json**
   - 检查 `main` 字段指向正确的入口文件
   - 更新 `files` 字段包含需要发布的文件

3. **编写测试和文档**
   - 更新包的 README.md
   - 提供使用示例

4. **创建 changeset**
   ```bash
   pnpm changeset
   ```

### 文件发布配置

- **publishConfig.registry**: 指向 GitHub Packages
- **私有 packages**: 通过作用域 (@bossjobmatt) 标识

### GitHub Actions

- **release-package.yml**: 自动发布流程
- **tag-on-version-change.yml**: 版本变更时自动打标签

## 常见任务

### 修改 toolkit-utils 函数

编辑 `packages/toolkit-utils/index.js`：
- 保持导出的函数签名一致性
- 更新对应的 README.md
- 创建 changeset 记录变化

### 添加新的 CLI 命令

编辑 `packages/toolkit-cli/index.js`：
- 使用 Commander.js 的 `program.command()` 添加新命令
- 定义清晰的命令描述和参数
- 更新 CLI README.md 文档

## 环境设置

### npm 注册表配置 (.npmrc)

```
@bossjobmatt:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_ACCESS_TOKEN
```

### 获取 GitHub Token

1. 在 GitHub 上创建 Personal Access Token
2. 分配 `packages:read` 和 `packages:write` 权限
3. 保存到 `.npmrc` 文件

## 提交规范

- 使用英文编写提交信息
- 遵循 conventional commits 格式
- 示例: `feat: add new math function` 或 `fix: correct calculation logic`

## 注意事项

1. **私有包**: @bossjobmatt 作用域的包是私有的，仅在 GitHub Packages 上发布
2. **Monorepo 依赖**: 内部包之间依赖需要正确配置版本号
3. **Node.js 兼容性**: 检查代码对 Node.js 版本的兼容性

---

**最后更新**: 2025年11月28日
