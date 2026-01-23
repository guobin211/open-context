/**
 * 日志级别常量
 */
const logLevel = {
  LOG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4
} as const;

export type LogLevel = (typeof logLevel)[keyof typeof logLevel];

/**
 * 当前日志级别，生产环境默认过滤log级别
 */
let currentLevel: LogLevel = import.meta.env.PROD ? logLevel.INFO : logLevel.LOG;

/**
 * 设置日志级别
 */
function setLevel(level: LogLevel): void {
  currentLevel = level;
}

/**
 * 获取当前日志级别
 */
function getLevel(): LogLevel {
  return currentLevel;
}

/**
 * 格式化日志前缀
 */
function formatPrefix(level: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}]`;
}

/**
 * 输出log级别日志
 */
function log(...args: unknown[]): void {
  if (currentLevel <= logLevel.LOG) {
    console.log(formatPrefix('LOG'), ...args);
  }
}

/**
 * 输出info级别日志
 */
function info(...args: unknown[]): void {
  if (currentLevel <= logLevel.INFO) {
    console.info(formatPrefix('INFO'), ...args);
  }
}

/**
 * 输出warn级别日志
 */
function warn(...args: unknown[]): void {
  if (currentLevel <= logLevel.WARN) {
    console.warn(formatPrefix('WARN'), ...args);
  }
}

/**
 * 输出error级别日志
 */
function error(...args: unknown[]): void {
  if (currentLevel <= logLevel.ERROR) {
    console.error(formatPrefix('ERROR'), ...args);
  }
}

export const logger = {
  logLevel,
  setLevel,
  getLevel,
  log,
  info,
  warn,
  error
};
