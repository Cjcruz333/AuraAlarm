import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

export const hashPasswordResetToken = token => (
  createHash('sha256').update(token).digest('hex')
);

export const createPasswordResetToken = (now = Date.now()) => {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(now + PASSWORD_RESET_TTL_MS).toISOString()
  };
};

export const isValidPasswordResetToken = (user, token, now = Date.now()) => {
  if (!user?.passwordResetTokenHash || !user.passwordResetExpiresAt) return false;

  const expiresAt = Date.parse(user.passwordResetExpiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;

  const storedHash = Buffer.from(user.passwordResetTokenHash, 'hex');
  const suppliedHash = Buffer.from(hashPasswordResetToken(token), 'hex');
  return storedHash.length === suppliedHash.length
    && timingSafeEqual(storedHash, suppliedHash);
};

export const consumePasswordResetToken = async (database, token, passwordHash, now = Date.now()) => {
  const user = database.findOne('users', item => isValidPasswordResetToken(item, token, now));
  if (!user) return false;

  const updatedUser = await database.update('users', item => (
    item.id === user.id && isValidPasswordResetToken(item, token, now)
  ), {
    passwordHash,
    authVersion: (user.authVersion || 0) + 1,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null
  });

  return Boolean(updatedUser);
};
