import type { UserFeedback } from "@/lib/user-messages";

export function FeedbackAlert({
  feedback,
  className = ""
}: {
  feedback: UserFeedback | null | undefined;
  className?: string;
}) {
  if (!feedback) return null;

  const toneClass =
    feedback.tone === "success"
      ? "border-ocean/20 bg-brand-soft text-ocean"
      : feedback.tone === "info"
        ? "border-line bg-surface text-ink"
        : "border-coral/20 bg-red-50 text-coral";

  return (
    <div
      className={`rounded-lg border p-3 text-sm leading-6 ${toneClass} ${className}`.trim()}
      role={feedback.tone === "error" ? "alert" : "status"}
      aria-live={feedback.tone === "error" ? "assertive" : "polite"}
    >
      {feedback.message}
    </div>
  );
}
