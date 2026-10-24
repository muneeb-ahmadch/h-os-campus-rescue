import { env } from 'cloudflare:workers';
import type { Answer, CampusAction, Role } from '@/lib/contracts';
import { applyAction, buildRulesAnswer, DomainError, projectDashboard, sourcesForRole, validateAnswer } from '@/lib/engine';
import { answerQuestion, generateExplanation, getModelConfig, type Env } from '@/lib/model';
import { getSession, readState, saveState, sessionCookie, switchRole, type DemoSession, type StoreEnv } from '@/lib/store';

export const dynamic = 'force-dynamic';
const runtimeEnv = () => env as unknown as StoreEnv & Env;
const headers = { 'Cache-Control': 'no-store, private', 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' };
function json(body: unknown, status = 200, session?: DemoSession, request?: Request) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, ...(session && request ? { 'Set-Cookie': sessionCookie(session, request) } : {}) } });
}
function failure(error: unknown) {
  if (error instanceof DomainError) return json({ error: error.message }, error.status);
  console.error('[H-OS API]', error instanceof Error ? error.message : 'Unexpected error');
  return json({ error: 'The campus service is temporarily unavailable. Please retry.' }, 500);
}
function parseAction(body: unknown): CampusAction {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DomainError('A JSON action object is required.');
  const value = body as Record<string, unknown>;
  switch (value.action) {
    case 'switch_role':
      if (!['organizer', 'facilities', 'attendee'].includes(String(value.role))) throw new DomainError('Choose a valid sandbox role.');
      return { action: 'switch_role', role: value.role as Role };
    case 'ingest':
      if (!['maintenance', 'update', 'stale', 'refresh'].includes(String(value.scenario))) throw new DomainError('Choose a valid ingestion scenario.');
      if (value.text !== undefined && (typeof value.text !== 'string' || value.text.length > 4000)) throw new DomainError('Source notes must be text, up to 4,000 characters.');
      return { action: 'ingest', scenario: value.scenario as 'maintenance' | 'update' | 'stale' | 'refresh', ...(typeof value.text === 'string' ? { text: value.text } : {}) };
    case 'approve': case 'reject':
      if (typeof value.planId !== 'string' || value.planId.length > 120) throw new DomainError('A current proposal ID is required.');
      return { action: value.action, planId: value.planId };
    case 'ask':
      if (typeof value.question !== 'string' || !value.question.trim() || value.question.length > 1000) throw new DomainError('Ask a question between 1 and 1,000 characters.');
      return { action: 'ask', question: value.question.trim() };
    case 'reset': case 'run_agent': return { action: value.action };
    default: throw new DomainError('Unknown campus action.');
  }
}
function ensureSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new DomainError('Cross-origin actions are not allowed.', 403);
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new DomainError('Cross-site actions are not allowed.', 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new DomainError('Use application/json for campus actions.', 415);
}
export async function GET(request: Request) {
  try {
    const bindings = runtimeEnv();
    const session = await getSession(bindings, request);
    const state = await readState(bindings, session);
    return json(projectDashboard(state, session.role, getModelConfig(bindings)), 200, session, request);
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    ensureSameOrigin(request);
    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > 16_000) throw new DomainError('The action body is too large.', 413);
    let body: unknown;
    try {
      const raw = await request.text();
      if (raw.length > 16_000) throw new DomainError('The action body is too large.', 413);
      body = JSON.parse(raw);
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError('The request body must be valid JSON.');
    }
    const action = parseAction(body);
    const bindings = runtimeEnv();
    let session = await getSession(bindings, request);
    const state = await readState(bindings, session);
    const model = getModelConfig(bindings);
    if (action.action === 'switch_role') {
      session = await switchRole(bindings, session, action.role);
      return json(projectDashboard(state, session.role, model), 200, session, request);
    }
    if (action.action === 'ask') {
      // Authorization happens before retrieval; no hidden source enters the prompt.
      const sources = sourcesForRole(state, session.role).filter(source => source.status === 'fresh');
      let answer: Answer;
      try { answer = validateAnswer(await answerQuestion(action.question, sources, bindings), sources); }
      catch { answer = buildRulesAnswer(action.question, sources); }
      return json({ answer, dashboard: projectDashboard(state, session.role, model) }, 200, session, request);
    }
    const next = applyAction(state, action, session.role);
    if (next.plan?.status === 'pending' && next.plan.id !== state.plan?.id) {
      const sources = sourcesForRole(next, session.role).filter(source => source.status === 'fresh' && next.plan!.citations.some(citation => citation.id === source.id && citation.version === source.version));
      const explanation = await generateExplanation({ event: next.event, rooms: next.rooms, sources, reason: next.plan.explanation }, bindings);
      // Only prose is model-generated; rooms, actions, evidence and authorization are deterministic.
      const unknownReferences = [...explanation.text.matchAll(/\[([a-z][a-z0-9-]*-v\d+)\]/g)].some(match => !sources.some(source => source.id === match[1]));
      if (!unknownReferences) {
        next.plan.explanation = explanation.text;
        next.plan.modelUsed = explanation.modelUsed;
        if (explanation.modelName) next.plan.modelName = explanation.modelName;
      }
    }
    await saveState(bindings, session, state.revision, next);
    return json(projectDashboard(next, session.role, model), 200, session, request);
  } catch (error) { return failure(error); }
}
