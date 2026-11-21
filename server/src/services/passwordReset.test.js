import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  isValidPasswordResetToken,
  PASSWORD_RESET_TTL_MS
} from './passwordReset.js';

test('password reset tokens are hashed and expire after 30 minutes', () => {
  const now = Date.now();
  const reset = createPasswordResetToken(now);
  const user = {
    passwordResetTokenHash: reset.tokenHash,
    passwordResetExpiresAt: reset.expiresAt
  };

  assert.equal(reset.token.length, 64);
  assert.notEqual(reset.tokenHash, reset.token);
  assert.equal(isValidPasswordResetToken(user, reset.token, now), true);
  assert.equal(isValidPasswordResetToken(user, reset.token, now + PASSWORD_RESET_TTL_MS), false);
  assert.equal(isValidPasswordResetToken(user, `${reset.token}x`, now), false);
});

test('consuming a reset token changes the password and prevents reuse', async () => {
  const now = Date.now();
  const reset = createPasswordResetToken(now);
  const users = [{
    id: 'user-1',
    passwordHash: 'old-hash',
    authVersion: 2,
    passwordResetTokenHash: reset.tokenHash,
    passwordResetExpiresAt: reset.expiresAt
  }];
  const database = {
    findOne: (collection, predicate) => users.find(predicate) || null,
    update: async (collection, predicate, updates) => {
      const index = users.findIndex(predicate);
      if (index === -1) return null;
      users[index] = { ...users[index], ...updates };
      return users[index];
    }
  };

  assert.equal(await consumePasswordResetToken(database, reset.token, 'new-hash', now), true);
  assert.equal(users[0].passwordHash, 'new-hash');
  assert.equal(users[0].authVersion, 3);
  assert.equal(users[0].passwordResetTokenHash, null);
  assert.equal(await consumePasswordResetToken(database, reset.token, 'another-hash', now), false);
});
