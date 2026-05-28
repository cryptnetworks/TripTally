import { BrandLogo } from "@/components/BrandLogo";

export function BrandLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-page px-4 py-10">
      <div className="flex flex-col items-center gap-5">
        <BrandLogo priority />
        <div
          className="h-11 w-11 animate-spin rounded-full border-4 border-ocean/20 border-t-ocean"
          role="status"
          aria-label="Loading Trip Tally"
        />
      </div>
    </main>
  );
}
