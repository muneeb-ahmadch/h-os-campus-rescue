import type { Activity, Answer, CampusAction, CampusEvent, Citation, Dashboard, Plan, Role, Room, Source } from './contracts';

export interface CampusState {
  revision: number;
  simTime: string;
  scenario: Dashboard['scenario'];
  event: CampusEvent;
  rooms: Room[];
  sources: Source[];
  plan: Plan | null;
  activity: Activity[];
  mockBookings: { planId: string; roomId: string; time: string }[];
  mockNotifications: { planId: string; message: string; time: string }[];
}
export class DomainError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
const INTERNAL: Role[] = ['organizer', 'facilities'];
const EVERYONE: Role[] = ['organizer', 'facilities', 'attendee'];
const EVIDENCE = ['event', 'rooms', 'bookings', 'maintenance', 'policy'];
const iso = (n: number) => new Date(n).toISOString();
const stamp = (date: string | Date) => new Date(date).toISOString();
function freshUntil(now: string, minutes = 120) { return iso(Date.parse(now) + minutes * 60_000); }
const cite = (s: Source): Citation => ({ id: s.id, version: s.version, title: s.title });
const id = (prefix: string, state: CampusState) => `${prefix}-${state.revision + 1}-${state.activity.length + 1}`;

export function createInitialState(date: string | Date = new Date()): CampusState {
  const now = stamp(date);
  const source = (kind: string, title: string, content: string, roles: Role[] = INTERNAL): Source => ({
    id: `${kind}-v1`, title, kind, content, roles: [...roles], version: 1,
    updatedAt: now, expiresAt: freshUntil(now), status: 'fresh',
  });
  return {
    revision: 0, simTime: now, scenario: 'ready',
    event: { id: 'innovation-open-lab', title: 'Innovation Open Lab', date: now.slice(0, 10), start: '15:00', end: '17:00', attendees: 48,
      roomId: 'greenhouse', roomName: 'Greenhouse', requiredEquipment: ['projector', 'wifi'], requiresAccessibility: true, status: 'scheduled',
      publicMessage: 'Innovation Open Lab is confirmed in Greenhouse, 15:00–17:00. Step-free access is available.' },
    rooms: [
      { id: 'greenhouse', name: 'Greenhouse', building: 'Learning Hub', capacity: 64, accessible: true, equipment: ['projector', 'wifi'], available: true, energyKw: 8.2 },
      { id: 'agora', name: 'Agora', building: 'Community Hub', capacity: 72, accessible: true, equipment: ['projector', 'wifi', 'whiteboard'], available: true, energyKw: 5.4 },
      { id: 'studio', name: 'Studio 03', building: 'Learning Hub', capacity: 24, accessible: true, equipment: ['projector', 'wifi'], available: true, energyKw: 3.1 },
      { id: 'loft', name: 'The Loft', building: 'Creative Hub', capacity: 60, accessible: false, equipment: ['projector', 'wifi'], available: true, energyKw: 4.6 },
    ],
    sources: [
      source('event', 'Event brief', 'Innovation Open Lab, 15:00–17:00 today. 48 attendees. Assigned room: Greenhouse. Requires projector, Wi-Fi and step-free access.', EVERYONE),
      source('rooms', 'Campus room directory', 'Greenhouse: 64 seats, step-free, projector and Wi-Fi. Agora: 72 seats, step-free, projector, Wi-Fi and whiteboard. Studio 03: 24 seats, step-free, projector and Wi-Fi. The Loft: 60 seats, stairs only, projector and Wi-Fi. Estimated energy: Greenhouse 8.2 kW; Agora 5.4 kW; Studio 03 3.1 kW; The Loft 4.6 kW.'),
      source('bookings', 'Room booking ledger', 'For today 15:00–17:00: Greenhouse is booked for Innovation Open Lab. Agora, Studio 03 and The Loft are available. No booking is committed for a proposed relocation.'),
      source('maintenance', 'Facilities status bulletin', 'No active room closures. All spaces are operational for the event window.'),
      source('budget', 'Organizer budget — private', 'Synthetic event contingency budget: €120. Internal cost code: CAMPUS-DEMO-048. Only organizers may access budget details.', ['organizer']),
      source('announcement', 'Published event announcement', 'Innovation Open Lab is confirmed in Greenhouse, 15:00–17:00. Step-free access is available.', EVERYONE),
      source('policy', 'Campus relocation policy', 'A replacement room must be available for the full event, fit all 48 attendees, provide step-free access, projector and Wi-Fi. An organizer must approve a room change and attendee message. A source update or expired evidence invalidates an outstanding approval. Booking and notification actions are simulated; no message is sent to real people.'),
    ],
    plan: null,
    activity: [{ id: 'seed', time: now, type: 'system', title: 'Campus Brain is ready', detail: 'Seven synthetic sources linked to one event, four rooms and the approval policy. Demo sandbox: roles are deliberate impersonation, not production identity.', citations: [], roles: INTERNAL }],
    mockBookings: [], mockNotifications: [],
  };
}

