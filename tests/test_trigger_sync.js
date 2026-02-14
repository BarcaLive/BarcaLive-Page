import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { onRequest } from '../functions/api/trigger-sync.js';

describe('trigger-sync', () => {
  let originalFetch;
  let fetchCalls = [];

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchCalls = [];
    // Mock fetch to simulate downstream worker response
    global.fetch = async (url, options) => {
      fetchCalls.push({ url, options });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('should return 401 Unauthorized without secret', async () => {
    const context = {
      request: new Request('http://localhost/api/trigger-sync'),
      env: {
        SYNC_SECRET: 'super-secret-key'
      }
    };

    const response = await onRequest(context);

    assert.strictEqual(response.status, 401);
    assert.strictEqual(fetchCalls.length, 0, 'Should not call downstream worker');
  });

  test('should return 401 Unauthorized with incorrect secret', async () => {
    const context = {
      request: new Request('http://localhost/api/trigger-sync?secret=wrong-key'),
      env: {
        SYNC_SECRET: 'super-secret-key'
      }
    };

    const response = await onRequest(context);

    assert.strictEqual(response.status, 401);
    assert.strictEqual(fetchCalls.length, 0, 'Should not call downstream worker');
  });

  test('should return 200 OK with correct secret in query param', async () => {
    const context = {
      request: new Request('http://localhost/api/trigger-sync?secret=super-secret-key'),
      env: {
        SYNC_SECRET: 'super-secret-key'
      }
    };

    const response = await onRequest(context);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(fetchCalls.length, 1);
    assert.strictEqual(fetchCalls[0].options.headers['X-Sync-Secret'], 'super-secret-key');
  });

  test('should return 200 OK with correct secret in header', async () => {
    const context = {
      request: new Request('http://localhost/api/trigger-sync', {
        headers: { 'X-Sync-Secret': 'super-secret-key' }
      }),
      env: {
        SYNC_SECRET: 'super-secret-key'
      }
    };

    const response = await onRequest(context);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(fetchCalls.length, 1);
  });
});
