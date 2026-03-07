"use client";

import { MarketplaceProvider } from "./MarketplaceProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <MarketplaceProvider>{children}</MarketplaceProvider>;
}
