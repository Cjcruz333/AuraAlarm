import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { Database } from './db.js';

class FakePool {
  constructor(payload = null) {
    this.payload = payload;
    this.failNextWrite = false;
  }

  async query(sql, values = []) {
    if (sql.includes('SELECT payload')) {
      return { rows: this.payload === null ? [] : [{ payload: this.payload }] };
    }

    if (sql.includes('INSERT INTO auraalarm_state')) {
      if (this.failNextWrite) {
        this.failNextWrite = false;
        throw new Error('simulated database failure');
      }
      this.payload = JSON.parse(values[0]);
      return { rows: [] };
    }

    return { rows: [] };
  }

  async end() {}
}

test('local JSON storage keeps synchronous development behavior', t => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auraalarm-local-'));
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));

  const database = new Database({ dataDir, databaseUrl: '' });
  const user = { id: 'local-user', email: 'local@example.test' };

  assert.equal(database.insert('users', user), user);
  assert.equal(database.findOne('users', item => item.id === user.id), user);

  const reloaded = new Database({ dataDir, databaseUrl: '' });
  assert.deepEqual(reloaded.find('users', () => true), [user]);
});

test('PostgreSQL storage starts clean and awaits durable mutations', async t => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auraalarm-postgres-'));
  t.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(dataDir, 'database.json'),
    JSON.stringify({ users: [{ id: 'local-only-user' }] })
  );

  const pool = new FakePool();
  const database = new Database({ dataDir, pool });
  await database.initialize();

  assert.deepEqual(database.find('users', () => true), []);
  assert.deepEqual(pool.payload.users, []);

  await Promise.all([
    database.insert('users', { id: 'first-user' }),
    database.insert('users', { id: 'second-user' })
  ]);
  assert.equal(pool.payload.users.length, 2);

  const updated = await database.update(
    'users',
    item => item.id === 'first-user',
    { name: 'Updated' }
  );
  assert.equal(updated.name, 'Updated');

  assert.equal(await database.delete('users', item => item.id === 'second-user'), true);

  const reloaded = new Database({ dataDir, pool });
  await reloaded.initialize();
  assert.deepEqual(reloaded.find('users', () => true), [
    { id: 'first-user', name: 'Updated', updatedAt: reloaded.findOne('users', item => item.id === 'first-user').updatedAt }
  ]);

  pool.failNextWrite = true;
  const originalError = console.error;
  console.error = () => {};
  try {
    await assert.rejects(
      database.insert('users', { id: 'failed-user' }),
      /simulated database failure/
    );
  } finally {
    console.error = originalError;
  }
  assert.equal(database.findOne('users', item => item.id === 'failed-user'), null);
});
