"use client";

import { useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, Check, CircleCheck, FlaskConical, LoaderCircle, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { CampusAction, Citation, Dashboard, InterpretedUpdate, Plan } from '@/lib/contracts';

type SourceOpener = (citation: Citation) => void;

export function RecoveryLab({ data, busy, onAction }: { data: Dashboard; busy: boolean; onAction: (action: CampusAction) => void }) {
  const [attendance, setAttendance] = useState(String(data.event.attendees));
  const [equipment, setEquipment] = useState(data.event.requiredEquipment);
  const resolved = data.event.status === 'relocated';
  function submit(event: FormEvent) {
    event.preventDefault();
    onAction({ action: 'revise_event', attendees: Number(attendance), requiredEquipment: equipment });
  }
  return <section className="panel recovery-lab" aria-labelledby="lab-title">
    <div className="lab-introduction"><span className="lab-emblem"><FlaskConical size={21} /></span><div><div className="eyebrow">LIVE SCENARIO / SYNTHETIC DATA</div><h2 id="lab-title">Change the facts. Challenge the agent.</h2><p>With projector + Wi-Fi: 20 can use Studio 03, 48 need Agora, and 90 have no safe replacement.</p></div><span className="lab-safety"><ShieldCheck size={13} />Step-free access stays required</span></div>
    <form onSubmit={submit} className="requirements-form">
      <label className="attendance-input">ATTENDEES<input type="number" min="1" max="500" step="1" required value={attendance} onChange={e => setAttendance(e.target.value)} disabled={busy || resolved} /></label>
      <fieldset disabled={busy || resolved}><legend>REQUIRED EQUIPMENT</legend>{[{ id: 'projector', label: 'Projector' }, { id: 'wifi', label: 'Wi-Fi' }, { id: 'whiteboard', label: 'Whiteboard' }, { id: 'video-conference', label: 'Video conferencing' }].map(item => <label key={item.id}><input type="checkbox" checked={equipment.includes(item.id)} onChange={e => setEquipment(e.target.checked ? [...equipment, item.id] : equipment.filter(id => id !== item.id))} />{item.label}</label>)}</fieldset>
      <button type="submit" className="button primary" disabled={busy || resolved || !equipment.length}>Update event & reassess<ArrowRight size={14} /></button>
    </form>
    <div className="lab-presets"><span>TRY A DIFFERENT OUTCOME</span>{[20, 48, 90].map(n => <button key={n} disabled={busy || resolved} onClick={() => { setAttendance(String(n)); setEquipment(['projector', 'wifi']); onAction({ action: 'revise_event', attendees: n, requiredEquipment: ['projector', 'wifi'] }); }}>{n} attendees</button>)}<small>{resolved ? 'Reset the demo to test another event.' : 'Changes version the event brief and invalidate the previous approval.'}</small></div>
    {!resolved && <NoticeIntake busy={busy} configured={data.model.configured} onAction={onAction} />}
  </section>;
}

function NoticeIntake({ busy, configured, onAction }: { busy: boolean; configured: boolean; onAction: (action: CampusAction) => void }) {
  const [notice, setNotice] = useState('Sign-ups changed: now 20 attendees. Keep Wi-Fi and projector.');
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<InterpretedUpdate | null>(null);
  async function interpret(event: FormEvent) {
    event.preventDefault();
    setReading(true); setError(''); setPreview(null);
    try {
      const response = await fetch('/api/hos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'interpret_update', notice }) });
      const result = await response.json() as { interpretation?: InterpretedUpdate; error?: string };
      if (!response.ok || !result.interpretation) throw new Error(result.error ?? 'Could not interpret this notice. Use the structured controls.');
      setPreview(result.interpretation);
    } catch (error) { setError(error instanceof Error ? error.message : 'Model unavailable. Use the structured controls.'); }
    finally { setReading(false); }
  }
  return <div className="notice-intake"><div><div className="eyebrow"><Sparkles size={12} />GIVE THE LIBRARIAN AN UPDATE</div><p>Paste a synthetic change in ordinary language. The model extracts; you review; policy checks decide.</p></div><form onSubmit={interpret}><label htmlFor="source-notice" className="sr-only">Synthetic event update</label><textarea id="source-notice" maxLength={2000} rows={2} value={notice} onChange={e => { setNotice(e.target.value); setPreview(null); }} disabled={busy || reading} /><button type="submit" className="button secondary" disabled={busy || reading || !notice.trim() || !configured}>{reading ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />}{reading ? 'Librarian is reading…' : 'Extract proposed changes'}</button></form>{!configured && <p className="intake-help">Connect a hosted model to interpret text. Structured event controls above work without one.</p>}{error && <p role="alert" className="intake-error">{error}</p>}{preview && <div className="intake-preview" aria-live="polite"><div><span className="eyebrow">REVIEW BEFORE WRITING / {preview.model}</span><strong>{preview.attendees} attendees · {preview.requiredEquipment.join(', ')}</strong><p>{preview.summary}</p><small>Nothing applied yet. Step-free access and organizer approval stay required.</small></div><button className="button primary" disabled={busy || reading} onClick={() => onAction({ action: 'revise_event', attendees: preview.attendees, requiredEquipment: preview.requiredEquipment, notice: preview.notice })}>Apply reviewed update<ArrowRight size={13} /></button></div>}</div>;
}

export function DecisionMatrix({ plan, onSource }: { plan: Plan; onSource: SourceOpener }) {
  return <section className="panel decision-matrix" aria-labelledby="matrix-title"><div className="matrix-heading"><div><div className="eyebrow">A DECISION YOU CAN INSPECT</div><h2 id="matrix-title">Every room. Every constraint.</h2><p>Hard requirements first. Lowest estimated energy breaks ties between eligible rooms.</p></div><span className="status-badge neutral">{plan.candidates.filter(c => c.eligible).length} eligible / {plan.candidates.length} checked</span></div>
    <div className="matrix-scroll"><table><thead><tr><th scope="col">Room</th><th scope="col">Available</th><th scope="col">Capacity</th><th scope="col">Step-free</th><th scope="col">Equipment</th><th scope="col">Est. event energy</th></tr></thead><tbody>{plan.candidates.map(candidate => <tr key={candidate.roomId} className={candidate.eligible && plan.toRoomId === candidate.roomId ? 'chosen-room' : ''}><th scope="row"><strong>{candidate.name}</strong><span>{candidate.eligible ? plan.toRoomId === candidate.roomId ? 'Preferred eligible room' : 'Eligible alternative' : 'Excluded'}</span></th>{candidate.checks?.map(check => <td key={check.key}><button className={`constraint ${check.passed ? 'constraint-pass' : 'constraint-fail'}`} title={`${check.detail}. Open ${check.citations[0]?.title ?? 'source'}`} onClick={() => check.citations[0] && onSource(check.citations[0])}>{check.passed ? <Check size={13} /> : <X size={13} />}<span>{check.detail}</span></button></td>)}<td className="energy-cell">{candidate.estimatedKwh === undefined ? 'Unknown' : `${candidate.estimatedKwh} kWh`}</td></tr>)}</tbody></table></div>
    <p className="matrix-footnote"><BookOpen size={13} />Click any check to inspect its evidence. Energy figures are synthetic estimates for this event window, never claimed savings.{plan.status === 'invalidated' && ' This matrix is historical: the proposal is invalidated.'}</p>
  </section>;
}

export function EvidencePath({ data, onSource }: { data: Dashboard; onSource: SourceOpener }) {
  const current = (kind: string) => data.sources.find(s => s.kind === kind && s.status !== 'superseded');
  const maintenance = current('maintenance');
  const event = current('event');
  const brief = data.plan?.internalBrief;
  const closure = data.rooms.find(r => r.id === data.event.roomId)?.available === false;
  const trigger = closure ? maintenance : event;
  return <section className="impact-path" aria-label="Evidence to action path"><div className="eyebrow">ONE CHANGE TRAVELS THROUGH THE BRAIN</div><div className="impact-nodes">
    <button onClick={() => trigger && onSource(trigger)}><span>01 / LIBRARIAN</span><strong>{closure ? 'Room closure' : 'Requirements changed'}</strong><small>{trigger?.id}</small></button><ArrowRight size={18} />
    <button onClick={() => event && onSource(event)}><span>02 / LINKED EVENT</span><strong>{data.event.attendees} people affected</strong><small>{event?.id}</small></button><ArrowRight size={18} />
    <button onClick={() => brief && onSource(brief)}><span>03 / AGENT ACTED</span><strong>Internal brief saved</strong><small>{brief?.id ?? 'No brief yet'}</small></button><ArrowRight size={18} />
    <div className="impact-human"><span>04 / HUMAN BOUNDARY</span><strong>{data.plan?.status === 'approved' ? 'Mock actions completed' : data.plan?.status === 'blocked' ? 'Recovery blocked' : 'Booking + announcement'}</strong><small>{data.plan?.status === 'approved' ? 'Organizer approved this version' : 'No execution without approval'}</small></div>
  </div></section>;
}

export function KnowledgeGraph({ data, onSource }: { data: Dashboard; onSource: SourceOpener }) {
  const [expanded, setExpanded] = useState(false);
  const links = data.knowledge?.links ?? [];
  return <section className="panel knowledge-graph"><div className="matrix-heading"><div><div className="eyebrow">TYPED KNOWLEDGE GRAPH</div><h2>Facts with relationships. Relationships with evidence.</h2><p>Built from the current structured records and filtered by your role on the server.</p></div><span className="status-badge mint">{links.length} sourced links</span></div><div className="knowledge-links">{(expanded ? links : links.slice(0, 7)).map(link => <div key={link.id} className="knowledge-link"><strong>{link.from}</strong><span className="knowledge-relation">{link.relation}<ArrowRight size={12} /></span><strong>{link.to}</strong><button className="graph-evidence" onClick={() => onSource(link.citations[0])}><BookOpen size={12} />{link.citations.map(c => c.id).join(' · ')}</button></div>)}</div>{links.length > 7 && <button className="text-button graph-expand" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer links' : `Inspect all ${links.length} links`}<ArrowRight size={13} /></button>}<div className="matrix-footnote"><CircleCheck size={13} />The linked-facts counter is calculated from these relationships.</div></section>;
}
