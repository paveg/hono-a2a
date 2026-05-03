# Contributing to hono-a2a

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/paveg/hono-a2a.git
cd hono-a2a
pnpm install
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Run tests (vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm build` | Build ESM + CJS (tsup) |
| `pnpm lint` | Check linting (Biome) |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format code |
| `pnpm typecheck` | Type check (tsc --noEmit) |

## Workflow

1. Fork the repository and create a branch from `main`.
2. Write tests first, then implement your changes (TDD).
3. Run `pnpm test` and `pnpm typecheck` to verify.
4. Run `pnpm lint` — a pre-commit hook runs Biome automatically.
5. Open a pull request against `main`.

## Code Style

- **Formatter/Linter**: Biome (tabs, double quotes, semicolons, 100-char line width)
- **Tests**: vitest with 90% coverage target (v8 provider)
- **Comments**: English only; write "why", not "what"

## Peer Dependencies

This package requires two peer dependencies:

- `hono >= 4.0.0` — the web framework this adapter integrates with
- `@a2a-js/sdk >= 0.3.0` — provides the A2A protocol types and request handler interface

When writing tests or examples, install both as devDependencies.

## A2A Protocol Context

hono-a2a exposes an A2A (Agent-to-Agent) protocol adapter for Hono. The adapter:

- Mounts a JSON-RPC 2.0 endpoint for `message/send` and `message/stream` methods
- Serves an Agent Card at `/.well-known/agent-card.json`
- Supports SSE streaming for `message/stream` responses

If you are adding new protocol methods or extending the agent card schema, refer to the
[A2A specification](https://google.github.io/A2A/) for the canonical definitions.

## Commit Messages

Keep commit messages concise and descriptive. Use [Changesets](https://github.com/changesets/changesets) for versioning:

```bash
pnpm changeset
```

## Release Flow

```
push to main
└─ release.yml triggered
   └─ changesets/action decides
      │
      ├─ .changeset/*.md exists
      │  → Creates/updates a "Version Packages" PR
      │    └─ ci-pass status auto-applied → ready to merge
      │
      └─ No .changeset/*.md (right after merging Version Packages PR)
         → npm publish + GitHub Release created automatically
```

Contributors only need to **add a changeset and submit a PR**.
Versioning and publishing are fully automated after merge.

## Reporting Issues

Use [GitHub Issues](https://github.com/paveg/hono-a2a/issues). For security vulnerabilities, see [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the [Apache-2.0 License](./LICENSE).
