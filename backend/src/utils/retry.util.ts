import { logger } from "./logger";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableBlockchainError(error: unknown): boolean {
  const msg = (error as Error)?.message?.toLowerCase() ?? "";
  const code = (error as { code?: string })?.code ?? "";

  const retryablePatterns = [
    "timeout",
    "network",
    "econnreset",
    "econnrefused",
    "socket hang up",
    "nonce too low",
    "nonce too high",
    "replacement transaction underpriced",
    "already known",
    "rate limit",
    "503",
    "502",
    "429",
  ];

  if (code === "TIMEOUT" || code === "NETWORK_ERROR" || code === "SERVER_ERROR") {
    return true;
  }

  return retryablePatterns.some((p) => msg.includes(p));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelayMs: number;
    label: string;
  }
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableBlockchainError(error) || attempt === options.maxRetries) {
        throw error;
      }

      const delay = options.baseDelayMs * Math.pow(2, attempt - 1);
      logger.warn(`${options.label} failed — retry ${attempt}/${options.maxRetries} in ${delay}ms`, {
        error: (error as Error).message,
      });
      await sleep(delay);
    }
  }

  throw lastError;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}
