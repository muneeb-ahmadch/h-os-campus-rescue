# The judge controls the facts

Opening line: **“A campus should adapt when facts change, without silently reusing permission from an old decision.”**

Before every run: reset as organizer; check 48 attendees, Greenhouse and no proposal. Confirm the displayed model, then make a real extraction or cited Q&A request. “Configured” alone does not mean a model succeeded. Judge access to the hosted URL must be tested separately.

## Two-minute live walkthrough

| Time | Action | Say |
| --- | --- | --- |
| 0–15 s | Show the campus; simulate a room closure. | “This is a synthetic campus. One room closure starts the Brain–Librarian–Agent loop.” |
| 15–30 s | Show the saved internal brief and room matrix. | “The agent has already written its internal recovery brief. It checked every room. The Loft has enough seats but fails step-free access.” |
| 30–55 s | Extract the default ordinary-language update: now 20 attendees, keep projector and Wi-Fi. Review the values; apply. | “The model interprets the update. We review the actual values before writing them. The agent now prefers Studio 03; the old approval is unusable.” |
| 55–75 s | Select 90 attendees. | “Now make it impossible. No room fits. The system stops; it does not trade away accessibility or invent a booking.” |
| 75–100 s | Select 20 attendees again; inspect Studio 03; approve. | “Only this new proposal can execute. The mock room move and announcement commit together, once.” |
| 100–120 s | Switch to attendee; open Campus brain if time allows. | “The attendee sees the published location. The internal recovery brief, maintenance details and organizer budget never enter this role's response.” |

Invite the judge to choose another attendance or required piece of equipment. Video conferencing is deliberately absent from the room directory: requesting it blocks recovery. A whiteboard makes Agora preferable even for a small group. Energy values are synthetic estimates for the event window, not measured savings.

## The strongest follow-up checks

- Set 70 attendees before introducing a closure: the assigned room is too small, so the agent proposes Agora without fabricating a maintenance issue.
- Update a source after planning: the old proposal is invalidated. Replan; its previous ID remains unusable.
- Mark availability stale: the agent blocks. Refresh: new source versions restore planning if a room actually meets requirements.
- With 90 attendees, refresh the sources: recovery stays blocked because capacity did not change.
- In facilities role, attempt approval through the API: rejected. In attendee role, ask for private budget details: no private evidence is provided.
- Approve twice: the second request fails. Open a fresh cookie session: it has its own campus.

## If the model or network fails

State what happened. Use structured attendance/equipment controls for the recovery loop. The UI labels rules-only explanations and answers. Do not claim a successful open-model demo when inference failed. Keep a local running instance and the public repository ready; do not pretend a recording is live.

## Demo claims to keep precise

The graph is a typed projection of a small structured world. The agent acts when ingestion arrives, not on a durable scheduler. Its autonomous action is an internal working brief. Human approval governs the two mock consequential effects. The role selector demonstrates server filtering, not enterprise authentication. No real campus system or person is affected.
