/**
 * @jest-environment node
 */
import { GET } from "@/app/[code]/route";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

jest.mock("@/lib/db", () => ({
  db: {
    link: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/redis", () => ({
  redis: {
    set: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock `after` from `next/server`
jest.mock("next/server", () => {
  const original = jest.requireActual("next/server");
  return {
    ...original,
    after: jest.fn((callback) => callback()), // execute immediately for test
  };
});

describe("GET /[code]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return cached URL from Redis if available", async () => {
    const mockRequest = new Request("http://localhost/testcode");
    const mockParams = Promise.resolve({ code: "testcode" });

    (redis?.get as jest.Mock).mockResolvedValue("https://cached-url.com");

    const response = await GET(mockRequest, { params: mockParams });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cached-url.com/");
    expect(db.link.findUnique).not.toHaveBeenCalled();
    
    // Check if background click increment was fired
    expect(db.link.update).toHaveBeenCalledWith({
      where: { shortCode: "testcode" },
      data: { clicks: { increment: 1 } },
    });
  });

  it("should fetch from DB and cache in Redis if not in cache", async () => {
    const mockRequest = new Request("http://localhost/testcode2");
    const mockParams = Promise.resolve({ code: "testcode2" });

    (redis?.get as jest.Mock).mockResolvedValue(null);
    (db.link.findUnique as jest.Mock).mockResolvedValue({
      id: "link-123",
      originalUrl: "https://db-url.com",
    });

    const response = await GET(mockRequest, { params: mockParams });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://db-url.com/");
    expect(db.link.findUnique).toHaveBeenCalledWith({ where: { shortCode: "testcode2" }});
    expect(redis?.set).toHaveBeenCalledWith("link:testcode2", "https://db-url.com");
    
    expect(db.link.update).toHaveBeenCalledWith({
      where: { id: "link-123" },
      data: { clicks: { increment: 1 } },
    });
  });
  
  it("should redirect to root if link not found in DB and not in cache", async () => {
    const mockRequest = new Request("http://localhost/notfound");
    const mockParams = Promise.resolve({ code: "notfound" });

    (redis?.get as jest.Mock).mockResolvedValue(null);
    (db.link.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await GET(mockRequest, { params: mockParams });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
    expect(redis?.set).not.toHaveBeenCalled();
    expect(db.link.update).not.toHaveBeenCalled();
  });
});
