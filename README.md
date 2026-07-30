# CivicLens

CivicLens is a source-grounded civic intelligence prototype that turns a public-meeting record into inspectable decisions, commitments, deadlines, geographic context, and resident next steps.

[Launch the public app](https://civiclens.fsaguilar16.chatgpt.site) · [Read the technical report](https://civiclens.fsaguilar16.chatgpt.site/civiclens-technical-report.pdf) · [Open the research notebook](https://decisionsystemslab.org/systems/civiclens)

## What it demonstrates

- A visible seven-role review process around one public record
- Timestamped claim extraction with source-basis inspection
- A strict distinction between decisions, commitments, deadlines, and proposals
- Geographic grounding and neighborhood-level context
- A Civic Challenger pass that exposes uncertainty and missing evidence
- Human disposition controls, a full trace, and JSON export

## Research boundary

CL-0.1 is an interaction-research prototype. Its meeting, transcript, map, people, and deadlines are synthetic. It does not analyze live video, provide official guidance, guarantee deadlines, infer identity, or automate civic participation. The upload control demonstrates a future ingestion path but does not replace the bundled research record.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

## Project structure

- `app/` — interface, simulation, method view, and export logic
- `public/` — social card and downloadable technical report
- `.openai/hosting.json` — public Sites project metadata

## License

MIT © 2026 Fatima Aguilar
