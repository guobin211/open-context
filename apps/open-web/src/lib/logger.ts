import { invoke } from '@tauri-apps/api/core';

const LOG_LEVEL = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

let currentLevel: LogLevel = import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO;

async function setLevel(level: LogLevel) {
  currentLevel = level;
  await invoke('plugin:log|set_level', { level: level.toString() });
}

async function getLevel() {
  return currentLevel;
}

async function formatPrefix(level: string) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}]`;
}

async function log(...args: unknown[]) {
  if (currentLevel <= LOG_LEVEL.TRACE) {
    const prefix = await formatPrefix('LOG');
    console.log(prefix, ...args);
  }
}

async function trace(...args: unknown[]) {
  if (currentLevel <= LOG_LEVEL.TRACE) {
    const prefix = await formatPrefix('TRACE');
    console.log(prefix, ...args);
    await invoke('plugin:log|trace', { message: args.map(String).join(' ') });
  }
}

async function debug(...args: unknown[]) {
  if (currentLevel <= LOG_LEVEL.DEBUG) {
    const prefix = await formatPrefix('DEBUG');
    console.debug(prefix, ...args);
    await invoke('plugin:log|debug', { message: args.map(String).join(' ') });
  }
}

async function info(...args: unknown[]) {
  if (currentLevel <= LOG_LEVEL.INFO) {
    const prefix = await formatPrefix('INFO');
    console.info(prefix, ...args);
    await invoke('plugin:log|info', { message: args.map(String).join(' ') });
  }
}

async function warn(...args: unknown[]) {
  if (currentLevel <= LOG_LEVEL.WARN) {
    const prefix = await formatPrefix('WARN');
    console.warn(prefix, ...args);
    await invoke('plugin:log|warn', { message: args.map(String).join(' ') });
  }
}

async function error(...args: unknown[]) {
  if (currentLevel <= LOG_LEVEL.ERROR) {
    const prefix = await formatPrefix('ERROR');
    console.error(prefix, ...args);
    await invoke('plugin:log|error', { message: args.map(String).join(' ') });
  }
}

export const logger = {
  logLevel: LOG_LEVEL,
  setLevel,
  getLevel,
  log,
  trace,
  debug,
  info,
  warn,
  error
};