export function currentSources(state: CampusState, now: string | Date = new Date()): Source[] {
  const time = Date.parse(stamp(now));
  return state.sources.filter(s => s.status !== 'superseded').map(s => ({ ...s, status: s.status === 'stale' || Date.parse(s.expiresAt) <= time ? 'stale' : 'fresh' }));
}
export function sourcesForRole(state: CampusState, role: Role, now: string | Date = new Date()): Source[] {
  return currentSources(state, now).filter(s => s.roles.includes(role));
}
function relevantSources(state: CampusState, now: string): Source[] { return currentSources(state, now).filter(s => EVIDENCE.includes(s.kind)); }
// Canonical evidence includes content and timestamps. The string is an integrity token, not a secret.
export function evidenceFingerprint(state: CampusState, now: string | Date = new Date()): string {
  const sourceData = relevantSources(state, stamp(now)).sort((a, b) => a.id.localeCompare(b.id)).map(s => [s.id, s.version, s.content, s.updatedAt, s.expiresAt, s.status]);
  return JSON.stringify({ event: state.event, rooms: state.rooms, sources: sourceData });
}
function addActivity(state: CampusState, type: Activity['type'], title: string, detail: string, citations: Citation[] = []) {
  state.activity.unshift({ id: id(type, state), time: state.simTime, type, title, detail, citations, roles: [...INTERNAL] });
  state.activity = state.activity.slice(0, 60);
}
function replaceSource(state: CampusState, kind: string, content: string, expiresAt?: string): Source {
  const previous = state.sources.filter(s => s.kind === kind).sort((a, b) => b.version - a.version)[0];
  state.sources.filter(s => s.kind === kind && s.status !== 'superseded').forEach(s => { s.status = 'superseded'; });
  const version = previous.version + 1;
  const source: Source = { ...previous, id: `${kind}-v${version}`, version, content, status: 'fresh', updatedAt: state.simTime, expiresAt: expiresAt ?? freshUntil(state.simTime) };
  state.sources.push(source);
  return source;
}
function invalidatePlan(state: CampusState, reason: string) {
  if (state.plan && ['pending', 'blocked'].includes(state.plan.status)) {
    state.plan.status = 'invalidated';
    state.plan.actions.forEach(action => { if (action.status === 'draft') action.status = 'cancelled'; });
    addActivity(state, 'approval', 'Previous approval invalidated', reason, state.plan.citations);
  }
}
function candidateReason(room: Room, state: CampusState): string {
  if (!room.available) return 'Unavailable: active maintenance closure';
  if (room.id === state.event.roomId) return 'Already assigned to this event';
  if (room.capacity < state.event.attendees) return `Too small: ${room.capacity} seats for ${state.event.attendees} attendees`;
  if (state.event.requiresAccessibility && !room.accessible) return 'No step-free access';
  const missing = state.event.requiredEquipment.filter(item => !room.equipment.includes(item));
  if (missing.length) return `Missing ${missing.join(', ')}`;
  return 'Available · enough seats · step-free · equipment ready';
}
export function draftPlan(state: CampusState, date: string | Date = new Date()): void {
  const now = stamp(date);
  if (state.event.status === 'relocated') throw new DomainError('This event has already been relocated.', 409);
  if (state.event.status !== 'at_risk') throw new DomainError('No disruption needs a recovery plan.', 409);
  invalidatePlan(state, 'The agent rebuilt its proposal from the current evidence.');
  const evidence = relevantSources(state, now);
  const stale = evidence.filter(s => s.status !== 'fresh');
  const candidates = state.rooms.map(room => ({ roomId: room.id, name: room.name, eligible: candidateReason(room, state).startsWith('Available ·'), reason: candidateReason(room, state) }));
  const eligible = state.rooms.filter(room => candidates.find(c => c.roomId === room.id)?.eligible).sort((a, b) => (a.energyKw ?? 100) - (b.energyKw ?? 100));
  const target = eligible[0];
  const blocked = stale.length > 0 || !target;
  const reason = stale.length ? `Evidence needs refresh: ${stale.map(s => s.title).join(', ')}.` : !target ? 'No room satisfies availability, capacity, accessibility and equipment policy.' : 'Greenhouse is closed for a facilities inspection during the event window.';
  const planId = id('plan', state);
  state.plan = {
    id: planId, status: blocked ? 'blocked' : 'pending', createdAt: now, fromRoom: state.event.roomName,
    toRoom: target?.name ?? 'No eligible room', toRoomId: target?.id ?? '', reason,
    explanation: blocked ? reason : `Move Innovation Open Lab to ${target.name}. Its ${target.capacity} seats accommodate all 48 attendees; step-free access, projector and Wi-Fi meet policy. The current ledger shows it is available for 15:00–17:00. Organizer approval is required before either simulated action can run.`,
    modelUsed: false,
    proposedMessage: target ? `Update for Innovation Open Lab: we’re moving to ${target.name}, ${target.building}. The time stays 15:00–17:00. Step-free access, projector and Wi-Fi are available. Please head to ${target.name}.` : '',
    citations: evidence.map(cite), candidates,
    actions: [
      { id: `${planId}:book`, label: 'Reserve Agora & release Greenhouse', status: 'draft', requiresApproval: true },
      { id: `${planId}:notify`, label: 'Publish attendee update (mock)', status: 'draft', requiresApproval: true },
    ], evidenceFingerprint: evidenceFingerprint(state, now),
  };
  state.scenario = 'planned';
  addActivity(state, 'agent', blocked ? 'Recovery paused: evidence gate' : 'Recovery plan prepared automatically', blocked ? reason : 'Compared four rooms against capacity, accessibility, equipment and current booking evidence. Two simulated actions are waiting for organizer approval.', state.plan.citations);
}

