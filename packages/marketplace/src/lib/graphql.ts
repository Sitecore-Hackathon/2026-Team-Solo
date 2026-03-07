import type { ClientSDK } from "@sitecore-marketplace-sdk/client";

export interface GraphQLVariables {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Execute a GraphQL query via xmc.authoring.graphql.
 * Response nesting: response.data.data.X — the SDK wraps the GraphQL response.
 */
export async function executeGraphQL<T = unknown>(
  client: ClientSDK,
  sitecoreContextId: string,
  query: string,
  variables?: GraphQLVariables
): Promise<T> {
  const response = await client.mutate("xmc.authoring.graphql", {
    params: {
      body: {
        query,
        variables: variables ?? undefined,
      },
      query: {
        sitecoreContextId,
      },
    },
  });

  // SDK wraps response: response.data.data contains the actual GraphQL data
  const wrapped = response as { data?: { data?: T; errors?: Array<{ message?: string }> } };
  const data = wrapped?.data?.data;
  const errors = wrapped?.data?.errors;

  if (errors?.length) {
    const msg = errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`GraphQL error: ${msg}`);
  }
  if (!data) {
    const hint = typeof wrapped?.data === "object" ? JSON.stringify(wrapped.data).slice(0, 200) : "no data";
    throw new Error(`Invalid GraphQL response structure (${hint})`);
  }
  return data as T;
}
