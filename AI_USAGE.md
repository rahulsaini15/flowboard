# AI usage log

## Tools used

Copilot assistance was used to interpret the SDE2 take-home brief, scaffold the React + TypeScript implementation, draft store and UI code, create tests, and prepare the project documentation.

## What AI helped with

- Translating the brief into domain types, permission rules, seed fixtures, UI surfaces, and a validation checklist.
- Generating the first pass of the client-side store and React components.
- Drafting test cases and user-facing documentation.

## Corrections and rejected output

- An initial generated version introduced an out-of-scope server/API implementation. It was identified as unrelated to this brief, removed from the repository, and not used as the product implementation.
- The SDE2 brief requires no backend. The app uses typed fixture data and an in-memory client store; localStorage persistence is optional and intentionally omitted so demos reset predictably.
- Permission enforcement is implemented in the store rather than relying only on hidden UI controls.
- Generated behavior and requirements are being validated against the source PDF and the project's build, lint, and test commands.