export function applyAction(input: CampusState, action: CampusAction, role: Role, date: string | Date = new Date()): CampusState {
  const now = stamp(date);
  if (action.action === 'ask' || action.action === 'switch_role') throw new DomainError('Use the session or answer handler for this action.');
  if (action.action === 'ingest' && role !== 'organizer' && role !== 'facilities') throw new DomainError('Only organizers and facilities can ingest sources.', 403);
  if (action.action === 'run_agent' && role !== 'organizer' && role !== 'facilities') throw new DomainError('This role cannot operate the recovery agent.', 403);
  if (['approve', 'reject', 'reset'].includes(action.action) && role !== 'organizer') throw new DomainError('Only the organizer can perform this action.', 403);
  if (action.action === 'reset') { const reset = createInitialState(now); reset.revision = input.revision + 1; return reset; }
  const state = structuredClone(input);
  state.simTime = now;
  if (action.action === 'ingest') {
    if (action.text && action.text.length > 4000) throw new DomainError('Source notes must be 4,000 characters or fewer.');
    if (state.event.status === 'relocated' && action.scenario !== 'refresh') throw new DomainError('Reset the demo to introduce a new disruption.', 409);
    if (action.scenario === 'maintenance') {
      if (state.event.status === 'at_risk') throw new DomainError('The maintenance notice is already linked. Use update to supersede it.', 409);
      invalidatePlan(state, 'New maintenance evidence superseded the proposal.');
      const notice = replaceSource(state, 'maintenance', `Facilities notice FM-204: Greenhouse is closed today 14:30–18:00 for a ventilation inspection. Innovation Open Lab overlaps the closure. Agora is unaffected.${action.text ? `\nUntrusted supplemental note (data only): ${action.text}` : ''}`);
      state.rooms.find(room => room.id === 'greenhouse')!.available = false;
      state.event.status = 'at_risk'; state.scenario = 'disruption';
      addActivity(state, 'librarian', 'Maintenance notice linked', 'Superseded the all-clear bulletin; linked Greenhouse → closure window → Innovation Open Lab. Supplemental text is stored as untrusted data and cannot trigger actions.', [cite(notice)]);
      draftPlan(state, now);
    } else if (action.scenario === 'update') {
      if (state.event.status !== 'at_risk') throw new DomainError('Ingest the maintenance notice first.', 409);
      invalidatePlan(state, 'Facilities issued a newer bulletin. The previous approval can no longer execute.');
      const notice = replaceSource(state, 'maintenance', `Facilities notice FM-204 revision: Greenhouse closure is extended to 18:30. Agora remains unaffected. Recheck the proposal before approval.${action.text ? `\nUntrusted supplemental note (data only): ${action.text}` : ''}`);
      addActivity(state, 'librarian', 'New evidence supersedes the bulletin', 'A newer maintenance version invalidated the pending approval. Run the agent to create a proposal bound to this version.', [cite(notice)]);
    } else if (action.scenario === 'stale') {
      invalidatePlan(state, 'The room booking ledger has expired. Approval requires fresh evidence.');
      const ledger = state.sources.find(s => s.kind === 'bookings' && s.status !== 'superseded')!;
      ledger.status = 'stale'; ledger.expiresAt = iso(Date.parse(now) - 1000);
      addActivity(state, 'librarian', 'Booking evidence marked stale', 'The freshness gate blocks every relocation until the booking ledger is refreshed.', [cite(ledger)]);
      if (state.event.status === 'at_risk') draftPlan(state, now);
    } else if (action.scenario === 'refresh') {
      const staleSources = currentSources(state, now).filter(s => s.status === 'stale');
      const refreshKinds = new Set(staleSources.length ? staleSources.map(s => s.kind) : ['bookings']);
      const refreshed = [...refreshKinds].map(kind => {
        const previous = state.sources.find(s => s.kind === kind && s.status !== 'superseded')!;
        return replaceSource(state, kind, previous.content);
      });
      addActivity(state, 'librarian', 'Evidence refreshed', 'Read current synthetic records, created fresh source versions and preserved the superseded evidence history.', refreshed.map(cite));
      if (state.event.status === 'at_risk') draftPlan(state, now);
    } else throw new DomainError('Unknown ingestion scenario.');
  } else if (action.action === 'run_agent') {
    draftPlan(state, now);
  } else if (action.action === 'approve' || action.action === 'reject') {
    const plan = state.plan;
    if (!plan || plan.id !== action.planId) throw new DomainError('That proposal is no longer current. Review the latest plan.', 409);
    if (plan.status !== 'pending') throw new DomainError(`This proposal is ${plan.status}; it cannot execute.`, 409);
    if (action.action === 'reject') {
      plan.status = 'rejected'; plan.actions.forEach(a => { a.status = 'cancelled'; });
      addActivity(state, 'approval', 'Proposal declined', 'The organizer rejected both proposed actions. No mock booking or attendee update was executed.', plan.citations);
    } else {
      const fresh = relevantSources(state, now);
      if (fresh.length !== EVIDENCE.length || fresh.some(s => s.status !== 'fresh') || plan.evidenceFingerprint !== evidenceFingerprint(state, now)) throw new DomainError('Evidence changed or expired. Refresh sources and rebuild the plan before approval.', 409);
      const target = state.rooms.find(room => room.id === plan.toRoomId);
      if (!target || !candidateReason(target, state).startsWith('Available ·')) throw new DomainError('The proposed room no longer meets the policy.', 409);
      if (state.mockBookings.some(b => b.planId === plan.id) || state.mockNotifications.some(n => n.planId === plan.id)) throw new DomainError('This proposal has already executed.', 409);
      // These are the complete effects. Persistence commits both arrays and the approval in one CAS write.
      state.mockBookings.push({ planId: plan.id, roomId: target.id, time: now });
      state.mockNotifications.push({ planId: plan.id, message: plan.proposedMessage, time: now });
      plan.status = 'approved'; plan.actions.forEach(a => { a.status = 'executed'; });
      state.event.roomId = target.id; state.event.roomName = target.name; state.event.status = 'relocated'; state.event.publicMessage = plan.proposedMessage;
      state.scenario = 'resolved';
      const booking = replaceSource(state, 'bookings', `Approved mock booking: Innovation Open Lab is reserved in ${target.name}, 15:00–17:00. Greenhouse reservation released; Greenhouse remains closed. Booking ID: ${plan.id}.`);
      const announcement = replaceSource(state, 'announcement', plan.proposedMessage);
      replaceSource(state, 'event', `Innovation Open Lab, 15:00–17:00 today. 48 attendees. Assigned room: ${target.name}. Requires projector, Wi-Fi and step-free access. Organizer-approved relocation is confirmed.`);
      addActivity(state, 'approval', 'Approved · two mock actions completed', 'The organizer approved this exact evidence version. Mock booking and simulated attendee notification committed together, once. No real booking or message was sent.', [cite(booking), cite(announcement)]);
    }
  }
  state.revision = input.revision + 1;
  return state;
}

