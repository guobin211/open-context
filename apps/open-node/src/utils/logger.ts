import pino from 'pino';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const isDev = process.env.NODE_ENV !== 'production';
const LOG_DIR = process.env.LOG_DIR || path.join(os.homedir(), '.open-context', 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info');
const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '7', 10);
const LOG_TARGET = process.env.LOG_TARGET || (isDev ? 'both' : 'file');

async function ensureLogDir() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

async function cleanupOldLogs() {
  try {
    const files = await fs.readdir(LOG_DIR);
    const retentionThreshold = new Date();
    retentionThreshold.setDate(retentionThreshold.getDate() - LOG_RETENTION_DAYS);

    for (const file of files) {
      if (file.startsWith('open-node') && file.endsWith('.log')) {
        const filePath = path.join(LOG_DIR, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime < retentionThreshold) {
          await fs.unlink(filePath);
        }
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
  }
}

async function getLogFilePath() {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `open-node-${date}.log`);
}

async function createLogger() {
  await ensureLogDir();
  await cleanupOldLogs();

  const streams: pino.DestinationStream[] = [];

  if (LOG_TARGET === 'console' || LOG_TARGET === 'both') {
    const pretty = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    });
    streams.push(pretty as pino.DestinationStream);
  }

  if (LOG_TARGET === 'file' || LOG_TARGET === 'both') {
    const logFilePath = await getLogFilePath();
    streams.push(pino.destination(logFilePath));
  }

  if (streams.length === 0) {
    const pretty = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    });
    streams.push(pretty as pino.DestinationStream);
  }

  const logger = pino(
    {
      level: LOG_LEVEL
    },
    pino.multistream(streams)
  );

  return logger;
}

const loggerPromise = createLogger().catch((error) => {
  console.error('Failed to initialize logger:', error);
  process.exit(1);
});

const logger = await loggerPromise;

export default logger;

export async function setLevel(level: string) {
  logger.level = level;
}

export async function getLevel() {
  return logger.level;
}
