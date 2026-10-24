import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';

// Exercise the actual SQL against Wrangler's D1 emulator. esbuild is the same
// compiler used by the app and lets Node run the bundler-resolved TS modules.
const compiled = await build({ entryPoints: ['lib/store.ts'], bundle: true, format: 'esm', platform: 'neutral', write: false });
const store = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const engineBundle = await build({ entryPoints: ['lib/engine.ts'], bundle: true, format: 'esm', platform: 'neutral', write: false });
const engine = await import(`data:text/javascript;base64,${Buffer.from(engineBundle.outputFiles[0].text).toString('base64')}`);

test('D1 isolates cookies, persists sandbox roles, and atomically commits one concurrent approval', async () => {
  const emulator = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("test"); } }', compatibilityDate: '2026-05-01', d1Databases: ['DB'] });
  try {
    const DB = await emulator.getD1Database('DB');
    const migration = await readFile(new URL('../drizzle/0000_flashy_metal_master.sql', import.meta.url), 'utf8');
    for (const statement of migration.split('--> statement-breakpoint')) await DB.prepare(statement).run();
    const env = { DB };
    const request = new Request('https://campus.example/api/hos');
    const alice = await store.getSession(env, request);
    const bob = await store.getSession(env, request);
    assert.notEqual(alice.id, bob.id);
    assert.notEqual(alice.stateId, bob.stateId);
    assert.match(alice.id, /^[a-f0-9]{64}$/);
    const cookie = store.sessionCookie(alice, request);
    assert.match(cookie, /HttpOnly; SameSite=Strict/);
    assert.match(cookie, /; Secure$/);
    assert.ok(!store.sessionCookie(alice, new Request('http://127.0.0.1/api/hos')).includes('; Secure'));
    await store.switchRole(env, alice, 'facilities');
    const cookieRequest = new Request(request.url, { headers: { cookie: `hos_demo=${alice.id}; role=organizer` } });
    const recovered = await store.getSession(env, cookieRequest);
    assert.equal(recovered.role, 'facilities', 'client role cookie cannot override the stored role');
    assert.equal(recovered.stateId, alice.stateId);
    assert.equal(recovered.isNew, false);

    const initial = await store.readState(env, alice);
    const planned = engine.applyAction(initial, { action: 'ingest', scenario: 'maintenance' }, 'facilities');
    await store.saveState(env, alice, initial.revision, planned);
    const [snapshotA, snapshotB] = await Promise.all([store.readState(env, alice), store.readState(env, alice)]);
    const command = { action: 'approve', planId: planned.plan.id };
    const resultA = engine.applyAction(snapshotA, command, 'organizer');
    const resultB = engine.applyAction(snapshotB, command, 'organizer');
    const commits = await Promise.allSettled([
      store.saveState(env, alice, snapshotA.revision, resultA),
      store.saveState(env, alice, snapshotB.revision, resultB),
    ]);
    assert.equal(commits.filter(result => result.status === 'fulfilled').length, 1);
    const rejected = commits.find(result => result.status === 'rejected');
    assert.equal(rejected.reason.status, 409);
    const committed = await store.readState(env, alice);
    assert.equal(committed.revision, 2);
    assert.equal(committed.plan.status, 'approved');
    assert.equal(committed.mockBookings.length, 1);
    assert.equal(committed.mockNotifications.length, 1);
    assert.equal(committed.mockBookings[0].planId, committed.mockNotifications[0].planId);
    assert.equal((await store.readState(env, bob)).event.roomId, 'greenhouse');
    assert.equal((await store.readState(env, bob)).revision, 0);
  } finally {
    await emulator.dispose();
  }
});
