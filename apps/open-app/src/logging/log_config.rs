//! 日志配置模块
//!
//! 提供日志级别、输出目标等配置管理

use crate::app_state::AppConfig;
use log::Level;
use std::env;

/// 日志输出目标
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogTarget {
    /// 仅输出到控制台
    Console,
    /// 仅输出到文件
    File,
    /// 同时输出到控制台和文件
    Both,
}

/// 日志配置
#[derive(Debug, Clone)]
pub struct LogConfig {
    /// 日志级别
    pub level: Level,
    /// 输出目标
    pub target: LogTarget,
    /// 日志目录路径
    pub log_dir: String,
    /// 日志文件前缀
    pub file_prefix: String,
    /// 日志保留天数
    pub retention_days: u32,
}

impl LogConfig {
    /// 从环境变量创建默认配置
    ///
    /// 环境变量：
    /// - `LOG_LEVEL`: 日志级别（trace/debug/info/warn/error），默认：debug（开发）/info（生产）
    /// - `LOG_TARGET`: 输出目标（console/file/both），默认：both（开发）/file（生产）
    /// - `LOG_DIR`: 日志目录，默认：`~/.open-context/logs/`
    /// - `LOG_RETENTION_DAYS`: 日志保留天数，默认：7
    pub fn from_env(prefix: &str) -> Self {
        let is_dev = cfg!(debug_assertions);
        let log_level = env::var("LOG_LEVEL")
            .ok()
            .and_then(|s| s.parse::<Level>().ok())
            .unwrap_or(if is_dev { Level::Debug } else { Level::Info });

        let log_target = env::var("LOG_TARGET")
            .ok()
            .and_then(|s| match s.to_lowercase().as_str() {
                "console" => Some(LogTarget::Console),
                "file" => Some(LogTarget::File),
                "both" => Some(LogTarget::Both),
                _ => None,
            })
            .unwrap_or({
                if is_dev {
                    LogTarget::Both
                } else {
                    LogTarget::File
                }
            });

        let log_dir = env::var("LOG_DIR").unwrap_or_else(|_| {
            AppConfig::base_dir()
                .join("logs")
                .to_string_lossy()
                .to_string()
        });

        let retention_days = env::var("LOG_RETENTION_DAYS")
            .ok()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(7);

        Self {
            level: log_level,
            target: log_target,
            log_dir,
            file_prefix: prefix.to_string(),
            retention_days,
        }
    }

    /// 获取日志文件路径（按天）
    pub fn get_log_file_path(&self) -> String {
        use chrono::Local;
        let date = Local::now().format("%Y-%m-%d").to_string();
        let filename = format!("{}-{}.log", self.file_prefix, date);
        std::path::Path::new(&self.log_dir)
            .join(&filename)
            .to_string_lossy()
            .to_string()
    }
}
