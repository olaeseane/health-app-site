# Git workflow

This repo uses GitHub Issues as the unit of planned work. One implementation issue maps to one feature branch and one pull request.

## Branches

- Start feature branches from an up-to-date `main`.
- Only implement `ready-for-agent` issues unless the user explicitly asks otherwise.
- Use branch names like `issue-10-task-navigator`.
- Keep the branch scoped to the issue; move unrelated discoveries into follow-up issues.
- Use a worktree instead of the current checkout only when parallel work is needed.

## Pull requests

- Open a pull request from the feature branch back into `main`.
- Link the pull request to the issue with `Closes #<number>` when it completes the issue, or `Refs #<number>` when it is partial or exploratory.
- Follow the established `[codex] ...` title style and use `Summary`, `Validation`, and optional `Notes` sections in the body.
- For visual changes, include before/after screenshots and report relevant responsive, keyboard, focus, reduced-motion, and overflow checks.
- Do not merge until the smallest relevant verification has passed or the remaining risk is stated clearly.

## Commands

```sh
git switch main
git pull --ff-only
git switch -c issue-10-task-navigator
```

For parallel work:

```sh
git fetch origin
git worktree add ../health-app-site-issue-10 -b issue-10-task-navigator origin/main
```
