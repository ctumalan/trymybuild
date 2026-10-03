import test from 'node:test';
import assert from 'node:assert/strict';
import { isHardRefreshRequest } from '../src/server/hard-refresh.mjs';

test('ordinary Chrome reload and navigation preserve display preferences', () => {
  for (const values of [{}, { 'cache-control': 'max-age=0' }]) {
    assert.equal(isHardRefreshRequest(new Headers(values)), false);
  }
});

test('Chrome cache-bypass reload resets display preferences', () => {
  for (const values of [
    { 'cache-control': 'no-cache', pragma: 'no-cache' },
    { 'cache-control': 'max-age=0, no-cache' },
    { pragma: 'no-cache' },
  ]) assert.equal(isHardRefreshRequest(new Headers(values)), true);
});
