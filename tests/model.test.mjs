import test from 'node:test';
import assert from 'node:assert/strict';
import { answerQuestion, generateExplanation, getModelConfig, validateModelResponse } from '../lib/model.ts';
const sources = [{ id: 'event-v1', title: 'Event brief', kind: 'event', version: 1, updatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(), status: 'fresh', roles: ['attendee'], content: 'The event is in Greenhouse.' }];
test('provider status never exposes credentials', () => {
  const config = getModelConfig({ ANTHROPIC_API_KEY: 'test-secret' });
  assert.equal(config.provider, 'anthropic'); assert.equal(config.configured, true);
  assert.equal(JSON.stringify(config).includes('test-secret'), false);
});
test('unknown or mismatched evidence references fail closed', () => {
  assert.throws(() => validateModelResponse(JSON.stringify({ text: 'Budget is 120 [budget-v1].', sourceIds: ['budget-v1'] }), sources));
  assert.throws(() => validateModelResponse(JSON.stringify({ text: 'Here is an unsupported claim.', sourceIds: ['event-v1'] }), sources));
  assert.throws(() => validateModelResponse(JSON.stringify({ text: 'Room [hidden-v1].', sourceIds: ['event-v1'] }), sources));
});
test('valid references are resolved to server-owned source metadata', () => {
  assert.deepEqual(validateModelResponse(JSON.stringify({ text: 'The event is in Greenhouse [event-v1].', sourceIds: ['event-v1'] }), sources).citations, [{ id: 'event-v1', version: 1, title: 'Event brief' }]);
});
test('no key keeps proposal in explicit deterministic mode', async () => {
  const result = await generateExplanation({ event: {}, rooms: [], sources, reason: 'Prepared policy proposal' }, {});
  assert.deepEqual(result, { text: 'Prepared policy proposal', modelUsed: false });
});
test('expired evidence cannot enter the model prompt', async () => {
  await assert.rejects(answerQuestion('Where?', [{ ...sources[0], expiresAt: '2020-01-01T00:00:00Z' }], { ANTHROPIC_API_KEY: 'test' }), /No fresh/);
});
test('Anthropic adapter sends only supplied evidence and validates actual response', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    const body = JSON.parse(options.body);
    assert.equal(body.messages[0].content.includes('event-v1'), true);
    assert.equal(body.messages[0].content.includes('budget-v1'), false);
    assert.equal(body.output_config.format.type, 'json_schema');
    assert.deepEqual(body.output_config.format.schema.required, ['text', 'sourceIds']);
    assert.equal(options.headers['x-api-key'], 'test-only');
    return Response.json({ model: 'claude-sonnet-5-5', content: [{ type: 'text', text: JSON.stringify({ text: 'The event is in Greenhouse [event-v1].', sourceIds: ['event-v1'] }) }] });
  };
  try { const a = await answerQuestion('Where?', sources, { ANTHROPIC_API_KEY: 'test-only' }); assert.equal(a.mode, 'model'); assert.equal(a.model, 'claude-sonnet-5-5'); }
  finally { globalThis.fetch = original; }
});
