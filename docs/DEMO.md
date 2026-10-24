# Campus Rescue demo guide

## Before the demo

- Install, build, apply the local D1 migration, and launch using the README.
- Open the app, select the organizer role, and reset the synthetic world.
- Confirm that the event is scheduled in the Greenhouse and no proposal is awaiting approval.
- Seeded sources expire after two hours of real time. Reset before a fresh walkthrough, or refresh stale evidence when demonstrating the freshness gate.
- A real local Anthropic `claude-sonnet-5-5` Q&A call was verified on 24 October 2026 with `mode: "model"` and permitted source citations. Before showing a deployed instance, verify a successful call there too. Check the actual reported model and result mode; a configured key alone does not verify model access. If it falls back, say “rules-only demo.”
- Check the deployed URL as the intended judge identity. The site has not yet been deployed, and Sites access defaults to owner-private. Grant judges access or intentionally make it public, then test their route to the demo.

## 90-second walkthrough

| Time | Action | Suggested narration |
| --- | --- | --- |
| 0–12 s | Show the scheduled event and source evidence. | “Campus Rescue helps an organizer respond when the room for a campus event becomes unavailable. Everything here is synthetic.” |
| 12–28 s | Switch to facilities and ingest the maintenance closure. | “The Librarian records a new version of the notice, links it to the Greenhouse event, and marks the event at risk.” |
| 28–45 s | Switch to organizer and inspect the recovery proposal. | “The agent prepares an internal recovery plan. Capacity, equipment, accessibility, availability, and policy are checked in code. Each claim links back to evidence.” |
| 45–58 s | Inspect the proposed room move and attendee message. | “The model explains the recovery and answers cited questions. The attendee message is deterministic. Both actions remain pending until the organizer approves this specific proposal.” |
| 58–72 s | Approve the proposal. | “Approval rechecks the evidence and commits both mock actions together. No real room was booked and no message was sent.” |
| 72–90 s | Switch to attendee and show the public update. | “The attendee sees the event's new location and public explanation. Private maintenance detail and approval controls stay outside this response. The role switch is a demo of server-side filtering.” |

Ingestion automatically prepares a proposal; the agent control can replan after an evidence update. Do not claim that the agent runs on a continuous background schedule.

## Evidence changed after planning

1. Reset; ingest maintenance; obtain a pending proposal.
2. Ingest the updated maintenance/evidence scenario before approving.
3. Observe that the old proposal is invalidated. An old approval must fail and neither mock action may execute.
4. Run the agent again against current evidence, inspect the new proposal, and approve it.

Suggested narration: “Approval belongs to a plan and its evidence, not to an unlimited future action.”

## Stale evidence

1. Reset and obtain a pending proposal from the maintenance scenario.
2. Apply the stale-evidence scenario.
3. Verify that approval is blocked and no mock action executes.
4. Refresh evidence, inspect the automatically generated fresh proposal, and approve it.

## Role and execution checks

| Case | Expected result |
| --- | --- |
| Facilities tries to approve | Server rejects the request; mock actions remain unexecuted |
| Attendee asks about private maintenance details | Answer uses only attendee-permitted evidence and cites that evidence |
| Attendee opens the dashboard | Operational proposal and private sources are absent from the API response |
| An old proposal ID is submitted | Server rejects it; no change to the current event |
| The same proposal is approved twice | At most one execution is recorded |
| Hosted model is unavailable | Labeled rules-only explanation; deterministic eligibility and approval behavior remain available |
| A second browser session opens the app | It has its own synthetic scenario, rather than another session's edits |
| Reset is selected | The current session returns to its seeded event and evidence, with no pending recovery |

These are behaviors to check on the actual build. Record observed results before presenting them as passed.

## Reset between judges

Select organizer and reset the demo. Confirm the event is scheduled in the Greenhouse, the activity is back at the seeded baseline, and there is no pending proposal. The reset affects the synthetic world for the current session. Do not clear unrelated browser data.
