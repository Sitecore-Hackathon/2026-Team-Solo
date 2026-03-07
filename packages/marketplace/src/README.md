# Personalize Connect — Sitecore Marketplace App

A Sitecore AI Page Builder context panel app that lets marketers link Page Builder components to Sitecore Personalize Full Stack Interactive Experiences and map experience outcomes to content datasources.

## Extension Point

- **Route:** `/personalize-connect`
- **Type:** Page Builder Context Panel only
- **APIs:** SitecoreAI (GraphQL + datasource reads), Sitecore Personalize REST API

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run locally**
   ```bash
   npm run dev
   ```

3. **Register the app in Sitecore**
   Follow [Sitecore Marketplace documentation](https://doc.sitecore.com/mp/en/developers/marketplace/extension-points.html) to add the app as a Page Builder Context Panel extension pointing to `/personalize-connect`.

## Usage

1. Open Page Builder on a page.
2. Open **Personalize Connect** in the Apps panel.
3. Enter your Personalize API Key, API Secret, and select your region (AP, EU, JP, or US) in the setup wizard, then click **Save & Continue**.
4. Select a component from the list.
5. Choose a Personalize experience from the dropdown.
6. Map each experience outcome to a datasource item (or keep existing).
7. Click **Save**.

## Config Storage

- **Credentials** (API Key, Secret, region): `/sitecore/System/Settings/PersonalizeConnect/Credentials`
- **Component-to-experience configs**: `{sitePath}/Data/PersonalizeConnect/{pageId}/config-{renderingId}` (e.g. `/sitecore/content/Avelin/Data/PersonalizeConnect/{pageId}/...`)

The XMC Authoring GraphQL mutation in `config-store.ts` may need adjustment for your XMC schema. See [Sitecore docs](https://doc.sitecore.com/xmc/en/developers/xm-cloud/query-examples-for-authoring-operations.html).

## Project Structure

- `app/personalize-connect/page.tsx` — Main panel
- `app/api/personalize/` — Personalize API proxy routes
- `components/` — ComponentSelector, ExperiencePicker, OutcomeMapper, SaveButton, ConfigBadge
- `hooks/` — usePageComponents, usePageDatasources, usePersonalizeExperiences
- `lib/` — graphql, personalizeApi, config-store
- `utils/hooks/useMarketplaceClient.ts` — SDK initialization