export function projectDashboard(state: CampusState, role: Role, model: Dashboard['model'] = { configured: false, provider: 'rules', name: 'Deterministic policy engine' }, date: string | Date = new Date()): Dashboard {
  const now = stamp(date);
  const sourceProjection = state.sources.filter(s => s.roles.includes(role)).map(s => ({ ...s, roles: [...s.roles], status: s.status === 'superseded' ? 'superseded' as const : s.status === 'stale' || Date.parse(s.expiresAt) <= Date.parse(now) ? 'stale' as const : 'fresh' as const }));
  const visibleCurrent = sourceProjection.filter(s => s.status !== 'superseded');
  const publicEvent = structuredClone(state.event);
  if (role === 'attendee' && publicEvent.status === 'at_risk') publicEvent.status = 'scheduled';
  const plan = role === 'attendee' ? null : structuredClone(state.plan);
  if (plan?.status === 'pending' && (relevantSources(state, now).some(s => s.status !== 'fresh') || plan.evidenceFingerprint !== evidenceFingerprint(state, now))) {
    plan.status = 'invalidated';
    plan.actions.forEach(a => { if (a.status === 'draft') a.status = 'cancelled'; });
  }
  const rooms = state.rooms.filter(r => role !== 'attendee' || r.id === state.event.roomId).map(room => {
    const projected = { ...room, equipment: [...room.equipment] };
    if (role === 'attendee') { delete projected.energyKw; projected.available = true; }
    return projected;
  });
  return {
    role, revision: state.revision, simTime: now,
    scenario: role === 'attendee' && state.scenario !== 'resolved' ? 'ready' : state.scenario,
    event: publicEvent, rooms, sources: sourceProjection, plan,
    activity: state.activity.filter(a => a.roles.includes(role)).map(a => ({ ...a, citations: a.citations.filter(c => sourceProjection.some(s => s.id === c.id && s.version === c.version)) })),
    metrics: { freshSources: visibleCurrent.filter(s => s.status === 'fresh').length, totalSources: visibleCurrent.length, linkedFacts: role === 'attendee' ? 2 : 12 + (state.event.status !== 'scheduled' ? 3 : 0), pendingApprovals: plan?.status === 'pending' ? 1 : 0 },
    model,
    capabilities: { canIngest: role !== 'attendee', canApprove: role === 'organizer', canReset: role === 'organizer' },
    snapshotSummary: role === 'attendee' ? 'Your published event details, from sources available to attendees.' : state.scenario === 'resolved' ? 'Recovery complete. Organizer approval committed both simulated actions.' : state.event.status === 'at_risk' ? 'The Brain linked a room closure to this event. The agent prepared a policy-checked response.' : 'All systems ready. Seven synthetic sources are connected to the campus Brain.',
  };
}

