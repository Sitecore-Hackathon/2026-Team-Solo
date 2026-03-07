# Contributing to Personalize Connect

Thanks for your interest in contributing! This project is currently in beta and welcomes contributions from the Sitecore community.

## Getting Started

1. Fork the repository.
2. Clone your fork and install dependencies:

```bash
git clone https://github.com/<your-username>/2026-Team-Solo.git
cd 2026-Team-Solo
pnpm install
```

3. Build all packages:

```bash
pnpm run build
```

4. Start the marketplace app locally:

```bash
pnpm run dev
```

## Project Structure

| Package | Description |
|---------|-------------|
| `packages/marketplace` | Page Builder context panel (Next.js app) |
| `packages/sdk` | Runtime SDK (`PersonalizeProvider`, `withPersonalizeConnect`) |

## Making Changes

1. Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature
```

2. Make your changes. Follow the existing code style — TypeScript, no unnecessary comments.
3. Build and verify:

```bash
pnpm run build
```

4. Commit with a clear message describing what and why.
5. Push to your fork and open a pull request against `main`.

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Include a clear description of what the change does and why.
- Ensure the build passes (`pnpm run build`).
- If changing the SDK, bump the version in `packages/sdk/package.json`.

## SDK Changes

When modifying the SDK (`packages/sdk`):

- Run `pnpm run build` from the root to rebuild.
- Test against a SitecoreAI JSS rendering host if possible.
- Update `packages/sdk/README.md` if the public API changes.

## Reporting Issues

Open an issue on GitHub with:

- A clear description of the problem or feature request.
- Steps to reproduce (for bugs).
- Expected vs actual behavior.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Questions?

Reach out to **dylan.young@velir.com**.
