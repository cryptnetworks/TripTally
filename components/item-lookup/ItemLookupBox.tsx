"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { FeedbackAlert } from "@/components/FeedbackAlert";
import type { ItemLookupResult } from "@/lib/item-lookup/types";

export function ItemLookupBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemLookupResult[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function search() {
    startTransition(async () => {
      setError("");
      try {
        const response = await fetch(`/api/item-lookup/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("lookup_failed");
        const payload = (await response.json()) as { results: ItemLookupResult[] };
        setResults(payload.results);
      } catch {
        setResults([]);
        setError("Item lookup is unavailable right now. You can still enter the item manually.");
      }
    });
  }

  function applyResult(result: ItemLookupResult) {
    const title = document.querySelector<HTMLInputElement>("#title");
    const amount = document.querySelector<HTMLInputElement>("#amount");
    if (title) title.value = result.title;
    if (amount && result.price !== undefined) amount.value = result.price.toFixed(2);
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <label className="label" htmlFor="itemLookup">
        Item lookup
      </label>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="field"
          id="itemLookup"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search product catalog"
        />
        <button className="btn-secondary" type="button" onClick={search} disabled={isPending}>
          <Search className="h-4 w-4" aria-hidden />
          <span className="sr-only">Search</span>
        </button>
      </div>
      <FeedbackAlert feedback={error ? { tone: "error", message: error } : null} className="mt-3" />
      {results.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {results.map((result) => (
            <button
              key={result.externalId}
              className="rounded-lg border border-line bg-white p-3 text-left text-sm hover:border-ocean"
              type="button"
              onClick={() => applyResult(result)}
            >
              <span className="block font-semibold text-ink">{result.title}</span>
              <span className="text-muted">
                {result.retailer}
                {result.price === undefined
                  ? ""
                  : ` - ${result.currency} ${result.price.toFixed(2)}`}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
