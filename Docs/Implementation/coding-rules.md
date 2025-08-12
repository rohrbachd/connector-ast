# Core coding-rules
- Always prefer simple solutions
- Avoid duplication of code whenever possible, which means checking for other areas of the codebase that might already have similar code and functionality
- Write code that takes into account the different environments: dev, test, and prod
- You are careful to only make changes that are requested or you are confident are well understood and related to the change being requested
- When fixing an issue or bug, do not introduce a new pattern or technology without first exhausting all options for the existing implementation. And if you finally do this, make sure to remove the old ipmlementation afterwards so we don't have duplicate logic.
- Keep the codebase very clean and organized
- Avoid writing scripts in files if possible, especially if the script is likely only to be run once
- Avoid having files over 200-300 lines of code. Refactor at that point.
- Mocking data is only needed for tests, never mock data for dev or prod
- Never add stubbing or fake data patterns to code that affects the dev or prod environments
- Never overwrite my env file without first asking and confirming
- The source code must be the same for both local deveklopment and the remote production server deployment
- A local development and testing environment is required that does not require access to the live server
- CSS code blocks musty be in *.css files and not in the *.html files
- Javascript code must reside in *.js files and not in script blocks of *.html files.
- When creating or editing new code blocks, provide explicit documentation. For JS code, using JSDoc-style formatting.
- The code is required to be the same for development, test, and production. For example do not create code that only runs in one environment or has conditional code for one environment. Use environmental variables and .env files to distinquish differences between runtime environments.
- Always fix the root issue, don't write code that masks or covers up the issue.
- When writing unit-tests, don't change the source code to get the units to work, let the unit tests fail until the root source code issue is resolved.
- If the project uses python, setup a virtual environment for it

# 1) Core Principles (the "why")

KISS – Prefer the simplest design that works; complexity grows costs non‑linearly.
SRP – Each module/class/function has one reason to change.
DRY – Don't repeat knowledge; centralize behavior.
Tell, don't ask – Expose behavior, not internal data; avoid feature envy.
YAGNI – Don't build for hypothetical futures.

Boy Scout Rule – Leave the code a little cleaner than you found it.

Command–Query separation – Functions should either do something or answer something, not both.

Small, cohesive units – Prefer many small, focused parts over few large ones.

# 3) Naming

Use intention‑revealing names; prefer clarity over brevity (invoiceTotal not it).
Avoid mental mapping; don't encode types or Hungarian notation.
Use domain language consistently (ubiquitous language). Align with docs and APIs.
Name booleans as predicates (isEmpty, hasAccess).
Rename without fear—good names are a refactor, not a luxury.

# 4) Functions

Keep functions short (ideally 5–20 lines) and single‑purpose.
One level of abstraction per function; extract details into helpers.
Minimize arguments (0–2 typical). Prefer parameter objects for related groups.
Return early for guard clauses; avoid deep nesting.
No side effects unless the function's name clearly promises them.
Prefer pure functions when feasible.

# 5) Comments

Prefer expressive code over comments; delete comments after making code self‑explanatory.
Keep comments truthful and local (no stale block comments).
Use comments for: legal notices, non‑obvious rationale, warnings about performance constraints, and public API docs.

# 6) Formatting

Consistent auto‑formatting (prettier/clang‑format/ktlint etc.).
One concept per line; vertical density shows relatedness; blank lines separate concepts.
Keep files small; if a file exceeds ~200–300 LOC, consider splitting by responsibility.

# 7) Objects & Data Structures

Hide internals; expose behaviors. Avoid getter/setter obsession.
Prefer immutable data for shared state; copy on write or builders when needed.
Favor composition over inheritance. Derive when you truly need polymorphism.
Push logic to where the data lives; avoid anemic domain models for core logic.

# 8) Error Handling

Use exceptions over error codes; keep happy path clear.
Fail fast and close to the source. Log once at the boundary, not everywhere.
Don't return null or accept null casually—use Option/Optional/Result where available.
Wrap third‑party exceptions at boundaries to protect the domain from leakage.

# 9) Boundaries & Interfaces

Isolate third‑party libraries behind thin adapters (anti‑corruption layer).
Shape incoming/outgoing DTOs at the boundary; keep domain types pure.
Validate inputs at the edge. Inside the system, trust types.
Keep public APIs small and stable; prefer private/internal by default.

# 10) Tests (Design aid, not afterthought)

Tests must be fast, reliable, readable, and isolated.
One logical assertion per test; expressive names (it_calculates_vat_for_reduced_rate).
Prefer TDD on complex logic to drive design and regression safety.
Use test doubles sparingly; mock behavior you own, not third‑party internals.
Avoid over‑specifying implementation details; test observable behavior.
Testing Pyramid (guideline)

Many unit tests → some component/service tests → few end‑to‑end tests.

# 11) Concurrency & State

Prefer immutable data and message passing; avoid shared mutable state.
Keep critical sections tiny; use proven concurrency primitives.
Design for timeouts, retries, idempotency at integration boundaries.

# 12) Code Smells & Heuristics (watchlist)

Long functions/classes/files → Refactor by responsibility.
Deep nesting, multiple if/switch on the same concept → Polymorphism or lookup tables.
Shotgun surgery (one change touches many places) → Improve cohesion.
Feature envy (method uses another object's data extensively) → Move method.
Primitive obsession → Introduce types/value objects.
Duplicate code → Extract and reuse.
Boolean flags that change behavior → Split into separate functions/types.

# 13)  Environment & Configuration (team policy)

Same source code for dev/test/prod; differences expressed via configuration (.env, flags, manifests). Never fork logic by environment.
Local dev should not require access to live systems; provide seed data and test doubles.
Avoid ad‑hoc one‑off scripts in the repo; when needed, place them under /tools with docs and cleanup plan.
Never overwrite another developer's environment files; provide example templates (e.g., .env.example).

# 15) Frontend/JS/CSS Guidelines

Keep JS in .js/.ts and CSS in .css files; avoid large inline blocks.
Use module boundaries: feature folders, index barrels, and clear public surface.
Prefer functional components/hooks (React) and unidirectional data flow.
Keep styles co‑located but decoupled (CSS modules/Tailwind) and avoid global leakage.

# 16) Language‑Specific Notes

TypeScript/JS: enable strict mode; prefer readonly types; narrow unions; avoid any.
Java/Kotlin: favor records/data classes; Lombok sparingly; constructor injection.
Python: use virtual environments; type hints (PEP 484) on public functions.

# 17) Introducing New Tech/Patterns (safety rail)

Don't introduce new frameworks/patterns during bug fixes. First, exhaust options within the current approach. If replacement is justified, propose a small RFC/ADR: rationale, impact, migration, rollback.

When replacing, remove the old path to avoid duplicate logic. Plan the migration and cleanup in the same issue/PR series.

# 18) Refactoring Playbook (small, steady steps)

Add tests or characterization tests around the behavior.
Extract small functions; name them after intent.
Remove duplication; introduce value objects.
Move behavior to where data lives.
Flatten nesting; return early.
Re‑run tests; commit in safe increments.