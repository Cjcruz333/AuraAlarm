import assert from 'node:assert/strict';
import test from 'node:test';
import { isAdminUser } from './auth.js';

test('admin access is derived from the configured email or stored role', t => {
  const previousAdminEmail = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = 'owner@example.test';

  t.after(() => {
    if (previousAdminEmail === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = previousAdminEmail;
    }
  });

  assert.equal(isAdminUser({ email: 'OWNER@example.test' }), true);
  assert.equal(isAdminUser({ role: 'admin' }), true);
  assert.equal(isAdminUser({ email: 'customer@example.test' }), false);
  assert.equal(isAdminUser(null), false);
});
