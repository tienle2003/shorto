import { linkSchema } from "@/lib/validations/link.schema";

describe("Link Validation Schema", () => {
  it("should accept a valid URL", () => {
    const result = linkSchema.safeParse({ originalUrl: "https://example.com" });
    expect(result.success).toBe(true);
  });

  it("should reject an invalid URL", () => {
    const result = linkSchema.safeParse({ originalUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("should reject an empty string", () => {
    const result = linkSchema.safeParse({ originalUrl: "" });
    expect(result.success).toBe(false);
  });
});
