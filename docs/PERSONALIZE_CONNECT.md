# Personalize Connect — Technical Design

**A zero-code bridge between SitecoreAI components and Sitecore Personalize Full Stack Interactive Experiences.**

This document describes the architecture, API contract, and SDK design. For installation and usage, see the main [README](../README.md).

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Architecture Overview](#architecture-overview)
- [Core Concepts](#core-concepts)
- [How It Works](#how-it-works)
- [The API Response Contract](#the-api-response-contract)
- [Configuration Schema](#configuration-schema)
- [SDK Technical Design](#sdk-technical-design)
- [Validation](#validation)
- [Project Structure](#project-structure)
- [Deferred / Future Scope](#deferred--future-scope)

---

## The Problem

Connecting Sitecore Personalize Full Stack Interactive Experiences to SitecoreAI components currently requires custom development for every implementation. A developer must:

1. Write code to call the Personalize API (`POST /v2/callFlows`)
2. Handle the response and map it to component content
3. Build the logic to swap datasources based on decisioning outcomes
4. Deploy the changes for every new experience

Content editors and marketers cannot self-serve. Every personalization rule that uses Personalize's decisioning engine (segments, ML models, real-time context) requires a developer in the loop.

## The Solution

| Concern | Owner | Tool |
|---------|-------|------|
| **What content to show** | Content Editor | SitecoreAI (datasources) |
| **Who sees what** | Personalize | Interactive Experience (decisioning logic) |
| **Wiring them together** | Content Editor | Marketplace App (point-and-click config) |

The SDK handles the runtime glue automatically — no per-component code, no deployments for new experiences.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    AUTHORING TIME                        │
│  ┌──────────────────────┐    ┌───────────────────────┐  │
│  │   XMC Page Builder   │    │  Sitecore Personalize  │  │
│  │  Marketplace App ────┼────┼─ Interactive Experiences│  │
│  │  Config saved on     │    │  (decisioning logic)   │  │
│  │  rendering layout    │    └───────────────────────┘  │
│  └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      RUNTIME                            │
│  Page loads → SDK reads config → POST /v2/callFlows     │
│  Personalize returns contentKey → Lookup in contentMap  │
│  Fetch datasource via GraphQL → Component re-renders    │
└─────────────────────────────────────────────────────────┘
```

---

## Core Concepts

**The Marketplace app is the source of truth.** It defines the content options and labels them. Personalize just picks the label.

1. The content editor defines possible content outcomes in the Marketplace app (each mapped to an XMC datasource)
2. Each outcome gets a string key (e.g., `"new-visitor"`, `"returning-visitor"`)
3. The Interactive Experience's API response must return one of those keys via `contentKey`
4. The SDK matches the returned key to the right datasource

---

## How It Works

### 1. Marketplace App (Authoring Time)

1. **Select a component** — Lists components on the page
2. **Link a Personalize Experience** — Dropdown of Interactive Experiences from the tenant
3. **Define content outcomes** — Map content keys to XMC datasources
4. **Set default key** — Fallback for initial load and errors
5. **Save & Publish** — Config stored on rendering in layout data

### 2. Personalize Interactive Experience

The experience runs decisioning logic and returns `{ "contentKey": "<value>" }`. The value must match a key in the Marketplace app's content map.

### 3. SDK (Runtime)

1. Page loads → Component renders with default datasource
2. SDK reads `personalizeConnect` config from layout data
3. SDK calls `POST /v2/callFlows` with `friendlyId` and `browserId`
4. Personalize returns `{ "contentKey": "returning-visitor" }`
5. SDK looks up `contentMap["returning-visitor"]` → datasource GUID
6. SDK fetches datasource via XMC GraphQL
7. Component re-renders with personalized content

---

## The API Response Contract

Every experience must return:

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

---

## Configuration Schema

Stored on the rendering in XMC layout data:

```json
{
  "personalizeConnect": {
    "friendlyId": "homepage_promo",
    "contentMap": {
      "new-visitor": "{XMC-DATASOURCE-GUID-WELCOME}",
      "returning-visitor": "{XMC-DATASOURCE-GUID-LOYALTY}",
      "default": "{XMC-DATASOURCE-GUID-GENERIC}"
    },
    "defaultKey": "default"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `friendlyId` | `string` | Personalize Interactive Experience friendly ID |
| `contentMap` | `Record<string, string>` | Maps contentKey → XMC datasource GUIDs |
| `defaultKey` | `string` | Key for initial load and fallback |

---

## SDK Technical Design

| Component | Role |
|-----------|------|
| `PersonalizeProvider` | React context, browserId management |
| `withPersonalizeConnect` | HOC — reads config, calls experience, swaps datasource |
| `usePersonalizeExperience` | Hook alternative for manual control |

**Fallback & error handling:** No config → normal render. Unrecognized key, API failure, or timeout → stay on `defaultKey`.

---

## Validation

The Marketplace app can fire a test call to the experience and validate:

1. Response contains `contentKey`
2. Returned value exists in the content map

---

## Project Structure

```
packages/
├── sdk/                  # npm publishable runtime SDK
│   ├── PersonalizeProvider, withPersonalizeConnect, usePersonalizeExperience
│   └── personalizeClient, contentResolver, types
└── marketplace/          # SitecoreAI Pages sidebar plugin (Next.js)
    └── ComponentSelector, ExperiencePicker, OutcomeMapper, etc.
```

---

## Deferred / Future Scope

| Feature | Why Deferred |
|---------|--------------|
| SSG variant pre-rendering | Build pipeline integration; client-side swap proves concept |
| Multiple components per page | Happy path = one per page |
| Complex outcome payloads | `contentKey` → datasource covers 80% of use cases |
| CDP identity merge | Anonymous browserId is happy path |
| Event-driven triggers | Page-load-only for hackathon |
