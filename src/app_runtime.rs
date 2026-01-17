/// 负责检查用户的电脑是否缺少运行应用所需的依赖项，如果缺少则自动安装依赖项
/// 目前支持的依赖项有：
/// 1. Node.js
/// 2. Python
/// 3. Go
/// 4. surrealdb
/// 5. qdrant
/// 6. llm service
pub struct AppRuntime {
    pub items: Vec<AppRuntimeItem>,
}

pub struct AppRuntimeItem {
    pub name: String,
    pub version: String,
    pub install_cmd: String,
    pub uninstall_cmd: String,
    pub check_cmd: String,
    pub is_installed: bool,
}

pub enum AppRuntimeError {}
