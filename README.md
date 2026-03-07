## Team name

⟹ Team Solo
⟹ App Name: Personalize Connect

## Category

⟹ Best Marketplace App for Sitecore AI

## Description

**Personalize Connect** — A zero-code bridge between Sitecore XM Cloud components and Sitecore Personalize Full Stack Interactive Experiences.

- **Module Purpose:** Enable content editors to wire up Personalize decisioning to XM Cloud components directly from the Page Builder — no developer required. The Marketplace app lets editors select a component, link it to a Personalize Interactive Experience, map content keys to datasources, and publish. The SDK handles runtime decisioning and content swapping automatically.
- **What problem was solved:** Connecting Personalize Full Stack experiences to XM Cloud components currently requires custom development for every implementation — developers must write API calls, map responses, and deploy for each new experience. Content editors cannot self-serve.
- **How this module solves it:** Separates concerns cleanly: XM Cloud owns content, Personalize owns decisioning, and the Marketplace app provides point-and-click wiring. The SDK reads config from layout data, calls `POST /v2/callFlows`, resolves the returned `contentKey` to the correct datasource, fetches content via GraphQL, and re-renders the component. No per-component code or deployments for new experiences.

For detailed architecture, API contract, and SDK design, see [docs/PERSONALIZE_CONNECT.md](docs/PERSONALIZE_CONNECT.md).

## Video link

⟹ [Replace this Video link](#video-link) — Provide a 2–3 minute video describing purpose, setup, and usage.

## Pre-requisites and Dependencies

- **SitecoreAI**
- **Sitecore Personalize** tenant with Full Stack Interactive Experiences
- **Personalize API credentials** (client key, point of sale) for the Marketplace app and SDK (configured in the Marketplace app)
- **Install SDK package in the rendering host** (npm install personalize-connect-sdk) - Follow the instructions in the [SDK README](packages/sdk/README.md)
- **Node.js 20+** and **pnpm** for the monorepo
- **@sitecore-marketplace-sdk/client** and **@sitecore-marketplace-sdk/xmc** (installed via `pnpm install`)

## Installation instructions

1. Clone the repository and install dependencies:

   ```bash
   git clone <repo-url>
   cd 2026-Team-Solo
   pnpm install
   ```

2. Build all packages:

   ```bash
   pnpm run build
   ```

3. **Marketplace app:** Deploy to Netlify (or run locally with `pnpm run dev`). Configure the Sitecore Marketplace to load the app as a Pages sidebar plugin. See `netlify.toml` for build settings.

4. **SDK:** Add to your XM Cloud rendering host (Next.js JSS or Content SDK app):

   ```bash
   pnpm add personalize-connect-sdk
   ```

   Or from the local package:

   ```bash
   pnpm add file:../packages/sdk
   ```

5. Wrap your app with `PersonalizeProvider` and components with `withPersonalizeConnect` (see Usage).

### Configuration

**Marketplace app (environment variables):**

| Variable                                | Description                |
| --------------------------------------- | -------------------------- |
| `NEXT_PUBLIC_PERSONALIZE_CLIENT_KEY`    | Personalize API client key |
| `NEXT_PUBLIC_PERSONALIZE_POINT_OF_SALE` | Point of sale identifier   |
| `NEXT_PUBLIC_XMC_GRAPHQL_ENDPOINT`      | XM Cloud GraphQL endpoint  |

**Rendering host (SDK):**

| Variable                                | Description                |
| --------------------------------------- | -------------------------- |
| `NEXT_PUBLIC_PERSONALIZE_CLIENT_KEY`    | Personalize API client key |
| `NEXT_PUBLIC_PERSONALIZE_POINT_OF_SALE` | Point of sale identifier   |

Create a `.env.local` (or equivalent) in `packages/marketplace` and your rendering host with the above values.

## Usage instructions

### 1. Open the Marketplace app in Page Builder

In XM Cloud Pages, open the Personalize Connect app from the sidebar. It lists components on the current page.

![Hackathon Logo](docs/images/hackathon.png?raw=true "Hackathon Logo")

_Add screenshots of the Marketplace app UI (component selector, experience picker, content mapper) to `docs/images/` and link them here._

### 2. Select a component and link an experience

1. Select the component to personalize (e.g., Promo Card).
2. Choose a Full Stack Interactive Experience from the dropdown (fetched from Personalize).
3. Define content keys and map each to an XM Cloud datasource (e.g., `"new-visitor"` → Welcome Offer, `"returning-visitor"` → Loyalty Deal).
4. Set the default key (used on initial load and as fallback).
5. Save. Configuration is stored on the rendering in layout data and published with the page.

### 3. Ensure your experience returns `contentKey`

Your Personalize Interactive Experience must return JSON in this format:

```json
{ "contentKey": "<string>" }
```

Example FreeMarker:

```freemarker
<#if guest.sessions?size gt 3>
{ "contentKey": "returning-visitor" }
<#else>
{ "contentKey": "new-visitor" }
</#if>
```

### 4. Integrate the SDK in your rendering host

```tsx
// app/layout.tsx or _app.tsx
import { PersonalizeProvider } from "personalize-connect-sdk";

export default function RootLayout({ children }) {
  return (
    <PersonalizeProvider
      clientKey={process.env.NEXT_PUBLIC_PERSONALIZE_CLIENT_KEY}
      pointOfSale={process.env.NEXT_PUBLIC_PERSONALIZE_POINT_OF_SALE}
    >
      {children}
    </PersonalizeProvider>
  );
}
```

```tsx
// components/PromoCard.tsx
import { withPersonalizeConnect } from "personalize-connect-sdk";

const PromoCard = ({ fields }) => (
  <div>
    <h2>{fields.title.value}</h2>
    <p>{fields.body.value}</p>
  </div>
);

export default withPersonalizeConnect(PromoCard);
```

The HOC reads `personalizeConnect` config from the rendering, renders with the default datasource first, calls the experience asynchronously, and re-renders with personalized content when the response returns.

### Project structure

| Package                                      | Description                                               |
| -------------------------------------------- | --------------------------------------------------------- |
| [packages/marketplace](packages/marketplace) | Page Builder context panel (Next.js app)                  |
| [packages/sdk](packages/sdk)                 | Runtime SDK (PersonalizeProvider, withPersonalizeConnect) |

### Quick start (local dev)

```bash
pnpm install
pnpm run build
pnpm run dev   # Starts marketplace app on :5555
```

## Comments

Personalize Connect targets the hackathon scope: one component per page, client-side content swap, and anonymous browserId. The architecture is designed to support future enhancements (SSG pre-rendering, multiple components, CDP identity, edge-side decisioning) without rearchitecting the core.
