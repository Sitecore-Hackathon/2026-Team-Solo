"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { executeGraphQL } from "@/lib/graphql";

export interface DatasourceItem {
  itemId: string;
  name: string;
  path: string;
  templateName?: string;
  fields?: Array<{ name: string; value: string }>;
}

interface GetPageDatasourcesResult {
  page?: {
    itemId: string;
    name: string;
    path: string;
    presentationDetails?: string;
  };
  dataFolder?: {
    dataSources?: {
      nodes?: Array<{
        itemId: string;
        name: string;
        path: string;
        template?: { name: string };
        fields?: { nodes?: Array<{ name: string; value: string }> };
      }>;
    };
  };
}

const GET_PAGE_DATASOURCES = `
  query GetPageDatasources($pageId: String!, $dataPath: String!) {
    page: item(where: { itemId: $pageId }) {
      itemId
      name
      path
      presentationDetails
    }
    dataFolder: item(where: { path: $dataPath }) {
      dataSources: children {
        nodes {
          itemId
          name
          path
          template { name }
          fields(ownFields: true, excludeStandardFields: true) {
            nodes { name value }
          }
        }
      }
    }
  }
`;

export function usePageDatasources(
  client: ClientSDK | null,
  sitecoreContextId: string | undefined,
  pageId: string | undefined,
  pagePath: string | undefined
) {
  const [datasources, setDatasources] = useState<DatasourceItem[]>([]);
  const [pageDetails, setPageDetails] = useState<{
    presentationDetails?: string;
    pageId?: string;
    path?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDatasources = useCallback(async () => {
    if (!client || !sitecoreContextId || !pageId || !pagePath) {
      setDatasources([]);
      setPageDetails(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dataPath = `${pagePath}/Data`;
      const result = await executeGraphQL<GetPageDatasourcesResult>(
        client,
        sitecoreContextId,
        GET_PAGE_DATASOURCES,
        { pageId, dataPath }
      );

      const page = result?.page;
      const dataFolder = result?.dataFolder;
      const nodes = dataFolder?.dataSources?.nodes ?? [];

      setPageDetails({
        presentationDetails: page?.presentationDetails,
        pageId: page?.itemId,
        path: page?.path,
      });

      const items: DatasourceItem[] = nodes.map((n) => ({
        itemId: n.itemId,
        name: n.name,
        path: n.path,
        templateName: n.template?.name,
        fields: n.fields?.nodes?.map((f) => ({ name: f.name, value: f.value })) ?? [],
      }));
      setDatasources(items);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setDatasources([]);
      setPageDetails(null);
    } finally {
      setLoading(false);
    }
  }, [client, sitecoreContextId, pageId, pagePath]);

  useEffect(() => {
    fetchDatasources();
  }, [fetchDatasources]);

  return {
    datasources,
    pageDetails,
    loading,
    error,
    refetch: fetchDatasources,
  };
}
