use open_context_lib::app_config::{AppConfig, ConfigManager, init_app_dirs};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== App Config Example ===\n");

    // 1. 初始化应用目录
    println!("1. Initializing app directories...");
    init_app_dirs()?;
    println!("   ✓ App directories created\n");

    // 2. 加载配置
    println!("2. Loading configuration...");
    let config = AppConfig::load()?;
    println!("   ✓ Config loaded");
    println!("   - Version: {}", config.version);
    println!("   - Node server port: {}", config.node_server.port);
    println!("   - Qdrant URL: {}", config.qdrant.url);
    println!("   - Log level: {}\n", config.log_level);

    // 3. 使用 ConfigManager 修改配置
    println!("3. Using ConfigManager to update configuration...");
    let manager = ConfigManager::new()?;

    manager.update(|cfg| {
        cfg.node_server.port = 5000;
        cfg.log_level = "debug".to_string();
        Ok(())
    })?;
    println!("   ✓ Configuration updated");

    let updated_config = manager.get();
    println!("   - New port: {}", updated_config.node_server.port);
    println!("   - New log level: {}\n", updated_config.log_level);

    // 4. 重置配置
    println!("4. Resetting configuration to defaults...");
    manager.update(|cfg| {
        cfg.node_server.port = 4500;
        cfg.log_level = "info".to_string();
        Ok(())
    })?;
    println!("   ✓ Configuration reset to defaults\n");

    println!("Example completed successfully!");

    Ok(())
}
