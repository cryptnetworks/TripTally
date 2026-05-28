import { MobileNav } from "@/components/MobileNav";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 md:py-8">{children}</main>
      <MobileNav />
    </div>
  );
}
