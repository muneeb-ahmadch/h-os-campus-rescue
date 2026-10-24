export type Role = 'organizer' | 'facilities' | 'attendee';
export type SourceStatus = 'fresh' | 'stale' | 'superseded';
export interface Source {
  id: string; title: string; kind: string; version: number;
  updatedAt: string; expiresAt: string; status: SourceStatus;
  roles: Role[]; content: string;
}
export interface Citation { id: string; version: number; title: string }
export interface KnowledgeLink {
  id: string; from: string; relation: string; to: string; citations: Citation[];
}
export interface RoomCheck {
  key: 'availability' | 'capacity' | 'accessibility' | 'equipment';
  label: string; passed: boolean; detail: string; citations: Citation[];
}
export interface Room {
  id: string; name: string; building: string; capacity: number;
  accessible: boolean; equipment: string[]; available: boolean;
  energyKw?: number;
}
export interface CampusEvent {
  id: string; title: string; date: string; start: string; end: string;
  attendees: number; roomId: string; roomName: string;
  requiredEquipment: string[]; requiresAccessibility: boolean;
  status: 'scheduled' | 'at_risk' | 'relocated'; publicMessage?: string;
}
export interface Plan {
  id: string; status: 'pending' | 'approved' | 'rejected' | 'invalidated' | 'blocked';
  createdAt: string; fromRoom: string; toRoom: string; toRoomId: string;
  reason: string; explanation: string; modelUsed: boolean; modelName?: string;
  blockReason?: 'stale' | 'no_room';
  internalBrief?: Citation;
  proposedMessage: string; citations: Citation[];
  candidates: { roomId: string; name: string; eligible: boolean; reason: string; checks?: RoomCheck[]; estimatedKwh?: number }[];
  actions: { id: string; label: string; status: 'draft' | 'executed' | 'cancelled'; requiresApproval: boolean }[];
  evidenceFingerprint: string;
}
export interface Activity {
  id: string; time: string; type: 'librarian' | 'agent' | 'approval' | 'system';
  title: string; detail: string; citations: Citation[]; roles: Role[];
}
export interface Dashboard {
  role: Role; revision: number; simTime: string;
  scenario: 'ready' | 'disruption' | 'planned' | 'resolved';
  event: CampusEvent; rooms: Room[]; sources: Source[]; plan: Plan | null;
  activity: Activity[];
  metrics: { freshSources: number; totalSources: number; linkedFacts: number; pendingApprovals: number };
  model: { configured: boolean; provider: string; name: string };
  capabilities: { canIngest: boolean; canApprove: boolean; canReset: boolean };
  snapshotSummary: string;
  knowledge: { links: KnowledgeLink[] };
}
export interface Answer { text: string; citations: Citation[]; mode: 'gemma' | 'model' | 'rules'; model?: string }
export interface InterpretedUpdate {
  attendees: number; requiredEquipment: string[]; summary: string;
  model: string; notice: string;
}
// All actions use POST /api/hos; GET returns the role-filtered Dashboard.
export type CampusAction =
  | { action: 'switch_role'; role: Role }
  | { action: 'ingest'; scenario: 'maintenance' | 'update' | 'stale' | 'refresh'; text?: string }
  | { action: 'run_agent' }
  | { action: 'revise_event'; attendees: number; requiredEquipment: string[]; notice?: string }
  | { action: 'interpret_update'; notice: string }
  | { action: 'approve' | 'reject'; planId: string }
  | { action: 'reset' }
  | { action: 'ask'; question: string };
