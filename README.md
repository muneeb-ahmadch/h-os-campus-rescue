# H-OS · Campus Rescue

[Live demo](https://hos-campus-rescue-muneeb.beigebirch2.chatgpt.site) · [Public source](https://github.com/muneeb-ahmadch/h-os-campus-rescue) · [Architecture](docs/ARCHITECTURE.md) · [Two-minute demo](docs/DEMO.md)

**A campus that adapts when facts change, without reusing permission from an old decision.**

Maintenance closes an event room. The Librarian versions the notice, the Brain links it to the affected event, and the agent checks every replacement. It autonomously saves an internal recovery brief. An organizer approves the specific mock room move and attendee announcement together. A changed requirement or stale source makes the old approval unusable.

## Let the judge change the facts

Start with **Simulate a room closure**, then try the live scenario controls:

| Change | What the agent does |
| --- | --- |
| 48 attendees, projector and Wi-Fi | Proposes Agora; Studio 03 is too small, The Loft has no step-free access. |
| 20 attendees, same equipment | Proposes Studio 03, the eligible room with the lowest synthetic energy estimate. |
| 20 attendees and a whiteboard | Proposes Agora; Studio 03 lacks a whiteboard. |
| 90 attendees | Blocks recovery. No eligible room fits; no outgoing message is drafted. |
| Video conferencing required | Blocks recovery because none of the rooms provides it. |
| A source changes after planning | Invalidates the proposal; its earlier approval ID cannot execute. |
| Availability expires | Blocks until refreshed. Refreshing cannot fix insufficient capacity. |

The controls accept custom attendance and equipment. Step-free access remains required. Every room has a full constraint matrix, with links back to source evidence. Energy figures are synthetic estimates for the event window, not measured savings.

## Where Gemma matters

**Gemma 4 `gemma-4-26b-a4b-it` through the Gemini API** interprets ordinary-language event updates into typed attendance/equipment requirements. Interpretation is read-only: the organizer reviews the actual values before applying them to the Brain. The original notice is preserved internally. The model also explains proposals and answers questions using fresh role-permitted sources.

The model cannot change policy, waive accessibility, approve actions or execute bookings/messages. Unknown source IDs, inconsistent citation envelopes and uncited sentences are rejected. Comma-grouped references are normalized only when all IDs are permitted. These checks validate citation structure, not semantic truth. A failed explanation or Q&A call produces a visible rules-only fallback; failed extraction offers the structured controls.

On **24 October 2026**, local real Gemma extraction and recovery explanations were verified. Extraction took about 2.1 seconds and successful explanations about 4–5 seconds in that run. These are observed samples, not a latency guarantee. A subsequent 24-request local HTTP run also verified cited Gemma Q&A. Hosted inference must be verified separately after deployment. Google's [Gemma API documentation](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api) documents the selected model.

## What is actually implemented

- **Brain:** versioned sources and a typed relationship projection, with evidence on every link. The UI counter is calculated from these links. The graph is derived from structured records, not an embedding index or general document crawler.
- **Librarian:** ingests maintenance, interprets reviewed event updates, preserves source history and tracks expiry.
- **Agent:** reacts to ingestion, evaluates availability/capacity/accessibility/equipment and writes its internal recovery brief autonomously.
- **Approval:** source fingerprint and current eligibility are rechecked; D1 compare-and-swap commits the two mock effects together, once.
- **Three roles:** organizer, facilities and attendee are filtered on the server before data, graph relationships or prompts are returned.

The role switch is deliberate **sandbox impersonation**, not enterprise authentication. Every browser cookie session has a separate synthetic world. Hosted Site access is a separate boundary; the owner has made the demo public for judges. Confirm the signed-out access path on the submitted version.

## Run locally

Requires Node.js **22.13.0+** and npm. No campus credentials are used.

```sh
npm install
npm run build
```

Apply the included D1 migration once:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flashy_metal_master.sql
```

Create an ignored `.dev.vars` file:

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
AI_MODEL=gemma-4-26b-a4b-it
```

Then run:

```sh
npm run dev -- --hostname 127.0.0.1
```

Open the printed URL, normally `http://127.0.0.1:5173`. Restart after changing `.dev.vars`. `npm start` previews the built Worker locally; it does not publish. Development and built preview share `.wrangler/state`.

No key is needed for the structured scenario controls and policy engine. Gemini/Gemma is the verified open-model path. The server also has OpenRouter, Groq, Together and Anthropic adapters; their available model IDs must be checked with the relevant provider. A closed model does not establish an open-model prize requirement. Configure hosted secrets through the hosting platform, never in source or a browser bundle.

## Verify

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

With the local server running, check a separate disposable synthetic session:

```sh
npm run test:http
# Also require real extraction, a recovery explanation and cited model Q&A:
npm run test:http -- --with-model
```

Verified on 24 October 2026: **30 automated tests**, type checking, lint and production build passed. A **24-request live HTTP run** verified the loop with actual Gemma extraction, recovery explanations and cited Q&A.

The domain tests sweep attendance from **1 through 90** and cover missing equipment, no eligible room, source expiry, old approvals, role filtering, graph provenance, internal autonomous work, model validation and D1 concurrency. HTTP checks cover the complete loop through the real Worker API. The model unit tests mock providers; the `--with-model` HTTP run makes actual provider calls.

## Submission materials

- [Judge walkthrough and failure cases](docs/DEMO.md)
- [One-page architecture source](public/architecture.html), served at `/architecture.html` and printable from the browser
- [Architecture and trust boundaries](docs/ARCHITECTURE.md)
- [Adversarial review and design choices](docs/RED-TEAM.md)
- [Submission copy and remaining verification](docs/SUBMISSION.md)

Reset before each judge. The synthetic sources expire after two real hours. Demonstrate the role filter by opening the attendee view after approval; it contains only public evidence, with no recovery brief, maintenance bulletin or organizer budget.

## Scope and license

A single-event hackathon sandbox using synthetic records and mock actions. No H-FARM systems, real bookings/messages, invoices, people monitoring or scoring. No durable background agent or general-purpose document ingestion. Real deployment would need identity/role assignments, verified connectors and separately authorized integrations.

Original source and documentation are [MIT licensed](LICENSE). Third-party packages and vendored files retain their own licenses and notices.

The runtime model is **Google Gemma 4 26B A4B IT** (`gemma-4-26b-a4b-it` through the Gemini API). Its weights are released under Google's [Gemma 4 Apache 2.0 license](https://ai.google.dev/gemma/apache_2); see the [official Google model card](https://huggingface.co/google/gemma-4-26B-A4B-it). Hosted API access is separately governed by the [Gemini API terms](https://ai.google.dev/gemini-api/terms). We call a hosted model and do not redistribute model weights.

Development used Codex AI coding assistance. The submitted runtime uses Gemma for event-update interpretation, sourced recovery explanations and role-scoped Q&A; deterministic rules govern eligibility and mock execution. The project-specific implementation and improvements were built during the Hack Day on 24 October 2026.
