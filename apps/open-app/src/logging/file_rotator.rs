//! 日志文件轮转器
//!
//! 负责日志文件的轮转和旧日志清理

use anyhow::Result;
use chrono::{Duration, Local};
use std::fs;
use std::path::Path;

/// 日志文件轮转器
pub struct FileRotator {
    log_dir: String,
    file_prefix: String,
    retention_days: u32,
}

impl FileRotator {
    /// 创建新的文件轮转器
    pub fn new(log_dir: String, file_prefix: String, retention_days: u32) -> Self {
        Self {
            log_dir,
            file_prefix,
            retention_days,
        }
    }

    /// 清理过期的日志文件
    pub fn cleanup_old_logs(&self) -> Result<()> {
        let log_dir = Path::new(&self.log_dir);

        if !log_dir.exists() {
            fs::create_dir_all(log_dir)?;
        }

        let retention_threshold = Local::now()
            .checked_sub_signed(Duration::days(self.retention_days as i64))
            .ok_or_else(|| anyhow::anyhow!("Failed to calculate retention threshold"))?;

        for entry in fs::read_dir(log_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file()
                && let Some(filename) = path.file_name().and_then(|n| n.to_str())
                && filename.starts_with(&self.file_prefix)
                && filename.ends_with(".log")
                && let Ok(file_modified) = fs::metadata(&path)?.modified()
            {
                let modified_time: chrono::DateTime<Local> = file_modified.into();
                if modified_time < retention_threshold {
                    fs::remove_file(&path)?;
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_rotator_creation() {
        let rotator = FileRotator::new("./test_logs".to_string(), "test".to_string(), 7);
        assert_eq!(rotator.retention_days, 7);
    }

    #[test]
    fn test_cleanup_old_logs() {
        let rotator = FileRotator::new("./test_logs".to_string(), "test".to_string(), 7);
        let result = rotator.cleanup_old_logs();
        assert!(result.is_ok());
    }
}
