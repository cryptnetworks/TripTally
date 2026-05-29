import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeedbackAlert } from "@/components/FeedbackAlert";

describe("FeedbackAlert", () => {
  it("renders errors with an alert role", () => {
    const html = renderToStaticMarkup(
      createElement(FeedbackAlert, {
        feedback: { tone: "error", message: "Please check the form and try again." }
      })
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Please check the form and try again.");
  });

  it("renders success messages as polite status updates", () => {
    const html = renderToStaticMarkup(
      createElement(FeedbackAlert, {
        feedback: { tone: "success", message: "Expense added." }
      })
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });
});
