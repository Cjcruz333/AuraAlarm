import assert from 'node:assert/strict';
import express from 'express';
import test from 'node:test';
import fitnessRoutes from './fitness.js';

test('workout plans are public and timed routines match their advertised lengths', async t => {
  const app = express();
  app.use('/api/fitness', fitnessRoutes);
  const server = app.listen(0);
  t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}/api/fitness`;
  const plansResponse = await fetch(`${baseUrl}/plans`);
  assert.equal(plansResponse.status, 200);
  const { plans } = await plansResponse.json();

  for (const [planId, expectedSeconds] of [
    ['plan_morning_full_body_15', 15 * 60],
    ['plan_full_body_30', 30 * 60]
  ]) {
    const plan = plans.find(item => item.id === planId);
    assert.ok(plan, `expected plan ${planId} to be available`);
    assert.equal(
      plan.exercises.reduce((total, exercise) => total + exercise.durationSec, 0),
      expectedSeconds
    );
  }

  const nutritionResponse = await fetch(`${baseUrl}/nutrition`);
  assert.equal(nutritionResponse.status, 401);
});
