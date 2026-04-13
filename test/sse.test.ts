import { describe, it, expect } from "vitest";
import { formatSSEEvent, formatSSEErrorEvent } from "../src/sse.js";

describe("formatSSEEvent", () => {
  it("formats object data", () => {
    expect(formatSSEEvent({ key: "value" })).toBe(
      'data: {"key":"value"}\n\n',
    );
  });

  it("formats string data", () => {
    expect(formatSSEEvent("hello")).toBe('data: "hello"\n\n');
  });

  it("formats null", () => {
    expect(formatSSEEvent(null)).toBe("data: null\n\n");
  });

  it("formats number", () => {
    expect(formatSSEEvent(42)).toBe("data: 42\n\n");
  });

  it("formats empty object", () => {
    expect(formatSSEEvent({})).toBe("data: {}\n\n");
  });
});

describe("formatSSEErrorEvent", () => {
  it("prefixes with event: error", () => {
    const result = formatSSEErrorEvent({ code: 500 });
    expect(result).toBe('event: error\ndata: {"code":500}\n\n');
  });

  it("formats null error data", () => {
    expect(formatSSEErrorEvent(null)).toBe("event: error\ndata: null\n\n");
  });
});
