import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { executeGraphQL } from "./graphql";
import {
  getItemId,
  getConfigTemplateId,
  ensurePersonalizeConnectFolder,
  getSiteSettingsPersonalizeConnectPath,
} from "./config-store";

export interface PersonalizeCredentials {
  apiKey: string;
  apiSecret: string;
  region?: string;
}

function getCredentialsPath(sitePath: string): string {
  return `${getSiteSettingsPersonalizeConnectPath(sitePath)}/Credentials`;
}

/**
 * Load Personalize credentials from the Sitecore content tree.
 * Path: {sitePath}/Settings/PersonalizeConnect/Credentials
 */
export async function loadCredentials(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string
): Promise<PersonalizeCredentials | null> {
  try {
    const path = getCredentialsPath(sitePath);
    const data = await executeGraphQL<{
      item?: {
        fields?: { nodes?: Array<{ name: string; value: string }> };
      };
    }>(
      client,
      sitecoreContextId,
      `query {
        item(where: { database: "master", path: "${path}" }) {
          fields(ownFields: true) {
            nodes { name value }
          }
        }
      }`
    );

    const configField = data?.item?.fields?.nodes?.find(
      (f) => f.name === "Config" || f.name === "Value"
    );
    if (!configField?.value) return null;

    const parsed = JSON.parse(configField.value) as Partial<PersonalizeCredentials>;
    if (!parsed.apiKey || !parsed.apiSecret) return null;

    return {
      apiKey: parsed.apiKey,
      apiSecret: parsed.apiSecret,
      region: parsed.region ?? "us",
    };
  } catch {
    return null;
  }
}

/**
 * Save Personalize credentials to the Sitecore content tree.
 * Path: {sitePath}/Settings/PersonalizeConnect/Credentials
 */
export async function saveCredentials(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string,
  credentials: PersonalizeCredentials
): Promise<void> {
  const configJson = JSON.stringify({
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
    region: credentials.region ?? "us",
  });

  const path = getCredentialsPath(sitePath);
  const existingId = await getItemId(client, sitecoreContextId, path);

  const escapedConfig = configJson.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  if (existingId) {
    await executeGraphQL(
      client,
      sitecoreContextId,
      `mutation {
        updateItem(input: {
          path: "${path}"
          fields: [{ name: "Config", value: "${escapedConfig}" }]
        }) {
          item { itemId }
        }
      }`
    );
    return;
  }

  const parentId = await ensurePersonalizeConnectFolder(
    client,
    sitecoreContextId,
    sitePath
  );

  const templateId = await getConfigTemplateId(client, sitecoreContextId);

  await executeGraphQL(
    client,
    sitecoreContextId,
    `mutation {
      createItem(input: {
        name: "Credentials"
        templateId: "${templateId}"
        parent: "${parentId}"
        language: "en"
        database: "master"
        fields: [
          { name: "Config", value: "${escapedConfig}" }
          { name: "RenderingId", value: "credentials" }
        ]
      }) {
        item { itemId }
      }
    }`
  );
}
