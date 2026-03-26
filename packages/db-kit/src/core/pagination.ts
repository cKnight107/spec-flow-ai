import type { CursorPageInput, CursorPageResult } from './types.js';

/**
 * 游标编码数据
 */
interface CursorData {
  /** 主键或排序字段的值 */
  value: string | number;
  /** 唯一标识（用于平局时的稳定排序） */
  tieBreaker: string | number;
}

/**
 * 将游标数据编码为 base64 字符串
 */
export function encodeCursor(data: CursorData): string {
  const json = JSON.stringify(data);
  return Buffer.from(json, 'utf-8').toString('base64url');
}

/**
 * 将 base64 游标解码为游标数据
 */
export function decodeCursor(cursor: string): CursorData {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    return JSON.parse(json) as CursorData;
  } catch {
    throw new Error(`Invalid cursor: ${cursor}`);
  }
}

/**
 * 从游标分页输入提取 limit（带默认值保护）
 */
export function normalizePageInput(input: CursorPageInput): {
  limit: number;
  cursor?: CursorData;
} {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const cursor = input.cursor ? decodeCursor(input.cursor) : undefined;
  return { limit, cursor };
}

/**
 * 构建游标分页结果
 */
export function buildPageResult<T extends Record<string, unknown>>(
  items: T[],
  limit: number,
  cursorField: keyof T,
  tieBreakerField: keyof T,
): CursorPageResult<T> {
  if (items.length === 0) {
    return { items: [], nextCursor: undefined };
  }

  if (items.length <= limit) {
    return { items, nextCursor: undefined };
  }

  const page = items.slice(0, limit);
  if (page.length === 0) {
    return { items: page, nextCursor: undefined };
  }

  const last = page[page.length - 1]!;
  const nextCursor = encodeCursor({
    value: last[cursorField] as string | number,
    tieBreaker: last[tieBreakerField] as string | number,
  });

  return { items: page, nextCursor };
}
