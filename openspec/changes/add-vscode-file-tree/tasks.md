## 1. Rust 后端实现

- [x] 1.1 添加依赖项到 Cargo.toml(notify、tokio、walkdir 等)
- [x] 1.2 实现 FileTreeNode 数据结构
- [x] 1.3 实现全局目录缓存(DIR_CACHE)
- [x] 1.4 实现 read_dir_on_demand 命令(按需读取目录)
- [x] 1.5 实现 watch_directory 命令(文件监听)
- [x] 1.6 实现 clear_dir_cache 命令(清除缓存)
- [x] 1.7 实现 create_file 命令(创建文件)
- [x] 1.8 实现 rename_path 命令(重命名)
- [x] 1.9 实现 delete_path 命令(删除)
- [x] 1.10 实现 search_files 命令(文件搜索)
- [x] 1.11 注册所有 Tauri 命令

## 2. 前端依赖安装

- [x] 2.1 安装 @tanstack/react-virtual
- [x] 2.2 安装 path-browserify 及类型定义

## 3. 前端状态管理

- [x] 3.1 实现 FileTreeNode 类型定义
- [x] 3.2 实现 FileTreeState 接口
- [x] 3.3 实现 FileTreeService 类(核心业务逻辑)
- [x] 3.4 实现 readDir 方法(读取目录)
- [x] 3.5 实现 toggleExpand 方法(展开/折叠)
- [x] 3.6 实现 initWatcher 方法(初始化监听)
- [x] 3.7 实现 getFlattenedNodes 方法(扁平化树节点)
- [x] 3.8 实现 CRUD 方法(createFile、rename、delete)

## 4. 前端虚拟列表组件

- [x] 4.1 实现 FileTreeItem 组件(单个节点)
- [x] 4.2 实现 FileTree 主组件
- [x] 4.3 集成 @tanstack/react-virtual 虚拟滚动
- [x] 4.4 处理节点展开/折叠交互
- [x] 4.5 处理加载状态显示
- [x] 4.6 监听 file-tree-state-change 事件

## 5. 高级功能

- [x] 5.1 实现右键菜单功能
- [x] 5.2 实现路径导航面包屑组件
- [x] 5.3 实现文件搜索组件
- [ ] 5.4 添加图标支持(文件/目录)

## 6. 性能优化

- [x] 6.1 实现文件监听防抖机制(50ms)
- [x] 6.2 优化虚拟列表渲染性能
- [x] 6.3 实现缓存过期机制
- [ ] 6.4 添加性能监控工具

## 7. 跨平台适配

- [x] 7.1 处理 Windows/macOS/Linux 路径差异
- [x] 7.2 实现隐藏文件判断(平台特定)
- [x] 7.3 配置 tauri.conf.json 文件系统权限

## 8. 测试与文档

- [x] 8.1 编写 Rust 单元测试
- [ ] 8.2 编写前端组件测试
- [ ] 8.3 手动测试大目录性能(10 万+文件)
- [ ] 8.4 更新技术文档
