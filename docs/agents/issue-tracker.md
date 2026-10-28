# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `olaeseane/health-app-site`.
Use the `gh` CLI from this repository.

## Conventions

- Create: `gh issue create --title "..." --body-file <path>`.
- Read: `gh issue view <number> --json number,title,body,labels,comments`.
- List: `gh issue list --state open --json number,title,body,labels,comments`.
- Comment: `gh issue comment <number> --body-file <path>`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."`
  or `--remove-label "..."`.
- Close: `gh issue close <number> --comment "..."`.
- For multiline bodies and comments, write the exact text to a temporary
  file and pass it with `--body-file`.
- Follow `docs/agents/git-workflow.md` for implementation branches and PRs.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares issue and PR numbers. Resolve an ambiguous number with
`gh pr view <number>`, falling back to `gh issue view <number>`.

## Skill operations

When a skill says "publish to the issue tracker", create a GitHub issue.
When it says "fetch the relevant ticket", read the issue with its comments.
