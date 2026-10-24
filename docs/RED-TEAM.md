# What changed after attacking the first prototype

The first build looked finished, but a judge could reasonably ask whether the Brain existed beyond a document list, whether the agent did anything independently, and whether the model contributed more than prose. This pass focused on making those questions answerable in the live product.

| Attack on the original | Change | Evidence to inspect |
| --- | --- | --- |
| The linked-facts number is hardcoded. | A typed, role-filtered relationship projection now drives both the counter and a browsable graph. Each link has source/version references. | Campus brain; `projectDashboard`; graph permission tests. |
| The only viable room is always Agora. | Attendance and equipment are editable. All four constraints are evaluated for every room. Eligible rooms are ranked by their synthetic event-energy estimate. | 20 attendees selects Studio 03; 48 selects Agora; 90 blocks. Tests sweep every attendance from 1 to 90. |
| The model only decorates a fixed answer. | The Librarian interprets ordinary-language event updates into bounded typed requirements. A human reviews the actual extracted values before they enter the Brain. | Paste a sign-up update; extract; inspect; apply; observe the new proposal. |
| The agent waits on humans for everything. | It autonomously writes a versioned internal recovery brief and candidate comparison. Booking and attendee publication still require approval. | Open the internal brief, then inspect the two unexecuted actions. |
| The action label always names Agora. | The action, message and committed room all use the selected target. | Approve a 20-person relocation to Studio 03. |
| A blocked proposal looks like a refresh will fix it. | Missing/stale evidence and an unsatisfiable room constraint have different blocker types. No-room blocks offer no refresh-as-repair button or outgoing message draft. | Try 90 attendees, then refresh: it stays blocked. |
| A requirements change before maintenance can leave an over-capacity event “on schedule.” | The assigned room is reassessed after every requirements revision. | Start fresh; set 70 attendees; Agora is proposed without inventing a closure. |
| One inline reference can camouflage an uncited second sentence. | The model-envelope validator rejects sentences without citations, in addition to unknown/mismatched source IDs. | Model unit tests. This checks citation structure, not semantic entailment. |
| Documentation says undeployed even though a live version exists. | Deployment status is read from Sites, and submission docs separate deployed access, model configuration and observed model success. | README and submission links. |

## What remains deliberately bounded

The graph is deterministic, derived from a small structured world; it is not an embedding index or general document-discovery engine. Text interpretation may be wrong; the review step exists for that reason. A valid citation is not proof that a model sentence is true. Server rules, evidence fingerprints and transaction checks govern action eligibility independently of the model.

The agent is reactive to source-ingestion actions, not a persistent background worker. Roles are sandbox impersonation, not production identity. Sources and energy values are synthetic. All bookings and messages are mocks. These limits should be said plainly in the demo.

## Competitive position

The defensible claim is: “A campus can adapt to changing facts without treating an old approval as permission for a new decision.” Make that visible by changing the event live. Do not claim a measured efficiency improvement, real campus adoption, production readiness or a numeric chance of winning.

The prize category to target depends on the model actually verified on the submitted build. A real Gemma 4 run supports the Gemma category and an open-model AI story; a closed-model prototype alone does not establish either.

## Last checks requiring a human

Confirm the organizer's actual submission cutoff and judging format. The participant previously reported 19:15 in Italy / 22:15 PKT; the organizer's published schedule lists submission at 19:00. The safest working target is 22:00 PKT on 24 October 2026. The attached brief's title slide says 31 October, another inconsistency to resolve with the host.

Test the submitted URL using the intended judge's access. The existing Site is restricted to its owner until its audience is explicitly changed. Keep a local demo available if venue connectivity fails.
