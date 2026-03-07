"use client";

import { useMemo } from "react";

export interface PageRendering {
  renderingId: string;
  instanceId: string;
  componentName: string;
  placeholderKey?: string;
  datasource?: string;
}

interface LayoutRendering {
  id?: string;
  instanceId?: string;
  placeholderKey?: string;
  dataSource?: string;
  parameters?: Record<string, string>;
}

interface LayoutDevice {
  id?: string;
  layoutId?: string;
  renderings?: LayoutRendering[];
  placeholders?: unknown[];
}

interface LayoutJson {
  devices?: LayoutDevice[];
}

/**
 * Parse presentation details (JSON or XML) into a list of renderings.
 * XMC Pages uses JSON format: {"devices":[{"renderings":[...]}]}
 */
export function parsePresentationDetails(
  presentationDetails: string | null | undefined
): PageRendering[] {
  if (!presentationDetails || typeof presentationDetails !== "string") {
    return [];
  }

  const trimmed = presentationDetails.trim();

  // JSON format (XMC Pages)
  if (trimmed.startsWith("{")) {
    return parseJsonLayout(trimmed);
  }

  // XML format (legacy)
  if (trimmed.startsWith("<")) {
    return parseXmlLayout(trimmed);
  }

  return [];
}

function parseJsonLayout(json: string): PageRendering[] {
  try {
    const layout: LayoutJson = JSON.parse(json);
    const renderings: PageRendering[] = [];

    for (const device of layout.devices ?? []) {
      for (const r of device.renderings ?? []) {
        if (!r.id) continue;
        renderings.push({
          renderingId: r.id,
          instanceId: r.instanceId ?? r.id,
          componentName: r.id,
          placeholderKey: r.placeholderKey,
          datasource: r.dataSource || undefined,
        });
      }
    }
    return renderings;
  } catch {
    return [];
  }
}

function parseXmlLayout(xml: string): PageRendering[] {
  const renderings: PageRendering[] = [];
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const dElements = doc.getElementsByTagName("d");

    for (let d = 0; d < dElements.length; d++) {
      const rElements = dElements[d].getElementsByTagName("r");
      for (let i = 0; i < rElements.length; i++) {
        const el = rElements[i];
        const id =
          el.getAttribute("s:id") ??
          el.getAttribute("id") ??
          el.getAttribute("uid") ??
          "";
        if (!id) continue;
        renderings.push({
          renderingId: id,
          instanceId: el.getAttribute("uid") ?? id,
          componentName: id,
          placeholderKey: el.getAttribute("s:ph") ?? el.getAttribute("ph") ?? undefined,
          datasource: el.getAttribute("s:ds") ?? el.getAttribute("ds") ?? undefined,
        });
      }
    }
  } catch {
    // ignore parse errors
  }
  return renderings;
}

export function usePageComponents(
  presentationDetails: string | null | undefined
): PageRendering[] {
  return useMemo(
    () => parsePresentationDetails(presentationDetails),
    [presentationDetails]
  );
}
