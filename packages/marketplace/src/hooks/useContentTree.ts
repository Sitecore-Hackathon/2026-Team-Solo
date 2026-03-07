"use client";

import { useCallback, useState } from "react";
import type { ClientSDK } from "@sitecore-marketplace-sdk/client";
import { executeGraphQL } from "@/lib/graphql";

export interface TreeNode {
  itemId: string;
  name: string;
  path: string;
  templateName?: string;
  hasChildren?: boolean;
}

interface GetChildrenResult {
  item?: {
    children?: {
      nodes?: Array<{
        itemId: string;
        name: string;
        path: string;
        template?: { name: string };
      }>;
    };
  };
}

const GET_CHILDREN = `
  query GetItemChildren($path: String!) {
    item(where: { database: "master", path: $path }) {
      children {
        nodes {
          itemId
          name
          path
          template { name }
        }
      }
    }
  }
`;

export function useContentTree(
  client: ClientSDK | null,
  sitecoreContextId: string | undefined,
  rootPath: string | undefined
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchChildren = useCallback(
    async (path: string): Promise<TreeNode[]> => {
      if (!client || !sitecoreContextId) return [];

      setLoading(true);
      setError(null);
      try {
        const result = await executeGraphQL<GetChildrenResult>(
          client,
          sitecoreContextId,
          GET_CHILDREN,
          { path }
        );

        const nodes = result?.item?.children?.nodes ?? [];
        return nodes.map((n) => ({
          itemId: n.itemId,
          name: n.name,
          path: n.path,
          templateName: n.template?.name,
          hasChildren: true,
        }));
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [client, sitecoreContextId]
  );

  return { fetchChildren, loading, error };
}
