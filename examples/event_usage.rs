/// 事件系统使用示例
/// 演示如何创建、发送和处理 AppEvent
///
/// 运行示例：cargo run --example event_usage
use open_context_lib::{
    AppEvent, AppStateSnapshot, NotificationLevel, ServiceStopReason, ThemeMode, WindowId,
};

fn main() {
    println!("=== Tauri 事件系统使用示例 ===\n");

    // ============================================
    // 1. 应用生命周期事件
    // ============================================
    println!("1. 应用生命周期事件：");

    let app_started = AppEvent::AppStarted {
        version: "0.1.0".to_string(),
        timestamp: AppEvent::now(),
    };
    print_event(&app_started);

    let app_ready = AppEvent::AppReady {
        timestamp: AppEvent::now(),
    };
    print_event(&app_ready);

    // ============================================
    // 2. 窗口事件（多窗口实例）
    // ============================================
    println!("\n2. 窗口事件（多窗口实例）：");

    // 主窗口
    let main_window = WindowId::new("main-window");
    let window_created = AppEvent::WindowCreated {
        window_id: main_window.clone(),
        label: "Main Window".to_string(),
        timestamp: AppEvent::now(),
    };
    print_event(&window_created);

    let window_ready = AppEvent::WindowReady {
        window_id: main_window.clone(),
        timestamp: AppEvent::now(),
    };
    print_event(&window_ready);

    // 设置窗口
    let settings_window = WindowId::new("settings-window");
    let window_created_2 = AppEvent::WindowCreated {
        window_id: settings_window.clone(),
        label: "Settings".to_string(),
        timestamp: AppEvent::now(),
    };
    print_event(&window_created_2);

    // 窗口移动
    let window_moved = AppEvent::WindowMoved {
        window_id: main_window.clone(),
        x: 100,
        y: 200,
        timestamp: AppEvent::now(),
    };
    print_event(&window_moved);

    // 窗口调整大小
    let window_resized = AppEvent::WindowResized {
        window_id: main_window.clone(),
        width: 1280,
        height: 720,
        timestamp: AppEvent::now(),
    };
    print_event(&window_resized);

    // ============================================
    // 3. 应用状态变化事件
    // ============================================
    println!("\n3. 应用状态变化事件：");

    let old_state = AppStateSnapshot {
        version: "0.1.0".to_string(),
        active_windows: 1,
        services_running: vec!["node-server".to_string()],
        theme: ThemeMode::Light,
        locale: "en-US".to_string(),
    };

    let new_state = AppStateSnapshot {
        version: "0.1.0".to_string(),
        active_windows: 2,
        services_running: vec!["node-server".to_string(), "qdrant".to_string()],
        theme: ThemeMode::Dark,
        locale: "zh-CN".to_string(),
    };

    let state_changed = AppEvent::AppStateChanged {
        old_state,
        new_state,
        timestamp: AppEvent::now(),
    };
    print_event(&state_changed);

    // 主题变化
    let theme_changed = AppEvent::ThemeChanged {
        theme: ThemeMode::Dark,
        timestamp: AppEvent::now(),
    };
    print_event(&theme_changed);

    // 语言变化
    let locale_changed = AppEvent::LocaleChanged {
        locale: "zh-CN".to_string(),
        timestamp: AppEvent::now(),
    };
    print_event(&locale_changed);

    // ============================================
    // 4. 服务/进程事件
    // ============================================
    println!("\n4. 服务/进程事件：");

    let service_started = AppEvent::ServiceStarted {
        service_name: "node-server".to_string(),
        port: Some(4500),
        timestamp: AppEvent::now(),
    };
    print_event(&service_started);

    let service_stopped = AppEvent::ServiceStopped {
        service_name: "qdrant".to_string(),
        reason: ServiceStopReason::UserRequested,
        timestamp: AppEvent::now(),
    };
    print_event(&service_stopped);

    let service_error = AppEvent::ServiceError {
        service_name: "node-server".to_string(),
        error: "Connection refused".to_string(),
        timestamp: AppEvent::now(),
    };
    print_event(&service_error);

    // ============================================
    // 5. 系统事件
    // ============================================
    println!("\n5. 系统事件：");

    let notification = AppEvent::Notification {
        title: "索引完成".to_string(),
        body: "代码库已成功索引".to_string(),
        level: NotificationLevel::Success,
        timestamp: AppEvent::now(),
    };
    print_event(&notification);

    let update_available = AppEvent::UpdateAvailable {
        version: "0.2.0".to_string(),
        release_notes: Some("新功能：支持 Python 索引".to_string()),
        timestamp: AppEvent::now(),
    };
    print_event(&update_available);

    let network_status = AppEvent::NetworkStatusChanged {
        online: true,
        timestamp: AppEvent::now(),
    };
    print_event(&network_status);

    // ============================================
    // 6. 自定义事件
    // ============================================
    println!("\n6. 自定义事件：");

    let custom_event = AppEvent::Custom {
        name: "code:indexed".to_string(),
        payload: serde_json::json!({
            "repo_id": "my-repo",
            "files_indexed": 150,
            "symbols_extracted": 1250
        }),
        window_id: Some(main_window.clone()),
        timestamp: AppEvent::now(),
    };
    print_event(&custom_event);

    // ============================================
    // 7. 事件过滤（按窗口 ID）
    // ============================================
    println!("\n7. 事件过滤示例：");

    let events = vec![
        window_created,
        window_created_2,
        app_ready.clone(),
        custom_event,
    ];

    println!("所有与 main-window 相关的事件：");
    for event in events.iter() {
        if let Some(window_id) = event.window_id() {
            if window_id == &main_window {
                println!("  - {}", event.event_name());
            }
        }
    }

    // ============================================
    // 8. JSON 序列化/反序列化
    // ============================================
    println!("\n8. JSON 序列化/反序列化示例：");

    let event_json = serde_json::to_string_pretty(&app_ready).unwrap();
    println!("序列化：\n{}", event_json);

    let deserialized: AppEvent = serde_json::from_str(&event_json).unwrap();
    println!("反序列化成功：{}", deserialized.event_name());

    println!("\n=== 示例结束 ===");
}

/// 打印事件信息的辅助函数
fn print_event(event: &AppEvent) {
    println!(
        "  [{}] {} (timestamp: {})",
        if let Some(window_id) = event.window_id() {
            window_id.as_str()
        } else {
            "global"
        },
        event.event_name(),
        event.timestamp()
    );

    // 打印 JSON 表示（用于调试）
    if let Ok(json) = serde_json::to_string(event) {
        println!("    JSON: {}", json);
    }
}
