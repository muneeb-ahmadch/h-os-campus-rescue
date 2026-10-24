import assert from 'node:assert/strict';

// Creates its own disposable synthetic session; never touches another browser's world.
const base = process.env.HOS_TEST_URL || 'http://127.0.0.1:5173';
const withModel = process.argv.includes('--with-model');
let requests = 0;
const observations = [];
function client() {
  let cookie = '';
  let previousPlanId;
  return async function request(action, expected = 200) {
    const start = performance.now();
    const response = await fetch(`${base}/api/hos`, {
      method: action ? 'POST' : 'GET',
      headers: { ...(action ? { 'Content-Type': 'application/json', Origin: new URL(base).origin } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      ...(action ? { body: JSON.stringify(action) } : {}),
    });
    const setCookie = response.headers.getSetCookie().find(c => c.startsWith('hos_demo='));
    if (setCookie) cookie = setCookie.split(';')[0];
    requests++;
    const data = await response.json();
    assert.equal(response.status, expected, `${action?.action ?? 'GET'}: ${data.error ?? response.status}`);
    if ((data.plan?.modelUsed && data.plan.id !== previousPlanId) || data.interpretation || (data.answer && data.answer.mode !== 'rules')) observations.push({ action: action?.action, model: data.interpretation?.model ?? data.answer?.model ?? data.plan?.modelName, milliseconds: Math.round(performance.now() - start) });
    if (data.plan) previousPlanId = data.plan.id;
    return data;
  };
}
const request = client();
let d = await request();
assert.equal(d.event.roomId, 'greenhouse');
const initialRevision = d.revision;
if (withModel) {
  const intake = await request({ action: 'interpret_update', notice: 'Now twenty attendees instead of forty-eight. Keep the projector and Wi-Fi.' });
  assert.equal(intake.interpretation.attendees, 20);
  assert.deepEqual(intake.interpretation.requiredEquipment, ['projector', 'wifi']);
  assert.equal(intake.dashboard.revision, initialRevision, 'interpretation must be read-only');
}
d = await request({ action: 'ingest', scenario: 'maintenance' });
assert.equal(d.plan.toRoomId, 'agora');
assert.ok(d.plan.internalBrief);
assert.ok(d.plan.candidates.every(c => c.checks.length === 4));
const firstPlan = d.plan.id;
d = await request({ action: 'revise_event', attendees: 20, requiredEquipment: ['projector', 'wifi'] });
assert.equal(d.plan.toRoomId, 'studio');
assert.ok(d.plan.actions[0].label.includes('Studio 03'));
await request({ action: 'approve', planId: firstPlan }, 409);
d = await request({ action: 'revise_event', attendees: 90, requiredEquipment: ['projector', 'wifi'] });
assert.equal(d.plan.blockReason, 'no_room');
assert.equal(d.plan.proposedMessage, '');
await request({ action: 'approve', planId: d.plan.id }, 409);
d = await request({ action: 'ingest', scenario: 'refresh' });
assert.equal(d.plan.status, 'blocked');
d = await request({ action: 'revise_event', attendees: 48, requiredEquipment: ['wifi', 'video-conference'] });
assert.equal(d.plan.status, 'blocked');
d = await request({ action: 'revise_event', attendees: 48, requiredEquipment: ['wifi', 'projector'] });
assert.equal(d.plan.toRoomId, 'agora');
const pending = d.plan.id;
d = await request({ action: 'ingest', scenario: 'stale' });
assert.equal(d.plan.status, 'blocked');
await request({ action: 'approve', planId: pending }, 409);
d = await request({ action: 'ingest', scenario: 'refresh' });
assert.equal(d.plan.status, 'pending');
const finalPlan = d.plan.id;
d = await request({ action: 'switch_role', role: 'facilities' });
await request({ action: 'approve', planId: finalPlan }, 403);
await request({ action: 'revise_event', attendees: 20, requiredEquipment: ['wifi'] }, 403);
await request({ action: 'interpret_update', notice: 'Now 20 attendees.' }, 403);
await request({ action: 'switch_role', role: 'organizer' });
d = await request({ action: 'approve', planId: finalPlan });
assert.equal(d.event.roomId, 'agora');
assert.equal(d.plan.status, 'approved');
await request({ action: 'approve', planId: finalPlan }, 409);
d = await request({ action: 'switch_role', role: 'attendee' });
assert.equal(d.plan, null);
assert.equal(d.event.roomId, 'agora');
assert.ok(d.sources.some(s => s.kind === 'announcement' && s.content.includes('Agora')));
assert.equal(d.metrics.linkedFacts, d.knowledge.links.length);
for (const secret of ['FM-204', 'CAMPUS-DEMO-048', 'Internal recovery brief', 'Reviewed event update', 'recovery-v']) assert.ok(!JSON.stringify(d).includes(secret), `role projection leaked ${secret}`);
const answer = await request({ action: 'ask', question: 'What is the private organizer budget and cost code?' });
assert.ok(!JSON.stringify(answer).includes('CAMPUS-DEMO-048'));
assert.ok(!JSON.stringify(answer).includes('€120'));
if (withModel) {
  const publicAnswer = await request({ action: 'ask', question: 'Where is my event, and is there step-free access?' });
  assert.notEqual(publicAnswer.answer.mode, 'rules', 'a real cited model answer must succeed');
  assert.ok(publicAnswer.answer.citations.length);
  assert.ok(observations.some(o => ['ingest', 'revise_event'].includes(o.action)), 'a real model recovery explanation must succeed');
}
const second = await client()();
assert.equal(second.event.roomId, 'greenhouse');
assert.equal(second.revision, 0);
console.log(JSON.stringify({ result: 'passed', requests, modelCheckRequested: withModel, observations, checked: ['read-only extraction', 'attendance and equipment changes', 'old approval rejected', 'no-room refresh remains blocked', 'stale evidence', 'role permissions', 'one-time execution', 'public view', 'session isolation'] }, null, 2));
