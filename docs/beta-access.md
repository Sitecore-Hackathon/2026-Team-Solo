# Try Personalize Connect in Your Own Organization

This repository is public. You can create your own custom Marketplace app in App Studio, point it at the code running locally, and use it in your organization's Page Builder — no authorization from the author is needed.

A public app will be available soon. Once published, organization admins can install it directly from the [public Marketplace](https://portal.sitecorecloud.io/marketplace) and these steps will no longer be required.

For technical architecture and SDK design, see [PERSONALIZE_CONNECT.md](PERSONALIZE_CONNECT.md).

> **Note:** Images below are hosted on Sitecore's documentation CDN. If they don't display, see the [References](#references) section for links to the full Sitecore docs with screenshots.

---

## Prerequisites

- **Organization Admin** or **Organization Owner** role in your Sitecore Cloud Portal organization
- **Sitecore Personalize** tenant with Full Stack Interactive Experiences
- **Node.js 20+** and **pnpm** installed locally

---

## 1. Clone the repository and start the app

```bash
git clone https://github.com/dylanyoung-dev/2026-Team-Solo.git
cd 2026-Team-Solo
pnpm install
pnpm run build
pnpm run dev          # Starts the marketplace app on http://localhost:5555
```

Verify the app is running by opening `http://localhost:5555` in your browser.

---

## 2. Register a custom app in App Studio

1. Log in to the [Cloud Portal](https://portal.sitecorecloud.io).
2. Navigate to **App Studio > Studio**.
3. Click **Create app**.

   ![App Studio - Create app](https://delivery-sitecore.sitecorecontenthub.cloud/api/public/content/92bd92cb69564d548c38c3b78462e658?v=40c34943)

4. Enter a name (e.g., "Personalize Connect") and select **Custom** as the app type.

   ![Set name and type](https://delivery-sitecore.sitecorecontenthub.cloud/api/public/content/70442747576943729d66e4d0ef94a01e?v=ce78e7d6)

5. Click **Create**.

---

## 3. Configure the app

In the app configuration screen:

| Setting | Value |
| --- | --- |
| **Extension point** | Page context panel |
| **Route URL** | `/personalize-connect` |
| **API access** | Enable **XM Cloud APIs** |
| **Deployment URL** | `http://localhost:5555` |
| **App Logo URL** | `https://cdn-1.webcatalog.io/catalog/sitecore/sitecore-icon.png?v=1731337318728` (or any 512x512 image) |

![Configure extension point and route](https://delivery-sitecore.sitecorecontenthub.cloud/api/public/content/d2da3c36914d4b34943ca023f2b5e615?v=cfd5dc08)

![Set deployment URL](https://delivery-sitecore.sitecorecontenthub.cloud/api/public/content/567a0b08dbf8440686d055fbbf4e5e3e?v=0ece277d)

Click **Activate** in the top-right corner.

---

## 4. Install the app

1. After activation you'll be prompted to install, or go to **My Apps**.
2. Click **Install** on your new app.
3. Select the environment(s) where you want to use it.
4. Click **Install**.

   ![Install the app](https://delivery-sitecore.sitecorecontenthub.cloud/api/public/content/bd1f3f548a4a40748c039a33b5e14722?v=bf520770)

---

## 5. Use it in Page Builder

1. Open **SitecoreAI Pages** and navigate to a page.
2. The **Personalize Connect** panel appears in the Page Builder sidebar.
3. Make sure your local app is running (`pnpm run dev` on port 5555).
4. Follow the [usage instructions](../README.md#usage-instructions) to connect components to Personalize experiences.

---

## 6. Install the SDK in your rendering host

The Marketplace app configures _which_ components are personalized. The SDK handles the runtime decisioning. Add it to your JSS rendering host:

```bash
pnpm add personalize-connect-sdk
```

See the [SDK README](../packages/sdk/README.md) for provider setup and `withPersonalizeConnect` usage.

---

## References

- [Register a custom app](https://doc.sitecore.com/mp/en/developers/marketplace/register-a-custom-app.html)
- [Configure and activate a custom app](https://doc.sitecore.com/mp/en/developers/marketplace/configure-and-activate-a-custom-app.html)
- [Install an activated custom app](https://doc.sitecore.com/mp/en/developers/marketplace/install-an-activated-custom-app.html)
- [Extension points](https://doc.sitecore.com/mp/en/developers/marketplace/extension-points.html)
- [Testing and debugging a Marketplace app](https://doc.sitecore.com/mp/en/developers/marketplace/testing-and-debugging-a-marketplace-app.html)
