//! 应用状态管理模块
//!
//! 负责管理应用运行时的各种状态数据。

mod app_config;
mod app_state_chat;
mod app_state_file;
mod app_state_folder;
mod app_state_link;
mod app_state_note;
mod app_state_repo;
mod app_state_task;
mod app_state_terminal;
mod app_state_webview;
mod app_state_workspace;
mod database;
mod state;

pub use app_config::*;
pub use app_state_chat::*;
pub use app_state_file::*;
pub use app_state_folder::*;
pub use app_state_link::*;
pub use app_state_note::*;
pub use app_state_repo::*;
pub use app_state_task::*;
pub use app_state_terminal::*;
pub use app_state_webview::*;
pub use app_state_workspace::*;
pub use database::*;
pub use state::*;
