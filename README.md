<img src="docs/images/personalize-connect-logo.png" alt="Personalize Connect" width="200" />

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
- **Personalize API credentials** (API Key and Secret) — configured in the Marketplace app via Settings / ConnectWizard and stored in the Sitecore content tree; no environment variables required
- **Install SDK package in the rendering host** — Follow the [SDK README](packages/sdk/README.md)
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

**Personalize credentials** are configured in the Marketplace app, not via environment variables. Use the Connect flow (first-time setup) or the Settings page to enter your Personalize API Key, Secret, and Region. Credentials are stored securely in the Sitecore content tree at `{sitePath}/Settings/PersonalizeConnect/Credentials`.

**Rendering host (SDK):** In XM Cloud, the SDK uses the Edge proxy — pass `sitecoreEdgeContextId` and `siteName` to `PersonalizeProvider`. No Personalize API credentials are needed in the rendering host; the Edge proxy handles calls server-side using credentials stored in Sitecore.

## Usage instructions

### 1. Open the Marketplace app in Page Builder

In XM Cloud Pages, open the Personalize Connect app from the sidebar. It lists components on the current page. Use the footer to access **Settings** (configure Personalize API credentials) and **Docs** (marketer-facing usage guide).

<img src="docs/images/personalize-connect-ui.png" alt="Personalize Connect configuration panel" width="50%" />

### 2. Select a component and link an experience

1. **Connect credentials** (first time): Use the Connect flow to enter your Personalize API Key, Secret, and Region. Use **Settings** in the footer to view or update credentials later.
2. Select the component to personalize (e.g., Promo Card).
3. Choose a Full Stack Interactive Experience from the dropdown (fetched from Personalize).
4. Define content keys and map each to an XM Cloud datasource (e.g., `"new-visitor"` → Welcome Offer, `"returning-visitor"` → Loyalty Deal).
5. Set the default key (used on initial load and as fallback).
6. Save. Configuration is stored in the content tree and published with the page.

### 3. Personalize Interactive Experience setup

*Coming soon.* A walkthrough of how to configure a Full Stack Interactive Experience in Sitecore Personalize (e.g., create the experience, define variants, and return `contentKey`).

### 4. Ensure your experience returns `contentKey`

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

### 5. Integrate the SDK in your rendering host

```tsx
// app/layout.tsx or _app.tsx
import { PersonalizeProvider } from "personalize-connect-sdk";

export default function RootLayout({ children }) {
  return (
    <PersonalizeProvider
      sitecoreEdgeContextId={process.env.SITECORE_EDGE_CONTEXT_ID}
      siteName={process.env.SITECORE_SITE_NAME}
    >
      {children}
    </PersonalizeProvider>
  );
}
```

The SDK uses the XM Cloud Edge proxy for Personalize calls and datasource resolution. Personalize credentials are configured in the Marketplace app and stored in Sitecore — no API keys needed in the rendering host.

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

The HOC looks up config from the content tree (loaded by the provider on mount), renders with the default datasource first, calls the experience asynchronously, and re-renders with personalized content when the response returns.

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
