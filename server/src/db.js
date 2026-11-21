import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DEFAULT_DATA = {
  users: [],
  alarms: [],
  sleepSessions: [],
  locationReminders: [],
  calendarEvents: [],
  fitnessLogs: [],
  nutritionLogs: [],
  lovedOnePings: [],
  feedbackMessages: [],
  subscriptions: [],
  transactions: [],
  referralRewards: []
};

const cloneData = data => JSON.parse(JSON.stringify(data));
const emptyData = () => cloneData(DEFAULT_DATA);
const normalizeData = data => ({ ...emptyData(), ...cloneData(data || {}) });

export class Database {
  constructor({ dataDir = DATA_DIR, databaseUrl = process.env.DATABASE_URL, pool = null } = {}) {
    this.dataDir = dataDir;
    this.dbFile = path.join(dataDir, 'database.json');
    this.pool = pool || (databaseUrl ? new Pool({ connectionString: databaseUrl }) : null);
    this.writeQueue = Promise.resolve();
    this.data = this.pool ? emptyData() : this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf-8');
        return normalizeData(JSON.parse(raw));
      }
    } catch (err) {
      console.error('Failed to load database.json, initializing defaults:', err);
    }
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.writeFileSync(this.dbFile, JSON.stringify(emptyData(), null, 2), 'utf-8');
    return emptyData();
  }

  async initialize() {
    if (!this.pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DATABASE_URL is required in production');
      }
      return;
    }

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS auraalarm_state (
        id SMALLINT PRIMARY KEY CHECK (id = 1),
        payload JSONB NOT NULL
      )
    `);

    const result = await this.pool.query(
      'SELECT payload FROM auraalarm_state WHERE id = 1'
    );

    if (result.rows.length > 0) {
      this.data = normalizeData(result.rows[0].payload);
      return;
    }

    this.data = emptyData();
    await this.save();
  }

  save(data = this.data) {
    if (!this.pool) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2), 'utf-8');
      return;
    }

    const snapshot = JSON.stringify(data);
    const write = this.writeQueue.then(() => this.persistSnapshot(snapshot));
    this.writeQueue = write.catch(err => {
      console.error('Failed to persist database state:', err);
    });
    return write;
  }

  persistSnapshot(snapshot) {
    return this.pool.query(
      `INSERT INTO auraalarm_state (id, payload)
       VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
      [snapshot]
    );
  }

  mutate(mutator) {
    if (!this.pool) {
      const next = normalizeData(this.data);
      const result = mutator(next);
      this.save(next);
      this.data = next;
      return result;
    }

    const operation = this.writeQueue.then(async () => {
      const next = normalizeData(this.data);
      const result = mutator(next);
      await this.persistSnapshot(JSON.stringify(next));
      this.data = next;
      return result;
    });
    this.writeQueue = operation.catch(err => {
      console.error('Failed to persist database state:', err);
    });
    return operation;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  // Generic helpers
  find(collection, filterFn) {
    return (this.data[collection] || []).filter(filterFn);
  }

  findOne(collection, filterFn) {
    return (this.data[collection] || []).find(filterFn) || null;
  }

  insert(collection, item) {
    return this.mutate(data => {
      if (!data[collection]) {
        data[collection] = [];
      }
      data[collection].push(item);
      return item;
    });
  }

  update(collection, filterFn, updateData) {
    return this.mutate(data => {
      let updated = null;
      data[collection] = (data[collection] || []).map(item => {
        if (filterFn(item)) {
          updated = { ...item, ...updateData, updatedAt: new Date().toISOString() };
          return updated;
        }
        return item;
      });
      return updated;
    });
  }

  delete(collection, filterFn) {
    return this.mutate(data => {
      const beforeCount = (data[collection] || []).length;
      data[collection] = (data[collection] || []).filter(item => !filterFn(item));
      return beforeCount > data[collection].length;
    });
  }
}

export const db = new Database();
export { UPLOADS_DIR };
