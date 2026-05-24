/**
 * @jest-environment node
 */
import { POST } from "@/app/api/shorten/route";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

jest.mock("@/lib/db", () => ({
  db: {
    link: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: {
    set: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock("nanoid", () => ({
  nanoid: () => "testcode",
}));

describe("POST /api/shorten", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a short URL and cache it in Redis", async () => {
    const mockRequest = new Request("http://localhost/api/shorten", {
      method: "POST",
      body: JSON.stringify({ originalUrl: "https://example.com" }),
    });

    (db.link.findUnique as jest.Mock).mockResolvedValue(null);
    (db.link.create as jest.Mock).mockResolvedValue({
      id: "1",
      originalUrl: "https://example.com",
      shortCode: "testcode",
    });

    const response = await POST(mockRequest);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.originalUrl).toBe("https://example.com");
    expect(db.link.create).toHaveBeenCalled();
    expect(redis?.set).toHaveBeenCalledWith(expect.stringContaining("link:"), "https://example.com");
  });
  
  it("should return 400 if validation fails", async () => {
    const mockRequest = new Request("http://localhost/api/shorten", {
      method: "POST",
      body: JSON.stringify({ originalUrl: "not-a-url" }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });
});
