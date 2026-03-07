import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { executeGraphQL } from "./graphql";
import {
  getSiteSettingsPersonalizeConnectPath,
  getSiteDataPersonalizeConnectPath,
  ensurePersonalizeConnectFolder,
  ensureSiteDataPersonalizeConnectFolder,
} from "./config-store";

const MODULES_PARENT_ID = "{E6904C9A-3ACE-4B53-B465-4C05C6B1F1CC}";
const TEMPLATE_PATH = "/sitecore/templates/Modules/PersonalizeConnect/PersonalizeConnectConfig";

interface ItemResult {
  itemId: string;
  name?: string;
  path?: string;
}

interface QueryItemResponse {
  item: ItemResult | null;
}

interface CreateTemplateFolderResponse {
  createItemTemplateFolder: {
    item: { name: string; itemId: string };
  };
}

interface CreateItemTemplateResponse {
  createItemTemplate: {
    itemTemplate: { name: string; templateId: string };
  };
}

export interface ModuleInstallationStatus {
  isInstalled: boolean;
}

export async function getModuleInstallationStatus(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string
): Promise<ModuleInstallationStatus> {
  try {
    const settingsPath = getSiteSettingsPersonalizeConnectPath(sitePath);
    const dataPath = getSiteDataPersonalizeConnectPath(sitePath);
    const [templateData, settingsData, dataFolderData] = await Promise.all([
      executeGraphQL<QueryItemResponse>(
        client,
        sitecoreContextId,
        `query {
          item(where: { database: "master", path: "${TEMPLATE_PATH}" }) {
            itemId
            name
            path
          }
        }`
      ),
      executeGraphQL<QueryItemResponse>(
        client,
        sitecoreContextId,
        `query {
          item(where: { database: "master", path: "${settingsPath}" }) {
            itemId
            name
            path
          }
        }`
      ),
      executeGraphQL<QueryItemResponse>(
        client,
        sitecoreContextId,
        `query {
          item(where: { database: "master", path: "${dataPath}" }) {
            itemId
            name
            path
          }
        }`
      ),
    ]);
    return {
      isInstalled: !!(
        templateData?.item?.path &&
        settingsData?.item?.path &&
        dataFolderData?.item?.path
      ),
    };
  } catch {
    return { isInstalled: false };
  }
}

export async function initializeModule(
  client: ClientSDK,
  sitecoreContextId: string,
  sitePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const templateExists = await executeGraphQL<QueryItemResponse>(
      client,
      sitecoreContextId,
      `query { item(where: { database: "master", path: "${TEMPLATE_PATH}" }) { itemId } }`
    ).then((d) => !!d?.item?.itemId);

    if (!templateExists) {
      const gaFolderResp = await executeGraphQL<CreateTemplateFolderResponse>(
        client,
        sitecoreContextId,
        `mutation {
          createItemTemplateFolder(input: {
            name: "PersonalizeConnect"
            parent: "${MODULES_PARENT_ID}"
          }) {
            item { name, itemId }
          }
        }`
      );

      const folderId = gaFolderResp?.createItemTemplateFolder?.item?.itemId;
      if (!folderId) {
        return { success: false, error: "Failed to create template folder" };
      }

      await executeGraphQL<CreateItemTemplateResponse>(
        client,
        sitecoreContextId,
        `mutation {
          createItemTemplate(input: {
            name: "PersonalizeConnectConfig"
            parent: "${folderId}"
            icon: "Office/32x32/chart_renko.png"
            sections: {
              name: "Personalize Connect"
              fields: [
                { name: "Config", type: "Multi-Line Text" }
                { name: "RenderingId", type: "Single-Line Text" }
              ]
            }
          }) {
            itemTemplate { name, templateId }
          }
        }`
      );
    }

    // Create both site Settings and Data folders
    await ensurePersonalizeConnectFolder(client, sitecoreContextId, sitePath);
    await ensureSiteDataPersonalizeConnectFolder(client, sitecoreContextId, sitePath);

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
