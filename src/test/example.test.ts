import { describe, it, expect } from "vitest";

describe("White Box Testing Way2Home", () => {
  it("memastikan lingkungan testing berjalan", () => {
    const result = 10 + 20;

    expect(result).toBe(30);
  });
});