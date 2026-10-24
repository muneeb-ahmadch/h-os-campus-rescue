import type { Role } from './contracts';
import { createInitialState, DomainError, type CampusState } from './engine';

export interface StoreEnv { DB?: D1Database }
export interface DemoSession { id: string; stateId: string; role: Role; expiresAt: string; isNew: boolean }
const COOKIE = 'hos_demo';
const SESSION_SECONDS = 7 * 24 * 60 * 60;

function database(env: StoreEnv): D1Database {
  if (!env.DB) throw new DomainError('The campus database is unavailable. Check the D1 DB binding and apply the migration.', 503);
  return env.DB;
}
function randomId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}
function cookieId(request: Request): string | null {
  const value = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export function sessionCookie(session: DemoSession, request: Request): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${session.id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}
export async function getSession(env: StoreEnv, request: Request): Promise<DemoSession> {
  const db = database(env);
  const id = cookieId(request);
  if (id) {
    const row = await db.prepare('SELECT id, state_id, role, expires_at FROM demo_sessions WHERE id = ? AND expires_at > ?').bind(id, new Date().toISOString()).first<{ id: string; state_id: string; role: Role; expires_at: string }>();
    if (row && ['organizer', 'facilities', 'attendee'].includes(row.role)) return { id: row.id, stateId: row.state_id, role: row.role, expiresAt: row.expires_at, isNew: false };
  }
  const now = new Date().toISOString();
  const session: DemoSession = { id: randomId(), stateId: randomId(), role: 'organizer', expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(), isNew: true };
  const state = createInitialState(now);
  await db.batch([
    db.prepare('INSERT INTO campus_states (id, revision, body, updated_at) VALUES (?, ?, ?, ?)').bind(session.stateId, state.revision, JSON.stringify(state), now),
    db.prepare('INSERT INTO demo_sessions (id, state_id, role, expires_at) VALUES (?, ?, ?, ?)').bind(session.id, session.stateId, session.role, session.expiresAt),
  ]);
  return session;
}
export async function readState(env: StoreEnv, session: DemoSession): Promise<CampusState> {
  const row = await database(env).prepare('SELECT revision, body FROM campus_states WHERE id = ?').bind(session.stateId).first<{ revision: number; body: string }>();
  if (!row) throw new DomainError('This sandbox has expired. Reload the page to start another.', 409);
  const state = JSON.parse(row.body) as CampusState;
  state.revision = row.revision;
  return state;
}
export async function saveState(env: StoreEnv, session: DemoSession, previousRevision: number, state: CampusState): Promise<void> {
  if (state.revision !== previousRevision + 1) throw new Error('A state write must increment its revision exactly once.');
  const result = await database(env).prepare('UPDATE campus_states SET revision = ?, body = ?, updated_at = ? WHERE id = ? AND revision = ?')
    .bind(state.revision, JSON.stringify(state), state.simTime, session.stateId, previousRevision).run();
  if (result.meta.changes !== 1) throw new DomainError('The sandbox changed in another request. Reload and review the current evidence before trying again.', 409);
}
export async function switchRole(env: StoreEnv, session: DemoSession, role: Role): Promise<DemoSession> {
  await database(env).prepare('UPDATE demo_sessions SET role = ? WHERE id = ? AND state_id = ?').bind(role, session.id, session.stateId).run();
  return { ...session, role };
}
