# Personalize Connect SDK

[![npm](https://img.shields.io/npm/v/personalize-connect-sdk)](https://www.npmjs.com/package/personalize-connect-sdk)

Runtime SDK for [Personalize Connect](https://github.com/Sitecore-Hackathon/2026-Team-Solo) — a zero-code bridge between SitecoreAI components and Sitecore Personalize Full Stack Interactive Experiences.

The SDK reads configuration authored by the Marketplace app (stored in the content tree), calls Personalize for a decision via the Edge proxy, resolves the matching datasource from Experience Edge, and swaps component content — with zero per-component code. In Page Builder, components with personalization get a visual indicator.

## Installation

```bash
npm install personalize-connect-sdk
```

Peer dependency: `react` >= 18.

## Quick Start (SitecoreAI)

> **Note:** Content SDK supports Page Router; App Router support coming soon.

### 1. Wrap your app with `PersonalizeProvider`

In `_app.tsx` (Pages Router) or `layout.tsx` (App Router):

```tsx
import { PersonalizeProvider } from "personalize-connect-sdk";

export default function App({ children }) {
  return (
    <PersonalizeProvider
      sitecoreEdgeContextId={process.env.SITECORE_EDGE_CONTEXT_ID}
      siteName={process.env.SITECORE_SITE_NAME}
      debug // remove in production
    >
      {children}
    </PersonalizeProvider>
  );
}
```

That's it for provider setup. One prop (`sitecoreEdgeContextId`) drives everything:

- **Browser ID** — fetched from `edge-platform.sitecorecloud.io/v1/init`
- **Personalize calls** — routed through the Edge proxy (`/v1/personalize`)
- **Datasource resolution** — built-in via Edge proxy GraphQL
- **Config loading** — auto-discovered from the content tree via Edge
- **Editing detection** — auto-detected from JSS Sitecore context

### 2. Wrap components with `withPersonalizeConnect`

```tsx
import { withPersonalizeConnect } from "personalize-connect-sdk";

const PromoCard = ({ fields }) => (
  <div>
    <h2>{fields?.title?.value}</h2>
    <p>{fields?.body?.value}</p>
  </div>
);

export default withPersonalizeConnect(PromoCard);
```

The HOC:

1. Looks up config from the content tree (loaded by the provider on mount)
2. Renders with the default datasource immediately
3. Calls Personalize asynchronously for a content decision
4. Resolves the matching datasource from Experience Edge
5. Re-renders with personalized `fields`
6. In Page Builder, shows a visual indicator (purple border + badge)

### 3. Or use the `usePersonalizeExperience` hook

```tsx
import { usePersonalizeExperience } from "personalize-connect-sdk";

function MyComponent({ rendering }) {
  const config = /* get config from context or props */;
  const { contentKey, resolvedFields, isLoading, error } = usePersonalizeExperience(config);

  if (isLoading) return <Skeleton />;
  return <div>{resolvedFields?.heading?.value}</div>;
}
```

## Provider Props

### SitecoreAI (recommended)

| Prop                    | Required | Description                                                              |
| ----------------------- | -------- | ------------------------------------------------------------------------ |
| `sitecoreEdgeContextId` | Yes      | Edge Context ID — drives all Edge proxy calls                            |
| `siteName`              | Yes      | SitecoreAI site name                                                     |
| `sitecoreEdgeUrl`       | No       | Edge platform URL (defaults to `https://edge-platform.sitecorecloud.io`) |

### Common

| Prop                | Default  | Description                                                     |
| ------------------- | -------- | --------------------------------------------------------------- |
| `channel`           | `"WEB"`  | Channel for Personalize calls                                   |
| `language`          | `"EN"`   | Language code                                                   |
| `currencyCode`      | `"USD"`  | Currency code                                                   |
| `timeout`           | `600`    | Personalize call timeout (ms)                                   |
| `debug`             | `false`  | Enable `[PersonalizeConnect]` console logging                   |
| `isEditing`         | auto     | Override Page Builder editing detection                         |
| `sitePath`          | auto     | Override site root path auto-discovery                          |
| `resolveDatasource` | built-in | Custom datasource resolver (overrides built-in Edge resolution) |

## How Config Loading Works

The Marketplace app stores configs in the content tree at:

```
{sitePath}/Data/PersonalizeConnect/{pageItemId}/config-{renderingId}
```

On mount, the SDK:

1. Reads the page item ID from `__NEXT_DATA__` (JSS layout data)
2. Queries Edge for the page item's content tree path
3. Derives the site root path (first 4 path segments)
4. Fetches all config children for that page in one GraphQL query
5. Caches them in context, keyed by rendering instance ID

Each HOC looks up its config via `props.rendering.uid`. No config on the rendering means no personalization — the component renders normally.

## Config Shape

Authored by the Marketplace app, stored as JSON in the content tree:

```ts
interface PersonalizeConnectConfig {
  friendlyId: string; // Personalize Interactive Experience ID
  contentMap: Record<string, string>; // contentKey -> datasource GUID
  defaultKey: string; // Fallback key
}
```

## Debug Logging

Pass `debug` to the provider to trace the full flow in the browser console:

```
[PersonalizeConnectSDK] Provider mounting { mode: 'Context ID', ... }
[PersonalizeConnectSDK] BrowserId (edge): from cookie abc123...
[PersonalizeConnectSDK] Config loader: Auto-discovered site path: /sitecore/content/company/company
[PersonalizeConnectSDK] Config loader: loaded config for rendering xyz → experience homepage_promo
[PersonalizeConnectSDK] [PromoCard] Config active: { friendlyId: 'homepage_promo', ... }
[PersonalizeConnectSDK] callPersonalize [homepage_promo] → contentKey: returning-visitor
[PersonalizeConnectSDK] [PromoCard] Fields resolved — swapping props.fields
```

## Exports

**Provider & Context**

- `PersonalizeProvider` — Wrap your app
- `usePersonalizeContext` — Access context directly

**HOC & Hook**

- `withPersonalizeConnect` — Zero-code personalization HOC
- `usePersonalizeExperience` — Hook for manual control

**Config**

- `loadPageConfigs` — Load configs from Edge (used internally, exported for advanced use)

**Edge Resolution**

- `createEdgeResolver` — Direct Edge GraphQL resolver (legacy)
- `createEdgeProxyResolver` — Edge proxy resolver (Context ID mode)

**Browser ID**

- `getBrowserId` — Legacy local cookie
- `getEdgeBrowserId` — Edge proxy init

**Editing**

- `isEditingMode` — Page Builder detection

**Debug**

- `setDebug`, `isDebugEnabled` — Control logging

**Types**

- `PersonalizeConnectConfig`, `PersonalizeConnectProviderProps`, `PersonalizeContextValue`, `ComponentFields`, `CallFlowsRequest`, etc.
