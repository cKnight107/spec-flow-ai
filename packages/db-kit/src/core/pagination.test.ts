import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPageResult, decodeCursor, encodeCursor, normalizePageInput } from './pagination.js';

test('encodeCursor and decodeCursor round-trip cursor data', () => {
  const cursor = encodeCursor({
    value: '2026-03-15T00:00:00.000Z',
    tieBreaker: 42,
  });

  assert.deepEqual(decodeCursor(cursor), {
    value: '2026-03-15T00:00:00.000Z',
    tieBreaker: 42,
  });
});

test('normalizePageInput clamps limit into supported range', () => {
  assert.deepEqual(normalizePageInput({ limit: 0 }), { limit: 1, cursor: undefined });
  assert.deepEqual(normalizePageInput({ limit: 500 }), { limit: 100, cursor: undefined });
});

test('buildPageResult returns nextCursor when extra rows are present', () => {
  const page = buildPageResult(
    [
      { id: 1, createdAt: '2026-03-15T00:00:00.000Z' },
      { id: 2, createdAt: '2026-03-15T00:01:00.000Z' },
      { id: 3, createdAt: '2026-03-15T00:02:00.000Z' },
    ],
    2,
    'createdAt',
    'id',
  );

  assert.equal(page.items.length, 2);
  assert.deepEqual(decodeCursor(page.nextCursor ?? ''), {
    value: '2026-03-15T00:01:00.000Z',
    tieBreaker: 2,
  });
});

test('buildPageResult omits nextCursor when rows do not exceed limit', () => {
  const page = buildPageResult([{ id: 1, createdAt: '2026-03-15T00:00:00.000Z' }], 2, 'createdAt', 'id');

  assert.equal(page.nextCursor, undefined);
  assert.deepEqual(page.items, [{ id: 1, createdAt: '2026-03-15T00:00:00.000Z' }]);
});
