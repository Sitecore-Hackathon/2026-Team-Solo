[x] - Dylan Test Write Access

![Hackathon Logo](docs/images/hackathon.png?raw=true "Hackathon Logo")

# Sitecore Hackathon 2026

- MUST READ: **[Submission requirements](SUBMISSION_REQUIREMENTS.md)**
- [Entry form template](ENTRYFORM.md)

### ⟹ [Insert your documentation here](ENTRYFORM.md) <<

---

## Personalize Connect

Monorepo for the Personalize Connect hackathon entry — links Page Builder components to Sitecore Personalize Full Stack experiences.

### Structure

| Package | Description |
|---------|-------------|
| **[packages/marketplace](packages/marketplace)** | Page Builder context panel for configuring component → experience → datasource mapping |
| **[packages/sdk](packages/sdk)** | Rendering host SDK — resolves active outcomes and datasources at runtime |

### Quick start

```bash
pnpm install
pnpm run build
```

- **Run the app:** `pnpm run dev` (starts the marketplace app)
- **Build all:** `npm run build`
- **Build marketplace only:** `npm run build:marketplace`
- **Build SDK only:** `npm run build:sdk`

### Deployment

- **Marketplace (Netlify):** Uses `pnpm` (detected via `pnpm-lock.yaml`). See `netlify.toml`.
- **SDK (npm):** From `packages/sdk`, run `pnpm publish`. Update `repository.url` in `packages/sdk/package.json` before publishing.
