/**
 * Typed Personalize REST API client (v3 flowDefinitions).
 * Used server-side only — never expose credentials to the client.
 */

export interface PersonalizeFlow {
  ref: string;
  id: string;
  friendlyId?: string;
  name?: string;
  status?: string;
  type?: string;
  subtype?: string;
  channels?: string[];
  variants?: PersonalizeVariant[];
}

export interface PersonalizeVariant {
  ref?: string;
  name?: string;
  isControl?: boolean;
}

export interface PersonalizeFlowDetail extends PersonalizeFlow {
  traffic?: {
    type?: string;
    allocation?: number;
    splits?: Array<{ ref?: string; percentage?: number }>;
  };
  schedule?: {
    type?: string;
    startDate?: string;
    endDate?: string;
  };
}

export async function listFlows(
  apiBaseUrl: string,
  accessToken: string
): Promise<PersonalizeFlow[]> {
  const res = await fetch(`${apiBaseUrl}/v3/flowDefinitions`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Personalize API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const items = (json as { items?: PersonalizeFlow[] })?.items ?? [];
  return items.map((f) => ({ ...f, id: f.ref }));
}

export async function getFlow(
  apiBaseUrl: string,
  accessToken: string,
  flowRef: string
): Promise<PersonalizeFlowDetail> {
  const res = await fetch(
    `${apiBaseUrl}/v3/flowDefinitions/${encodeURIComponent(flowRef)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );
  if (!res.ok) {
    throw new Error(`Personalize API error: ${res.status} ${res.statusText}`);
  }
  const flow: PersonalizeFlowDetail = await res.json();
  return { ...flow, id: flow.ref };
}
