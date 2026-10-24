# Submission copy

## Title

H-OS · Campus Rescue

## One sentence

A campus brain that adapts to changing event requirements, explains every room decision, and binds human approval to the exact evidence behind a mock recovery.

## Description

A last-minute room closure should not turn into scattered messages and guesswork. Campus Rescue connects one synthetic event, its room inventory, maintenance evidence and policy in a source-backed Brain. The Librarian versions changes and uses Gemma 4 to turn ordinary-language event updates into reviewable requirements. The agent checks every room, saves an internal recovery brief on its own, and proposes a concrete mock room move and announcement.

Change the attendance live: 20 people can use Studio 03, 48 need Agora, and 90 cannot be safely accommodated. Add a whiteboard or video conferencing and the decision changes again. The constraint matrix shows why every room passed or failed; accessibility is never traded away. A changed or expired source invalidates the previous approval. Only an organizer can commit the two mock consequential effects, together and once.

Organizer, facilities and attendee views are filtered on the server, including model context and graph relationships. All records and energy figures are synthetic. No real H-FARM system is accessed, no real room is booked and no message is sent.

## Why the open model is part of the workflow

Gemma 4 `gemma-4-26b-a4b-it` runs through the Gemini API. Its Librarian task interprets unstructured updates into bounded typed facts; the reviewer sees the actual extracted values before applying them. It also supplies cited explanations and Q&A. Rules govern constraints, freshness, permission and execution independently of the model. Unavailable inference is visibly labeled rather than presented as successful AI.

## Design choices and journey

The first prototype had a fixed recovery and a hardcoded linked-facts counter. Adversarial review led to a real typed relationship projection, live changes that produce different room decisions, explicit autonomous internal work, and a no-safe-room case the agent refuses to bypass. We kept one complete workflow instead of adding speculative agents. See [the review](RED-TEAM.md).

## Links and facts

- Demo: https://hos-campus-rescue-muneeb.beigebirch2.chatgpt.site
- Public MIT source: https://github.com/muneeb-ahmadch/h-os-campus-rescue
- One-page architecture: `/architecture.html` on the demo, with its source in `public/architecture.html`.
- Model: Google Gemma 4 `gemma-4-26b-a4b-it`, Gemini API; real local extraction and recovery explanations verified on 24 October 2026. Hosted result verification is recorded after deployment.
- Team: Muneeb Ahmad, solo.
- Stack: React/Vinext, TypeScript, Cloudflare Worker, D1, Gemini API.

## Final operational checks

1. Confirm final build and hosted inference results. Configuration alone is insufficient evidence.
2. Verify the URL as a judge: public access has been requested for judges. Verify it without an owner session after deployment. The repository is public.
3. Reset and rehearse the [two-minute walkthrough](DEMO.md); keep local preview available.
4. Confirm the host's cutoff. Work toward **22:00 PKT on 24 October 2026** because the organizer schedule lists 19:00 in Italy; the participant previously reported 19:15 / 22:15 PKT. The original event-page copy and PDF contain other date/time inconsistencies. Do not assume the later time is permission to submit late.
5. Claim only categories supported by the submitted working build and the organizer's final rules. A numeric win probability is not measurable from the available information.
