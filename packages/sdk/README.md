# Personalize Connect SDK

A lightweight Next.js package that bridges Sitecore Personalize Interactive Experiences with XM Cloud component datasources at runtime. The SDK reads configuration authored by the Marketplace app, calls Personalize for a decision, and swaps component content accordingly — with zero per-component code.

## Installation

```bash
npm install personalize-connect-sdk
```

Peer dependency: `react` >= 18.

## Usage

### 1. Wrap your app with `PersonalizeProvider`

```tsx
import { PersonalizeProvider } from "personalize-connect-sdk";

export default function RootLayout({ children }) {
  return (
    <PersonalizeProvider
      clientKey={process.env.NEXT_PUBLIC_PERSONALIZE_CLIENT_KEY!}
      pointOfSale={process.env.NEXT_PUBLIC_PERSONALIZE_POINT_OF_SALE!}
      resolveDatasource={async (datasourceId) => {
        // Fetch datasource fields via Experience Edge GraphQL or Layout Service
        const res = await fetch(`/api/datasource/${datasourceId}`);
        return res.json();
      }}
    >
      {children}
    </PersonalizeProvider>
  );
}
```

### 2. Wrap components with `withPersonalizeConnect`

```tsx
import { withPersonalizeConnect } from "personalize-connect-sdk";
import MyComponent from "./MyComponent";

// Config is read from props.rendering.personalizeConnect (or customize via getConfig)
export default withPersonalizeConnect(MyComponent);
```

The HOC renders immediately with the default datasource, calls Personalize asynchronously, and re-renders with personalized content when resolved. No changes needed inside the component.

### 3. Or use the `usePersonalizeExperience` hook

```tsx
import { usePersonalizeExperience } from "personalize-connect-sdk";

function MyComponent({ personalizeConnect }) {
  const { contentKey, resolvedFields, isLoading, error } = usePersonalizeExperience(personalizeConnect);

  if (isLoading) return <Skeleton />;
  return <div>{resolvedFields?.heading}</div>;
}
```

## Config shape

Config is attached to each rendering in XMC layout data (authored by the Marketplace app):

```ts
interface PersonalizeConnectConfig {
  friendlyId: string;           // Personalize Interactive Experience ID
  contentMap: Record<string, string>;  // contentKey -> datasource GUID
  defaultKey: string;           // Fallback key if experience fails
}
```

## Exports

- `PersonalizeProvider`, `usePersonalizeContext` — Provider and context
- `withPersonalizeConnect` — HOC for zero-code personalization
- `usePersonalizeExperience` — Hook for manual control
- `callPersonalize` — Low-level API client
- `resolveContent` — Map contentKey to datasource fields
- `getBrowserId` — Browser ID cookie helper
- Types: `PersonalizeConnectConfig`, `PersonalizeConnectProviderProps`, etc.
