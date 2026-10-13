# Domain Docs

This repository uses a single-context domain documentation layout.

## Before exploring

- Read root `GLOSSARY.md` when it exists.
- Read decisions in `docs/adr/` relevant to the area being explored.
- Read `docs/site-versions.md` before changing either site version.
- Follow the existing product and design sources listed in `AGENTS.md`.

If the glossary or ADRs do not exist, proceed silently. Do not suggest
creating them upfront. The `domain-modeling` skill creates them lazily
when terms or decisions are resolved.

## File structure

- `GLOSSARY.md`: shared domain vocabulary.
- `docs/adr/`: architecture decision records.

## Use the glossary's vocabulary

Use defined domain terms in issue titles, proposals, hypotheses, and
test names. Avoid synonyms the glossary explicitly excludes.

If a needed concept is absent, reconsider whether it belongs to the
project or note the gap for `domain-modeling`.

## Flag ADR conflicts

Explicitly identify proposals that contradict an existing ADR and
explain why the decision should be reconsidered.
