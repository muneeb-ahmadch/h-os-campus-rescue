# Submission copy

## Title

H-OS · Campus Rescue

## One sentence

A campus event copilot that turns a room closure into an evidence-backed recovery proposal, with human approval before mock booking and attendee communication.

## Short description

Campus Rescue demonstrates a small H-OS loop around one understandable campus problem: maintenance closes the room for an upcoming event. Its Librarian versions the notice, links it to event and room facts, tracks freshness, and preserves citations. An agent checks deterministic room constraints and prepares a recovery proposal. An organizer approves the specific room move and attendee message together. If the supporting evidence changes, the old proposal is invalidated; stale evidence blocks execution.

Three demo roles show server-filtered views: facilities, organizer, and attendee. Optional hosted model assistance explains the plan and answers questions with citations. The attendee message is deterministic; server-side rules retain control over eligibility, permission, and execution. The sandbox uses synthetic data, isolated browser-session state, and mock actions. It has no real H-FARM integration or people monitoring.

## Why it matters

The useful autonomy is the work before approval: recognizing a disruption, linking evidence, checking suitable alternatives, and preparing a concrete recovery. The organizer reviews a specific plan with traceable sources and a bounded execution step.

## Stack

React and Vinext · TypeScript · Cloudflare Worker · Cloudflare D1 · optional hosted model API (Anthropic, Gemini/Gemma, or OpenRouter) · MIT license for original code and documentation.

## Links and verified facts

- **Judge-accessible demo:** Not deployed yet. Intended URL: [Campus Rescue](https://hos-campus-rescue-muneeb.beigebirch2.chatgpt.site). Verify deployment and grant judges access before submitting this link.
- **Public source repository:** https://github.com/muneeb-ahmadch/h-os-campus-rescue
- **Model actually used:** Anthropic `claude-sonnet-5-5` in the local prototype.
- **Successful live model call verified:** Yes, 24 October 2026, real local Q&A returned `mode: "model"` with `event-v1` and `announcement-v1` citations in about two seconds. Hosted verification remains pending.
- **Validation actually completed:** `npm test`: 19 passing tests covering engine, model validation/provenance, and D1 session/concurrent-approval behavior. [ADD FINAL LINT, TYPECHECK, BUILD, AND HTTP/DEMO RESULTS WHEN VERIFIED]
- **Team:** Muneeb Ahmad (solo)

The real local Claude call verifies the prototype's hosted-provider integration. Claude is closed and does not alone satisfy an open-weight requirement. Select and verify an eligible model before claiming that model-related challenge requirements are met. Describe any request that falls back as rules-only, and verify model access separately on the deployed instance.

## Final submission checks

- Deploy and confirm the demo link works as a judge, including required sign-in or explicit access grants. Sites hosting is owner-private by default; an owner session is insufficient verification.
- Confirm the repository is accessible and includes README, MIT license, source, architecture, and demo instructions.
- Run the build and behavior checks, record actual results, and test the full reset-to-approval flow once on the submitted version.
- Confirm that secrets, local state, private reference content, and generated archives are excluded from the repository.
- Submit before **22:15 PKT on 24 October 2026**, the deadline confirmed by the participant.

## Honest limits

This is a single-event hackathon prototype with synthetic evidence and mock side effects. Demo role selection is impersonation, not enterprise authorization. It has no production booking/mail integrations, verified campus connectors, or durable background job processing. Hosted model availability and judge access must be checked on the submitted instance.
