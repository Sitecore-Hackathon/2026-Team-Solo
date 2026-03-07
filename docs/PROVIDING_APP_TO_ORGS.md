# Providing Personalize Connect to Other Organizations (Beta)

This document describes how to beta test Personalize Connect in other SitecoreAI organizations. **A public app will be available soon** — once published, organization admins can install it directly from the [public Marketplace](https://portal.sitecorecloud.io/marketplace) and these steps will no longer be required.

For technical architecture and setup, see [PERSONALIZE_CONNECT.md](PERSONALIZE_CONNECT.md).

---

## Beta workflow: Authorize organizations

To allow another organization to beta test the app:

1. In [App Studio](https://portal.sitecorecloud.io), go to the **Organizations** section of the Personalize Connect app configuration.
2. Authorize the organizations that may install the app.

Once authorized, organization admins or owners can install the app from the Marketplace in the Cloud Portal.

---

## Installation by organization admins

Organization admins or owners of an authorized org:

1. Open the [Cloud Portal](https://portal.sitecorecloud.io).
2. Go to **Marketplace**.
3. Find Personalize Connect in their organization's available apps.
4. Install the app and grant access to the relevant users.
5. Ensure the rendering host has the SDK installed and configured (see [SDK README](../packages/sdk/README.md)).

---

## References

- [Introduction to Sitecore Marketplace for custom and public apps](https://doc.sitecore.com/mp/en/developers/marketplace/introduction-to-sitecore-marketplace-for-custom-and-public-apps.html)
- [Configure and activate a custom app](https://doc.sitecore.com/mp/en/developers/marketplace/configure-and-activate-a-custom-app.html)
- [Extension points](https://doc.sitecore.com/mp/en/developers/marketplace/extension-points.html)
- [Sitecore Developer Portal — Marketplace](https://developers.sitecore.com/learn/getting-started/marketplace)