export function buildRulesAnswer(question: string, sources: Source[]): Answer {
  const q = question.toLowerCase();
  const active = sources.filter(s => s.status === 'fresh');
  const byKind = (kind: string) => active.find(s => s.kind === kind);
  const selected: Source[] = [];
  const add = (kind: string) => { const source = byKind(kind); if (source && !selected.includes(source)) selected.push(source); };
  if (/budget|cost|€|money|spend/.test(q)) add('budget');
  else if (/clos|maintenan|ventilat|risk|what happened/.test(q)) { add('maintenance'); add('event'); }
  else if (/why|agora|alternative|relocat|move|room|access|capacity|seat|energy/.test(q)) { add('event'); add('rooms'); add('bookings'); add('maintenance'); add('policy'); }
  else if (/approv|polic|autonom|action/.test(q)) add('policy');
  else { add('announcement'); add('event'); }
  if (!selected.length) return { text: 'I cannot answer that from the fresh sources available to your current role. A permitted source may need to be refreshed.', citations: [], mode: 'rules' };
  return { text: selected.map(s => `${s.content} [${s.id}]`).join('\n\n'), citations: selected.map(cite), mode: 'rules' };
}

export function validateAnswer(answer: Answer, sources: Source[]): Answer {
  const allowed = new Map(sources.filter(s => s.status === 'fresh').map(s => [s.id, s]));
  const citations = (Array.isArray(answer.citations) ? answer.citations : []).filter(c => allowed.get(c.id)?.version === c.version).map(c => cite(allowed.get(c.id)!));
  if (!answer.text?.trim() || !citations.length) throw new DomainError('The model answer did not include permitted, fresh evidence.', 502);
  const embedded = [...answer.text.matchAll(/\[([a-z][a-z0-9-]*-v\d+)\]/g)].map(m => m[1]);
  if (embedded.some(sourceId => !allowed.has(sourceId))) throw new DomainError('The model cited a source outside this role.', 502);
  return { text: answer.text.slice(0, 12_000), citations: [...new Map(citations.map(c => [c.id, c])).values()], mode: answer.mode === 'gemma' ? 'gemma' : answer.mode === 'model' ? 'model' : 'rules', ...(answer.model ? { model: answer.model } : {}) };
}
