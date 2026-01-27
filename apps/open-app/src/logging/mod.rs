//! 统一日志初始化模块
//!
//! 提供 init 函数初始化日志系统

use crate::logging::file_rotator::FileRotator;
use crate::logging::log_config::{LogConfig, LogTarget};
use anyhow::Result;
use log::Level;
use simplelog::{CombinedLogger, Config, SimpleLogger, TermLogger};

pub mod file_rotator;
pub mod log_config;

/// 初始化日志系统
///
/// # 参数
///
/// * `prefix` - 日志文件前缀（如 "open-app"、"open-node"、"open-web"）
///
/// # 返回
///
/// 返回 Result<()>，成功返回 Ok(())，失败返回错误信息
///
/// # 示例
///
/// ```no_run
/// use open_app_lib::logging::init;
///
/// #[tokio::main]
/// async fn main() -> Result<()> {
///     init("open-app")?;
///     Ok(())
/// }
/// ```
pub fn init(prefix: &str) -> Result<()> {
    let config = LogConfig::from_env(prefix);

    let level_filter = match config.level {
        Level::Trace => simplelog::LevelFilter::Trace,
        Level::Debug => simplelog::LevelFilter::Debug,
        Level::Info => simplelog::LevelFilter::Info,
        Level::Warn => simplelog::LevelFilter::Warn,
        Level::Error => simplelog::LevelFilter::Error,
    };

    let mut loggers: Vec<Box<dyn simplelog::SharedLogger>> = vec![];

    match config.target {
        LogTarget::Console | LogTarget::Both => {
            let term_logger = TermLogger::new(
                level_filter,
                Config::default(),
                simplelog::TerminalMode::Mixed,
                simplelog::ColorChoice::Auto,
            );
            loggers.push(term_logger);
        }
        _ => {}
    }

    match config.target {
        LogTarget::File | LogTarget::Both => {
            let log_file_path = config.get_log_file_path();
            let file = std::fs::OpenOptions::new()
                .append(true)
                .create(true)
                .open(&log_file_path)
                .map_err(|e| anyhow::anyhow!("Failed to open {}: {}", log_file_path, e))?;

            loggers.push(simplelog::WriteLogger::new(
                level_filter,
                Config::default(),
                file,
            ));

            let rotator = FileRotator::new(
                config.log_dir.clone(),
                config.file_prefix.clone(),
                config.retention_days,
            );
            let _ = rotator.cleanup_old_logs();
        }
        _ => {}
    }

    if loggers.is_empty() {
        let simple_logger = SimpleLogger::new(level_filter, Config::default());
        CombinedLogger::init(vec![simple_logger])
            .map_err(|e| anyhow::anyhow!("Failed to initialize logger: {}", e))?;
    } else {
        CombinedLogger::init(loggers)
            .map_err(|e| anyhow::anyhow!("Failed to initialize logger: {}", e))?;
    }

    log::info!(
        "Logger initialized with level: {:?}, target: {:?}",
        config.level,
        config.target
    );

    Ok(())
}

/// 初始化指定端口的日志系统（供 Tauri 插件调用）
///
/// # 参数
///
/// * `component` - 组件名称（"app", "node", 或 "web"）
///
/// # 返回
///
/// 返回 Result<()>，成功返回 Ok(())，失败返回错误信息
pub fn init_component(component: &str) -> Result<()> {
    let prefix = match component {
        "app" => "open-app",
        "node" => "open-node",
        "web" => "open-web",
        _ => "open-app",
    };
    init(prefix)
}
