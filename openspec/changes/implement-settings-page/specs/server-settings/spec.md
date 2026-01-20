# 功能规范：服务器设置

## 概述

服务器设置页面允许用户配置 Open-Node 后端服务、MCP 服务和 HTTP API 开关。

## 新增需求

### 需求：用户可以配置 Open-Node 服务

应用**必须**提供 Open-Node 服务配置功能，用户**必须**能够配置服务端口、启用/禁用服务器和设置自动启动。

#### 场景：用户更改服务端口

**操作步骤**：

1. 用户在"服务端口"输入框输入 5000
2. 点击"保存"

**预期结果**：

- 系统提示："端口变更需要重启服务器"
- 显示"重启服务器"按钮
- 用户点击后，服务器重启并监听新端口

**边界情况**：

- 端口被占用：显示错误"端口 5000 已被占用"
- 端口超出范围（1024-65535）：显示验证错误

### 需求：用户可以启用/禁用 MCP 服务

应用**必须**提供 MCP 服务开关，用户**必须**能够启用或禁用 Model Context Protocol 服务。

#### 场景：用户启用 MCP 服务

**操作步骤**：

1. 用户启用"MCP 服务"开关

**预期结果**：

- Open-Node 服务器启动 MCP 服务器（WebSocket）
- 显示 MCP 服务地址（如 `ws://localhost:4500/mcp`）
- 其他应用可以通过 MCP 协议连接

### 需求：用户可以查看服务状态

应用**必须**显示服务运行状态，包括服务状态指示器、服务地址和运行时长。

#### 场景：用户查看服务运行状态

**预期结果**：

- 显示服务状态指示器：
  - 🟢 运行中
  - 🔴 已停止
  - 🟡 启动中
- 显示服务地址：`http://localhost:4500`
- 显示服务启动时间："已运行 2 小时 30 分"

## UI 布局

```
┌─────────────────────────────────────────────────┐
│  服务器设置                                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  Open-Node 服务器                                │
│  状态：🟢 运行中                                  │
│  地址：http://localhost:4500                     │
│  已运行：2 小时 30 分                             │
│                                                 │
│  启用服务器                            [  ON ]  │
│                                                 │
│  服务端口                                        │
│  ┌────────────────────────────────────────┐    │
│  │ 4500                                    │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  自动启动服务器                        [  ON ]  │
│  应用启动时自动启动 Open-Node 服务器             │
│                                                 │
│  [重启服务器]                                    │
│                                                 │
│  ─────────────────────────────────────────      │
│                                                 │
│  MCP 服务                              [ OFF ]  │
│  启用 Model Context Protocol 服务               │
│  地址：ws://localhost:4500/mcp                   │
│                                                 │
│  ─────────────────────────────────────────      │
│                                                 │
│  HTTP API                              [  ON ]  │
│  启用 RESTful API 服务                           │
│  地址：http://localhost:4500/api                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 技术实现

### 类型定义

```typescript
interface ServerConfig {
  nodeServerEnabled: boolean;
  nodeServerUrl: string;
  nodeServerPort: number;
  autoStartServer: boolean;
  mcpEnabled: boolean;
  httpApiEnabled: boolean;
}

interface ServerStatus {
  isRunning: boolean;
  uptime?: number; // 秒
  address?: string;
}
```

### Tauri 命令

```rust
#[tauri::command]
async fn restart_node_server(port: u16) -> Result<(), String> {
    // 重启 Node 服务器
}

#[tauri::command]
async fn get_server_status() -> Result<ServerStatus, String> {
    // 获取服务器状态
}
```

## 数据验证

- 端口范围：1024-65535
- 服务地址格式：`http://host:port`

## 相关功能

- **通用设置**：自动启动应用与自动启动服务器关联
- **云存储设置**：文件同步可能依赖 Node 服务器
