import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { executeGraphQL } from "./graphql";

/** SDK-consumed config shape (friendlyId, contentMap, defaultKey) */
export interface PersonalizeConnectConfigCore {
  friendlyId: string;
  contentMap: Record<string, string>;
  defaultKey: string;
}

/** Stored config: SDK shape + metadata for storage and display */
export interface PersonalizeConnectConfig extends PersonalizeConnectConfigCore {
  componentName: string;
  renderingId: string;
  experienceId: string;
  updatedAt: string;
}

const CONFIG_TEMPLATE_PATH = "/sitecore/templates/Modules/PersonalizeConnect/PersonalizeConnectConfig";

/**
 * Derive site path from page path.
 * E.g. /sitecore/content/ai-incubator/Avelin/Home -> /sitecore/content/ai-incubator/Avelin
 */
export function getSitePathFromPagePath(pagePath: string): string {
  const parts = pagePath?.split("/").filter(Boolean) ?? [];
  if (parts.length >= 4) {
    return `/${parts.slice(0, 4).join("/")}`;
  }
  return pagePath;
}

export async function getItemId(
  client: ClientSDK,
  sitecoreContextId: string,
  path: string
): Promise<string | null> {
  const data = await executeGraphQL<{ item: { itemId: string } | null }>(
    client,
    sitecoreContextId,
    `query {
      item(where: { database: "master", path: "${path}" }) {
        itemId
      }
    }`
  );
  return data?.item?.itemId ?? null;
}

export function getSiteSettingsPersonalizeConnectPath(sitePath: string): string {
  return `${sitePath}/Settings/PersonalizeConnect`;
}

export function getSiteDataPersonalizeConnectPath(sitePath: string): string {
  return `${sitePath}/Data/PersonalizeConnect`;
}

/**
 * Ensure {sitePath}/Settings/PersonalizeConnect exists.
 * Assumes {sitePath}/Settings already exists (standard site structure).
 */
export async function ensurePersonalizeConnectFolder(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string
): Promise<string> {
  const pcPath = getSiteSettingsPersonalizeConnectPath(sitePath);
  const existing = await getItemId(client, sitecoreContextId, pcPath);
  if (existing) return existing;

  const settingsId = await getItemId(client, sitecoreContextId, `${sitePath}/Settings`);
  if (!settingsId) throw new Error(`Settings folder not found at ${sitePath}/Settings`);

  return createFolder(client, sitecoreContextId, settingsId, "PersonalizeConnect");
}

/**
 * Ensure {sitePath}/Data/PersonalizeConnect exists.
 * Assumes {sitePath}/Data already exists (standard site structure).
 */
export async function ensureSiteDataPersonalizeConnectFolder(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string
): Promise<string> {
  const pcPath = getSiteDataPersonalizeConnectPath(sitePath);
  const existing = await getItemId(client, sitecoreContextId, pcPath);
  if (existing) return existing;

  const dataId = await getItemId(client, sitecoreContextId, `${sitePath}/Data`);
  if (!dataId) throw new Error(`Data folder not found at ${sitePath}/Data`);

  return createFolder(client, sitecoreContextId, dataId, "PersonalizeConnect");
}

/**
 * Ensure {sitePath}/Data/PersonalizeConnect/{pageId} exists.
 */
async function ensureDataPersonalizeConnectFolder(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string,
  pageId: string
): Promise<string> {
  const pcId = await ensureSiteDataPersonalizeConnectFolder(client, sitecoreContextId, sitePath);
  const pagePath = `${getSiteDataPersonalizeConnectPath(sitePath)}/${pageId}`;
  const existing = await getItemId(client, sitecoreContextId, pagePath);
  if (existing) return existing;

  return createFolder(client, sitecoreContextId, pcId, pageId);
}

async function createFolder(
  client: ClientSDK,
  sitecoreContextId: string,
  parentId: string,
  name: string
): Promise<string> {
  const folderTemplateId = await getFolderTemplateId(client, sitecoreContextId);
  const data = await executeGraphQL<{ createItem: { item: { itemId: string } } }>(
    client,
    sitecoreContextId,
    `mutation {
      createItem(input: {
        name: "${name}"
        templateId: "${folderTemplateId}"
        parent: "${parentId}"
        language: "en"
        database: "master"
      }) {
        item { itemId }
      }
    }`
  );
  const itemId = data?.createItem?.item?.itemId;
  if (!itemId) throw new Error(`Failed to create folder: ${name}`);
  return itemId;
}

const FOLDER_TEMPLATE_PATH = "/sitecore/templates/Common/Folder";
let _cachedFolderTemplateId: string | null = null;

async function getFolderTemplateId(
  client: ClientSDK,
  sitecoreContextId: string
): Promise<string> {
  if (_cachedFolderTemplateId) return _cachedFolderTemplateId;
  const id = await getItemId(client, sitecoreContextId, FOLDER_TEMPLATE_PATH);
  if (!id) throw new Error(`Folder template not found at ${FOLDER_TEMPLATE_PATH}`);
  _cachedFolderTemplateId = id;
  return id;
}

