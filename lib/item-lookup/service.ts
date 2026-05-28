import { getAppConfig } from "@/lib/config";
import { createLookupProvider } from "@/lib/item-lookup/providers";
import type { ItemLookupResult } from "@/lib/item-lookup/types";
import { prisma } from "@/lib/prisma";

export async function searchItems(query: string): Promise<ItemLookupResult[]> {
  const config = getAppConfig();
  const normalizedQuery = query.trim().toLowerCase();
  if (!config.itemLookupEnabled || normalizedQuery.length < 2) return [];

  const cached = await prisma.retailerLookupCache.findUnique({
    where: {
      provider_query_externalId: {
        provider: config.itemLookupProvider,
        query: normalizedQuery,
        externalId: ""
      }
    }
  });
  if (cached && cached.expiresAt > new Date()) {
    return JSON.parse(cached.resultJson) as ItemLookupResult[];
  }

  const provider = createLookupProvider(config.itemLookupProvider);
  const expiresAt = new Date(Date.now() + config.itemLookupCacheTtlSeconds * 1000);

  try {
    const results = await provider.searchItems(normalizedQuery);
    await prisma.retailerLookupCache.upsert({
      where: {
        provider_query_externalId: {
          provider: config.itemLookupProvider,
          query: normalizedQuery,
          externalId: ""
        }
      },
      update: { resultJson: JSON.stringify(results), error: null, expiresAt },
      create: {
        provider: config.itemLookupProvider,
        query: normalizedQuery,
        externalId: "",
        resultJson: JSON.stringify(results),
        expiresAt
      }
    });
    return results;
  } catch (error) {
    await prisma.retailerLookupCache.upsert({
      where: {
        provider_query_externalId: {
          provider: config.itemLookupProvider,
          query: normalizedQuery,
          externalId: ""
        }
      },
      update: { error: error instanceof Error ? error.message : "Lookup failed", expiresAt },
      create: {
        provider: config.itemLookupProvider,
        query: normalizedQuery,
        externalId: "",
        resultJson: "[]",
        error: error instanceof Error ? error.message : "Lookup failed",
        expiresAt
      }
    });
    return [];
  }
}
