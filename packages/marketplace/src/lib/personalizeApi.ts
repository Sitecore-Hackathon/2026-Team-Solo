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
  templates?: string[];
}

/**
 * Extract API response template strings from a raw flow definition.
 * Checks known locations in the flow structure, then falls back
 * to a recursive search for any string containing FreeMarker or contentKey.
 */
export function extractTemplatesFromFlow(
  flow: Record<string, unknown>
): string[] {
  const templates: string[] = [];

  const variants = flow.variants as
    | Array<Record<string, unknown>>
    | undefined;
  if (Array.isArray(variants)) {
    for (const variant of variants) {
      // Check tasks[].input.template (Personalize stores FreeMarker here)
      const tasks = variant.tasks as
        | Array<Record<string, unknown>>
        | undefined;
      if (Array.isArray(tasks)) {
        for (const task of tasks) {
          const input = task.input as Record<string, unknown> | undefined;
          if (input && typeof input.template === "string") {
            templates.push(input.template);
          }
        }
      }
      // Check actions[].template / actions[].templateHtml
      const actions = variant.actions as
        | Array<Record<string, unknown>>
        | undefined;
      if (Array.isArray(actions)) {
        for (const action of actions) {
          if (typeof action.template === "string") templates.push(action.template);
          if (typeof action.templateHtml === "string") templates.push(action.templateHtml);
          if (typeof action.implementation === "string") templates.push(action.implementation);
        }
      }
      // Check variant-level template fields
      if (typeof variant.template === "string") templates.push(variant.template);
      if (typeof variant.templateHtml === "string") templates.push(variant.templateHtml);
    }
  }

  if (templates.length === 0) {
    collectTemplateStrings(flow, templates);
  }

  return templates;
}

function collectTemplateStrings(
  obj: unknown,
  results: string[],
  depth = 0
): void {
  if (depth > 15) return;
  if (typeof obj === "string" && (obj.includes("<#") || obj.includes("contentKey"))) {
    results.push(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) collectTemplateStrings(item, results, depth + 1);
  } else if (obj && typeof obj === "object") {
    for (const value of Object.values(obj))
      collectTemplateStrings(value, results, depth + 1);
  }
}

export async function listFlows(
  apiBaseUrl: string,
  accessToken: string
): Promise<PersonalizeFlow[]> {
  const url = new URL(`${apiBaseUrl}/v3/flowDefinitions`);
  url.searchParams.set("expand", "true");
  url.searchParams.set("offset", "0");
  url.searchParams.set("limit", "10000");
  const res = await fetch(url.toString(), {
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
