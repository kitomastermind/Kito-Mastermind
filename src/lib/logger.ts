const PII_KEYS = new Set([
  'client_name',
  'clientName',
  'client_phone',
  'clientPhone',
  'client_email',
  'clientEmail',
  'notes',
  'phone',
  'email',
  'password',
  'access_token_enc',
  'accessTokenEnc',
  'refresh_token_enc',
  'refreshTokenEnc',
]);

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function redact(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = PII_KEYS.has(key) ? '[redacted]' : redact(nested);
    }
    return out;
  }
  return value;
}

function emit(
  level: LogLevel,
  message: string,
  extra?: Record<string, unknown>,
): void {
  const line = JSON.stringify({
    level,
    message,
    ts: new Date().toISOString(),
    ...(extra ? (redact(extra) as Record<string, unknown>) : {}),
  });
  const sink = level === 'error' ? process.stderr : process.stdout;
  sink.write(`${line}\n`);
}

export const logger = {
  debug(message: string, extra?: Record<string, unknown>): void {
    emit('debug', message, extra);
  },
  info(message: string, extra?: Record<string, unknown>): void {
    emit('info', message, extra);
  },
  warn(message: string, extra?: Record<string, unknown>): void {
    emit('warn', message, extra);
  },
  error(message: string, extra?: Record<string, unknown>): void {
    emit('error', message, extra);
  },
};
