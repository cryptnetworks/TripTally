export type ItemLookupResult = {
  provider: string;
  externalId: string;
  title: string;
  brand?: string;
  retailer: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  productUrl?: string;
  availability?: string;
  lastCheckedAt: string;
};

export type SearchOptions = {
  limit?: number;
};

export interface RetailerLookupProvider {
  searchItems(query: string, options?: SearchOptions): Promise<ItemLookupResult[]>;
  getItemDetails(externalId: string): Promise<ItemLookupResult | null>;
}
