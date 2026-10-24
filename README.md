# H-OS · Campus Rescue

[Public source](https://github.com/muneeb-ahmadch/h-os-campus-rescue) · [Hosted preview (owner-private)](https://hos-campus-rescue-muneeb.beigebirch2.chatgpt.site)
A campus event copilot that turns a last-minute room closure into a sourced recovery plan, then waits for an organizer to approve the consequential actions.

This hackathon prototype uses a small synthetic campus. It does not connect to H-FARM systems, monitor people, book real rooms, or send real messages.

## The demo

1. An event is scheduled in the Greenhouse.
2. Facilities ingests a synthetic maintenance notice closing that room.
3. The Librarian versions the evidence and links the closure to the event. The agent prepares an internal recovery proposal from eligible rooms.
4. An organizer reviews the proposed room move, attendee message, and source citations.
5. Approval atomically records the mock booking change and mock message. An attendee sees the resulting public event update.

If relevant evidence changes, an earlier proposal becomes invalid. Stale evidence blocks execution until refreshed. Seeded sources expire after two hours of real time, so the freshness check also applies without a simulated update. The model generates the recovery explanation and cited answers. The proposed attendee message is deterministic, as are room eligibility, permission, approval validity, and execution.

## Challenge coverage

| Brief concept | Implementation |
| --- | --- |
| Brain | Versioned synthetic sources, event and room facts, source citations, and a linked activity history |
| Librarian | Ingests maintenance updates, tracks freshness, and invalidates proposals when evidence changes |
| Agent | Detects the disrupted event and prepares a recovery proposal using deterministic constraints |
| Human approval | Organizer reviews a specific proposal before either mock action executes |
| Three roles | Organizer, facilities, and attendee responses are filtered by the server |
| Grounded answers | Answers include citations to permitted evidence; optional hosted model assistance is clearly labeled |

The role selector is deliberate **sandbox impersonation** for a single demo session. It demonstrates server-side data filtering and capability checks, but it is not enterprise authentication or proof that a visitor holds a real campus role. Each browser session has a separate synthetic world stored in D1.

## Run locally

Prerequisites: Node.js **22.13.0 or newer**, npm, and an internet connection for the initial dependency install. No real campus credentials are required. A provider API key is optional for hosted model assistance.

From this checkout:

```sh
npm install
npm run build
```

Apply the included D1 migration once to the local preview database:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flashy_metal_master.sql
```

Then start development:

```sh
npm run dev -- --hostname 127.0.0.1
```

Open the URL printed by the server (normally `http://127.0.0.1:5173`). Development and the built preview share `.wrangler/state`. Apply each pending migration once; do not repeatedly replay already applied SQL.

To preview the built Worker instead:

```sh
npm start
```

Use the URL printed by Wrangler. `npm start` is a local preview command; it does not publish a site. If source or bindings change, rebuild before previewing the built Worker. Generate future schema migrations with `npm run db:generate`.

## Optional hosted model

Create an ignored `.dev.vars` file in the project root. For an Anthropic prototype:

```dotenv
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key_here
AI_MODEL=claude-sonnet-5-5
```

For a Gemini-hosted Gemma model:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMMA_MODEL=your_verified_gemma_model_id
```

For an open model through OpenRouter:

```dotenv
AI_PROVIDER=openrouter
AI_API_KEY=your_key_here
AI_MODEL=your_verified_open_model_id
```

Configure one provider path and use a model ID actually available to that account. Keep secrets out of source control and out of browser code. Restart the local server after changing the file. Hosted Sites secrets must be configured through the hosting platform; a local `.dev.vars` file is not a deployment secret store.

The model module makes provider calls server-side. The dashboard and answers distinguish configured model assistance from **rules-only** behavior. A configured key alone is not evidence of a successful model call: confirm that the returned plan or answer reports model use before claiming a live AI demo. With no usable key or a failed provider call, deterministic recovery still works and the interface reports the fallback.

On **24 October 2026**, a real Anthropic `claude-sonnet-5-5` Q&A call was verified in the local setup: it returned `mode: "model"` with role-permitted `event-v1` and `announcement-v1` citations in about two seconds. This verifies that provider path locally; it does not establish hosted deployment access or open-model eligibility.

**Challenge eligibility:** Claude is a closed model. An Anthropic-powered prototype alone does not establish an open-weight model requirement. Before submission, select an eligible open model, verify a successful call on the submitted instance, and record its exact model ID. The presence of the Gemini or OpenRouter integration alone does not prove eligibility.

## Verify

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Verified on **24 October 2026**: `npm test` passes all **19 tests**, covering the domain engine, model response validation and fallback, provenance labeling, D1 session isolation, and concurrent approval consistency. Model adapter unit tests use mocked provider responses; the real Anthropic call above was a separate check.

Then follow the [90-second demo and failure cases](docs/DEMO.md). In particular, verify that facilities cannot approve, attendees receive only public evidence, stale evidence blocks approval, changed evidence invalidates an existing proposal, and repeated approval does not execute the mock actions twice. Passing a build does not establish those behaviors or prove a hosted model call succeeded.

## Project map

- `app/`: interface and API routes
- `lib/contracts.ts`: shared dashboard and action types
- `lib/model.ts`: optional hosted-model boundary
- `db/` and `drizzle/`: D1 storage schema and migration
- [Architecture](docs/ARCHITECTURE.md): trust boundaries and data flow
- [Demo guide](docs/DEMO.md): judge walkthrough and edge cases
- [Submission copy](docs/SUBMISSION.md): pitch and final verification fields

## Scope and limitations

This is a single-event hackathon sandbox. Sources are seeded or simulated, and execution updates only the sandbox. Room availability is a synthetic snapshot, not a campus scheduling integration. Session isolation is cookie-based; it is not organization membership management. The agent runs in response to demo actions rather than a durable background scheduler. Production use would require real identity and role assignments, verified source connectors, robust job handling, and separately authorized action integrations.

The app is prepared for Sites hosting with a Cloudflare Worker and D1 binding named `DB`. It has not yet been deployed. Hosted access is private to the owner by default: judges need an explicit access grant or an intentionally public setting. Verify the deployed URL as a judge before submission. A public repository URL also remains to be confirmed. This README documents local execution, not a general production deployment procedure.

## License

Original H-OS code and documentation are offered under [MIT](LICENSE). Third-party dependencies and vendored files retain their own licenses; see their package metadata and the license notices in `vendor/` and `scripts/vite/`.

## Validation

Verified on 24 October 2026: 19 automated tests, TypeScript checks and production build passed; 18 HTTP checks covered role isolation, evidence updates and exactly-once approval. Browser review covered 1280, 653 and 390px layouts, source details, invalidation and completed mock recovery. Real Anthropic Q&A and recovery explanations returned source citations. Hosted access remains owner-private by default.
