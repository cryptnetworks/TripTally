import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

function UserText({ value }: { value: string }) {
  return <p>{value}</p>;
}

describe("safe rendering", () => {
  it("escapes user-controlled text by default", () => {
    const html = renderToStaticMarkup(<UserText value={'<img src=x onerror="alert(1)">'} />);

    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
  });
});