export async function getConfigTemplateId(
  client: ClientSDK,
  sitecoreContextId: string
): Promise<string> {
  const data = await executeGraphQL<{ item: { itemId: string } | null }>(
    client,
    sitecoreContextId,
    `query {
      item(where: { database: "master", path: "${CONFIG_TEMPLATE_PATH}" }) {
        itemId
      }
    }`
  );
  const templateId = data?.item?.itemId;
  if (!templateId) throw new Error("PersonalizeConnectConfig template not found. Initialize the module first.");
  return templateId;
}

/** Migrate legacy config shape (variantMap, experienceFriendlyId) to new (contentMap, friendlyId, defaultKey) */
function migrateConfig(raw: Record<string, unknown>, renderingId: string): PersonalizeConnectConfig | null {
  const contentMap = (raw.contentMap ?? raw.variantMap) as Record<string, string> | undefined;
  const friendlyId = (raw.friendlyId ?? raw.experienceFriendlyId) as string | undefined;
  if (!contentMap || typeof contentMap !== "object" || !friendlyId) return null;

  const keys = Object.keys(contentMap);
  const defaultKey = (raw.defaultKey as string) ?? keys[0] ?? "";

  return {
    ...raw,
    friendlyId,
    contentMap,
    defaultKey,
    renderingId: (raw.renderingId as string) ?? renderingId,
    componentName: (raw.componentName as string) ?? "",
    experienceId: (raw.experienceId as string) ?? "",
    updatedAt: (raw.updatedAt as string) ?? new Date().toISOString(),
  } as PersonalizeConnectConfig;
}

export function getConfigPath(sitePath: string, pageId: string): string {
  return `${sitePath}/Data/PersonalizeConnect/${pageId}`;
}

export async function loadConfig(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string,
  pageId: string,
  renderingId: string
): Promise<PersonalizeConnectConfig | null> {
  const configPath = getConfigPath(sitePath, pageId);

  const data = await executeGraphQL<{
    item?: {
      children?: { nodes?: Array<{ itemId: string; name: string; fields?: { nodes?: Array<{ name: string; value: string }> } }> };
    };
  }>(
    client,
    sitecoreContextId,
    `query {
      item(where: { database: "master", path: "${configPath}" }) {
        children {
          nodes {
            itemId
            name
            fields(ownFields: true) {
              nodes { name value }
            }
          }
        }
      }
    }`
  );

  const nodes = data?.item?.children?.nodes ?? [];
  const configItemName = `config-${renderingId}`;
  for (const node of nodes) {
    const matchesByName = node.name === configItemName;
    const renderingField = node.fields?.nodes?.find((f) => f.name === "RenderingId");
    const matchesByField = renderingField?.value === renderingId;
    if (matchesByName || matchesByField) {
      const configField = node.fields?.nodes?.find((f) => f.name === "Config" || f.name === "Value");
      if (configField?.value) {
        try {
          const raw = JSON.parse(configField.value) as Record<string, unknown>;
          return migrateConfig(raw, renderingId) as PersonalizeConnectConfig;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export async function saveConfig(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string,
  pageId: string,
  config: PersonalizeConnectConfig
): Promise<void> {
  const configJson = JSON.stringify(config);
  const pageFolderPath = getConfigPath(sitePath, pageId);
  const configPath = `${pageFolderPath}/config-${config.renderingId}`;

  try {
    const existingId = await getItemId(client, sitecoreContextId, configPath);
    if (existingId) {
      const escapedConfig = configJson.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      await executeGraphQL(
        client,
        sitecoreContextId,
        `mutation {
          updateItem(input: {
            path: "${configPath}"
            fields: [{ name: "Config", value: "${escapedConfig}" }]
          }) {
            item { itemId }
          }
        }`
      );
      return;
    }

    const pageFolderId = await ensureDataPersonalizeConnectFolder(
      client,
      sitecoreContextId,
      sitePath,
      pageId
    );
    const templateId = await getConfigTemplateId(client, sitecoreContextId);
    const itemName = `config-${config.renderingId}`;
    const escapedConfig = configJson.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    await executeGraphQL(
      client,
      sitecoreContextId,
      `mutation {
        createItem(input: {
          name: "${itemName}"
          templateId: "${templateId}"
          parent: "${pageFolderId}"
          language: "en"
          database: "master"
          fields: [
            { name: "Config", value: "${escapedConfig}" }
            { name: "RenderingId", value: "${config.renderingId}" }
          ]
        }) {
          item { itemId }
        }
      }`
    );
  } catch (e) {
    throw new Error(`Failed to save config: ${e instanceof Error ? e.message : String(e)}`);
  }
}
